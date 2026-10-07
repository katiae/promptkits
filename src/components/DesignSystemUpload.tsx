import { useState } from "react";
import { Upload, FileArchive, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inspectDesignSystemZip } from "@/lib/design-system-import";
import type { ScanReport } from "@/lib/security-scanner";

export function DesignSystemUpload({ onPrepared, disabled = false }: { onPrepared: (base64: string | null, blocked?: boolean) => void; disabled?: boolean }) {
  const [name, setName] = useState("");
  const [report, setReport] = useState<ScanReport | null>(null);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const choose = async (file?: File) => {
    if (!file) return;
    onPrepared(null, true); setName(file.name); setReport(null); setBusy(true);
    try {
      if (!/\.zip$/i.test(file.name) || file.size > 5_000_000) throw new Error("Choose a .zip file smaller than 5 MB.");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const result = inspectDesignSystemZip(bytes);
      setReport(result.report); setCount(result.count);
      if (result.report.ok) {
        let text = "";
        for (let i = 0; i < bytes.length; i += 8192) text += String.fromCharCode(...bytes.subarray(i, i + 8192));
        onPrepared(btoa(text));
      }
    } catch (e) {
      setReport({ ok: false, scannedAt: new Date().toISOString(), findings: [{ severity: "block", rule: "archive", detail: e instanceof Error ? e.message : "Unable to scan ZIP." }] });
    } finally { setBusy(false); }
  };
  return <div className="mt-5 space-y-3">
    <label onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (!disabled && !busy) void choose(e.dataTransfer.files[0]); }} className={`flex flex-col items-center gap-2 rounded-xl border border-dashed border-input bg-card px-5 py-6 text-center text-sm ${disabled || busy ? "opacity-50" : "cursor-pointer hover:border-ring"}`}>
      <input aria-label="Design system ZIP" type="file" accept=".zip,application/zip" className="sr-only" disabled={disabled || busy} onChange={(e) => { void choose(e.target.files?.[0]); e.target.value = ""; }} />
      {name ? <FileArchive className="size-5 text-primary" /> : <Upload className="size-5 text-muted-foreground" />}
      <span className="max-w-full break-all text-foreground">{busy ? "Scanning package…" : name || "Upload design system ZIP"}</span>
      <span className="text-xs text-muted-foreground">Claude or another tool · up to 5 MB</span>
    </label>
    {report && <div role="status" className="space-y-2 text-sm">
      <p className={`flex items-center gap-2 ${report.ok ? "text-primary" : "text-destructive"}`}><ShieldCheck className="size-4 shrink-0" />{report.ok ? `Scan passed${report.findings.length ? " with warnings" : ""} · ${count} files` : "Upload blocked"}</p>
      {report.findings.length > 0 && <ul className="max-h-48 space-y-2 overflow-auto pr-3">{report.findings.map((f, i) => <li key={i} className={`break-words text-xs ${f.severity === "block" ? "text-destructive" : "text-muted-foreground"}`}>{f.detail}</li>)}</ul>}
      {report.ok && <p className="text-xs text-muted-foreground">Save the template to use these files for downloads and guidelines. This replaces its current design system.</p>}
      <Button variant="ghost" size="sm" onClick={() => { setReport(null); setName(""); onPrepared(null); }}>Remove ZIP</Button>
    </div>}
    <p className="text-xs leading-relaxed text-muted-foreground">Static security checks are not an antivirus guarantee. Uploaded code is never run; previews are isolated. Review dependency warnings before distributing.</p>
  </div>;
}