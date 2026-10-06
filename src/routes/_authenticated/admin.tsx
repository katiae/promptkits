import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { entriesQuery, slugify, type Entry } from "@/lib/entries";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Promptfolio" },
      { name: "description", content: "Manage recreations, demos and prompts." },
      { property: "og:title", content: "Admin — Promptfolio" },
      { property: "og:description", content: "Manage the directory." },
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
  original_url: string;
  demo_url: string;
  thumbnail_url: string;
  prompt: string;
  status: string;
  hue: number;
};

const blank: Form = {
  name: "", slug: "", description: "", category: "Landing page", tags: "", original_url: "",
  demo_url: "", thumbnail_url: "", prompt: "", status: "published", hue: 150,
};

const toForm = (e: Entry): Form => ({
  id: e.id, name: e.name, slug: e.slug, description: e.description, category: e.category,
  tags: e.tags.join(", "), original_url: e.original_url ?? "", demo_url: e.demo_url ?? "",
  thumbnail_url: e.thumbnail_url ?? "", prompt: e.prompt, status: e.status, hue: e.hue,
});

function Admin() {
  const qc = useQueryClient();
  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return false;
      const { data: rows } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin");
      return !!rows?.length;
    },
  });
  const { data: entries = [] } = useQuery({ ...entriesQuery(), enabled: !!isAdmin });
  const [form, setForm] = useState<Form | null>(null);

  const claim = async () => {
    const { data, error } = await supabase.rpc("claim_admin");
    if (error || !data) { toast.error("An admin already exists."); return; }
    toast.success("You're now the admin");
    qc.invalidateQueries({ queryKey: ["is-admin"] });
  };

  if (isLoading) return <p className="py-32 text-center text-muted-foreground">Loading…</p>;
  if (!isAdmin)
    return (
      <main className="mx-auto max-w-md px-6 py-28 text-center">
        <h1 className="font-serif text-4xl">Admin</h1>
        <p className="mt-3 text-muted-foreground">If no admin exists yet, the first person to claim it becomes the owner.</p>
        <button onClick={claim} className="mt-6 rounded-full bg-primary px-5 py-2.5 text-primary-foreground">Claim admin</button>
      </main>
    );

  const save = async () => {
    if (!form) return;
    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      description: form.description,
      category: form.category,
      tags: form.tags.split(",").map((t) => slugify(t)).filter(Boolean),
      original_url: form.original_url || null,
      demo_url: form.demo_url || null,
      thumbnail_url: form.thumbnail_url || null,
      prompt: form.prompt,
      status: form.status,
      hue: Number(form.hue) || 150,
      updated_at: new Date().toISOString(),
    };
    if (!payload.name) { toast.error("Name is required"); return; }
    const { error } = form.id
      ? await supabase.from("entries").update(payload).eq("id", form.id)
      : await supabase.from("entries").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    setForm(null);
    qc.invalidateQueries();
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
    <main className="mx-auto max-w-6xl px-6 pt-12">
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
          {field("tags", "Tags (comma separated)")}
          {field("original_url", "Original site URL")}
          {field("demo_url", "Live demo URL")}
          {field("thumbnail_url", "Thumbnail image URL (optional)")}
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
          </div>
          <div className="flex gap-2 md:col-span-2">
            <button onClick={save} className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground">Save</button>
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
            <div className="ml-auto flex gap-2 text-sm">
              <button onClick={() => setForm(toForm(e))} className="rounded-full border border-border px-3 py-1 hover:bg-secondary">Edit</button>
              <button onClick={() => remove(e.id)} className="rounded-full border border-border px-3 py-1 text-destructive hover:bg-secondary">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
