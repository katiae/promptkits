import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { entriesQuery, normalizeTags, slugify, type Entry } from "@/lib/entries";
import { buildReport, type ScanReport } from "@/lib/security-scanner";
import { autofillEntry } from "@/lib/autofill.functions";
import { captureThumbnail } from "@/lib/thumbnail";
import type { Json } from "@/integrations/supabase/types";
import { useServerFn } from "@tanstack/react-start";
import { generateDesignSystem, listDesignSystemStatus } from "@/lib/design-system-gen.functions";

type DsStatus = { entry_id: string; status: string; error: string | null; updated_at: string };

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Promptfolio" },
      { name: "description", content: "Manage interface templates, demos and prompts." },
      { property: "og:title", content: "Admin — Promptfolio" },
      { property: "og:description", content: "Manage the directory." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

type Form = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  tags: string;
  demo_url: string;
  thumbnail_url: string;
  prompt: string;
  status: string;
  hue: number;
  html_content: string;
  html_name: string;
};

const blank: Form = {
  name: "", slug: "", description: "", category: "Landing page", tags: "",
  demo_url: "", thumbnail_url: "", prompt: "", status: "published", hue: 150, html_content: "", html_name: "",
};

const toForm = (e: Entry): Form => ({
  id: e.id, name: e.name, slug: e.slug, description: e.description, category: e.category,
  tags: e.tags.join(", "), demo_url: e.demo_url ?? "",
  thumbnail_url: e.thumbnail_url ?? "", prompt: e.prompt, status: e.status, hue: e.hue,
  html_content: e.html_content ?? "", html_name: e.html_content ? "Current file" : "",
});

