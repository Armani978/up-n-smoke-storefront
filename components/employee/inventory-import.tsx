"use client";

import { FileCheck2, FileSpreadsheet, UploadCloud } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type ImportResult = { dry_run: boolean; total_rows: number; matched_count: number; created_count: number; repaired_count: number; level_count: number; message?: string };

export function InventoryImport() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  async function upload(dryRun: boolean) { if (!file) return; setBusy(true); const form = new FormData(); form.set("file", file); form.set("dryRun", String(dryRun)); const response = await fetch("/api/employee/inventory-import", { method: "POST", body: form }); setResult(await response.json()); setBusy(false); }
  const changes = (result?.matched_count ?? 0) + (result?.created_count ?? 0) + (result?.repaired_count ?? 0) + (result?.level_count ?? 0);
  return <section className="import-console"><header><div><FileSpreadsheet /><span><small>Daily catalog operation</small><h2>CLOVER XLSX → MEDUSA</h2></span></div><a href="/UP-N-SMOKE-Medusa-Inventory-Template.xlsx" download>Download template ↓</a></header><p>Preview the complete workbook before applying product, title, and inventory-level changes. Apply is restricted to administrators.</p><label className="file-drop"><UploadCloud /><b>{file?.name ?? "DROP OR SELECT AN XLSX WORKBOOK"}</b><span>Maximum 10 MB · no changes happen during preview</span><input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setResult(null); }} /></label><div className="import-actions"><Button onClick={() => void upload(true)} disabled={!file || busy}>{busy ? "Reading…" : "Preview import"}</Button>{result?.dry_run && changes > 0 && <Button variant="dark" onClick={() => void upload(false)} disabled={busy}><FileCheck2 /> Apply {changes} changes</Button>}</div>{result && <div className={result.message ? "import-result error" : "import-result"}>{result.message ? <b>{result.message}</b> : <><b>{result.dry_run ? "PREVIEW READY" : "MEDUSA UPDATED"}</b><span>{result.total_rows} rows</span><span>{result.matched_count} stock matches</span><span>{result.created_count} new products</span><span>{result.repaired_count} repaired links</span></>}</div>}</section>;
}