function Admin() {
  const qc = useQueryClient();
  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return false;
      // Only the owner's account can become admin (enforced in the database too).
      await supabase.rpc("claim_admin");
      const { data: rows } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin");
      return !!rows?.length;
    },
  });
  const { data: entries = [] } = useQuery({ ...entriesQuery(true), enabled: !!isAdmin });
  const [form, setForm] = useState<Form | null>(null);
  const [autofilling, setAutofilling] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const fetchDsStatus = useServerFn(listDesignSystemStatus);
  const generateDs = useServerFn(generateDesignSystem);
  const { data: dsStatus = [] } = useQuery({ queryKey: ["ds-status"], queryFn: () => fetchDsStatus(), enabled: !!isAdmin });
  const [generating, setGenerating] = useState<Set<string>>(new Set());
  // Leaving or refreshing the page stops a running generation, so warn first.
  useEffect(() => {
    if (!generating.size) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [generating.size]);
  const runGenerate = async (entryId: string, name: string) => {
    setGenerating((s) => new Set(s).add(entryId));
    const t = toast.loading(`Building the ${name} design system — this takes a minute or two…`);
    try {
      const r = await generateDs({ data: { entryId } });
      if (r.ok) toast.success(`${name} design system is ready`, { id: t });
      else toast.error(r.error, { id: t });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed", { id: t });
    } finally {
      setGenerating((s) => { const n = new Set(s); n.delete(entryId); return n; });
      qc.invalidateQueries({ queryKey: ["ds-status"] });
      qc.invalidateQueries({ queryKey: ["design-systems"] });
    }
  };

  const autofill = async () => {
    if (!form || form.prompt.trim().length < 20) {
      toast.error("Paste the build prompt first");
      return;
    }
    setAutofilling(true);
    try {
      const meta = await autofillEntry({ data: { prompt: form.prompt, existingTags } });
      setForm((f) =>
        f && {
          ...f,
          name: meta.name,
          slug: slugify(meta.name),
          description: meta.description,
          category: meta.category,
          tags: meta.tags.join(", "),
          hue: Math.max(0, Math.min(360, Math.round(meta.hue))),
        },
      );
      toast.success("Fields filled — edit anything you like");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Auto-fill failed");
    } finally {
      setAutofilling(false);
    }
  };
  const report: ScanReport | null = form ? buildReport(form.html_content || null, form.prompt) : null;

  // All tags already in use, sorted — reused for suggestions so tags stay consistent.
  const existingTags = [...new Set(entries.flatMap((e) => e.tags))].sort();

  const onFile = async (file?: File) => {
    if (!file) return;
    if (!/\.html?$/i.test(file.name)) { toast.error("Please choose an .html file"); return; }
    if (file.size > 2_000_000) { toast.error("File is larger than 2 MB"); return; }
    const text = await file.text();
    setForm((f) => f && { ...f, html_content: text, html_name: file.name });
  };

  if (isLoading) return <p className="py-32 text-center text-muted-foreground">Loading…</p>;
  if (!isAdmin)
    return (
      <main className="mx-auto max-w-md px-6 py-28 text-center">
        <h1 className="font-serif text-4xl">Page not found</h1>
        <Link to="/" className="mt-6 inline-block text-primary">← Back home</Link>
      </main>
    );

  const snap = async (html: string) => {
    setCapturing(true);
    try {
      return await captureThumbnail(html);
    } catch (e) {
      toast.error("Couldn't capture the thumbnail — saving without it");
      console.error(e);
      return null;
    } finally {
      setCapturing(false);
    }
  };

  const regenerate = async () => {
    if (!form?.html_content) return;
    const url = await snap(form.html_content);
    if (url) { setForm((f) => f && { ...f, thumbnail_url: url }); toast.success("Thumbnail updated — save to keep it"); }
  };

  const save = async () => {
    if (!form) return;
    let thumb = form.thumbnail_url;
    const original = form.id ? entries.find((e) => e.id === form.id) : undefined;
    const htmlChanged = !!form.html_content && form.html_content !== (original?.html_content ?? "");
    if (form.html_content && (htmlChanged || !thumb) && !(report && !report.ok)) {
      thumb = (await snap(form.html_content)) ?? thumb;
    }
    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      description: form.description,
      category: form.category,
      tags: normalizeTags(form.tags.split(",")),
      original_url: null,
      demo_url: form.demo_url || null,
      thumbnail_url: thumb || null,
      prompt: form.prompt,
      status: form.status,
      hue: Number(form.hue) || 150,
      html_content: form.html_content || null,
      scan_report: (report as unknown as Json) ?? null,
      updated_at: new Date().toISOString(),
    };
    if (!payload.name) { toast.error("Name is required"); return; }
    if (report && !report.ok) { toast.error("Security scan blocked this template — fix the flagged issues first"); return; }
    const isNew = !form.id;
    const { data: saved, error } = form.id
      ? await supabase.from("entries").update(payload).eq("id", form.id).select("id").single()
      : await supabase.from("entries").insert(payload).select("id").single();
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    setForm(null);
    qc.invalidateQueries();
    // New templates with a demo get their own design system automatically.
    if (isNew && saved && payload.html_content) runGenerate(saved.id, payload.name);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    const { error } = await supabase.from("entries").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries();
  };

  const field = (k: keyof Form, label: string, multiline = false) => (
    <label className="block">
      <span className="label-mono text-muted-foreground">{label}</span>
      {multiline ? (
        <textarea
          value={String(form?.[k] ?? "")}
          onChange={(e) => setForm((f) => f && { ...f, [k]: e.target.value })}
          rows={10}
          className="mt-1 w-full rounded-xl border border-input bg-card p-3 font-mono text-sm outline-none focus:border-ring"
        />
      ) : (
        <input
          value={String(form?.[k] ?? "")}
          onChange={(e) => setForm((f) => f && { ...f, [k]: e.target.value })}
          className="mt-1 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring"
        />
      )}
    </label>
  );

  return (
    <main className="mx-auto max-w-[1600px] px-6 pt-12">
      <div className="flex items-end">
        <div>
          <p className="label-mono text-muted-foreground">Admin</p>
          <h1 className="mt-2 font-serif text-5xl tracking-tight">Entries</h1>
        </div>
        <button onClick={() => setForm({ ...blank })} className="ml-auto rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">
          New entry
        </button>
      </div>

      {form && (
        <div className="mt-8 grid gap-4 rounded-3xl bg-tray p-6 md:grid-cols-2">
          {field("name", "Name")}
          {field("slug", "Slug (auto if empty)")}
          {field("description", "One-line description")}
          {field("category", "Category")}
          <div>
            {field("tags", "Tags (comma separated)")}
            {existingTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {existingTags.map((t) => {
                  const active = normalizeTags(form.tags.split(",")).includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() =>
                        setForm((f) => {
                          if (!f) return f;
                          const current = normalizeTags(f.tags.split(","));
                          const next = active ? current.filter((x) => x !== t) : [...current, t];
                          return { ...f, tags: next.join(", ") };
                        })
                      }
                      className={`rounded-full px-2.5 py-0.5 text-xs ${
                        active ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {field("demo_url", "Live demo URL (optional if you upload HTML)")}
          <div className="block">
            <span className="label-mono text-muted-foreground">Thumbnail</span>
            <div className="mt-1 flex items-center gap-3">
              {form.thumbnail_url ? (
                <img src={form.thumbnail_url} alt="Thumbnail preview" className="h-16 w-26 rounded-md border border-border object-cover object-top" />
              ) : (
                <span className="text-xs text-muted-foreground">Captured automatically from the HTML when you save.</span>
              )}
              {form.html_content && (
                <button type="button" onClick={regenerate} disabled={capturing} className="rounded-full border border-border px-3 py-1 text-xs hover:bg-secondary">
                  {capturing ? "Capturing…" : "📸 Regenerate thumbnail"}
                </button>
              )}
            </div>
          </div>
          {field("hue", "Orb colour hue (0–360)")}
          <label className="block">
            <span className="label-mono text-muted-foreground">Status</span>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="mt-1 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending review</option>
            </select>
          </label>
          <div className="md:col-span-2">
            {field("prompt", "Build prompt", true)}
            <p className="mt-1 text-xs text-muted-foreground">
              Cover four sections: Overview, Layout &amp; structure, Styling, and Animations &amp; transitions.
            </p>
            <button
              type="button"
              onClick={autofill}
              disabled={autofilling}
              className="mt-2 rounded-full border border-border px-4 py-1.5 text-sm hover:bg-secondary disabled:opacity-50"
            >
              {autofilling ? "Filling fields…" : "✨ Auto-fill fields from prompt"}
            </button>
          </div>
          <div className="md:col-span-2">
            <span className="label-mono text-muted-foreground">Template HTML file (demo + download)</span>
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}
              className="mt-1 flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed border-input bg-card px-4 py-6 text-center text-sm text-muted-foreground hover:border-ring"
            >
              <input type="file" accept=".html,.htm,text/html" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
              {form.html_name ? <span className="text-foreground">{form.html_name}</span> : <span>Drop your .html file here or click to choose</span>}
              <span className="text-xs">Scanned automatically before it can be saved</span>
            </label>
            {form.html_content && (
              <button onClick={() => setForm({ ...form, html_content: "", html_name: "" })} className="mt-1 text-xs text-muted-foreground underline">Remove file</button>
            )}
          </div>
          {report && (
            <div className="md:col-span-2 rounded-xl bg-card p-4 text-sm">
              <p className="label-mono">
                Security scan ·{" "}
                <span className={report.ok ? (report.findings.length ? "text-heart" : "text-primary") : "text-destructive"}>
                  {!report.ok ? "Blocked" : report.findings.length ? "Passed with warnings" : "Clean"}
                </span>
              </p>
              {report.findings.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {report.findings.map((f, i) => (
                    <li key={i} className={f.severity === "block" ? "text-destructive" : "text-muted-foreground"}>
                      {f.severity === "block" ? "✕" : "!"} {f.detail}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="flex gap-2 md:col-span-2">
            <button onClick={save} disabled={(!!report && !report.ok) || capturing} className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground disabled:opacity-60">{capturing ? "Capturing thumbnail…" : "Save"}</button>
            <button onClick={() => setForm(null)} className="rounded-full border border-border px-5 py-2 text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
        {entries.map((e) => (
          <div key={e.id} className="flex items-center gap-4 px-5 py-3.5">
            <div className="min-w-0">
              <Link to="/sites/$slug" params={{ slug: e.slug }} className="font-serif text-lg">{e.name}</Link>
              <p className="truncate text-sm text-muted-foreground">{e.category} · {e.status}</p>
            </div>
            <div className="ml-auto flex items-center gap-2 text-sm">
              <DesignSystemCell entry={e} status={dsStatus.find((d) => d.entry_id === e.id)} busy={generating.has(e.id)} onGenerate={() => runGenerate(e.id, e.name)} />
              <button onClick={() => setForm(toForm(e))} className="rounded-full border border-border px-3 py-1 hover:bg-secondary">Edit</button>
              <button onClick={() => remove(e.id)} className="rounded-full border border-border px-3 py-1 text-destructive hover:bg-secondary">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function DesignSystemCell({ entry, status, busy, onGenerate }: { entry: Entry; status?: DsStatus | undefined; busy: boolean; onGenerate: () => void }) {
  const bundled = entry.slug === "midnight-cadence";
  if (bundled) return <span className="label-mono text-muted-foreground">Design system · hand-built</span>;
  const btn = "rounded-full border border-border px-3 py-1 hover:bg-secondary disabled:opacity-60";
  if (busy) return <span className="label-mono animate-pulse text-muted-foreground">Generating… keep this page open</span>;
  return (
    <>
      {status?.status === "ready" && (
        <>
          <span className="label-mono text-primary">Design system ready</span>
          <Link to="/sites/$slug/design-system" params={{ slug: entry.slug }} className={btn}>Preview</Link>
        </>
      )}
      {status?.status === "failed" && <span className="label-mono max-w-56 truncate text-destructive" title={status.error ?? ""}>Failed: {status.error}</span>}
      <button onClick={onGenerate} disabled={!entry.prompt && !entry.html_content} className={btn}>
        {status ? "Regenerate" : "✨ Generate design system"}
      </button>
    </>
  );
}
