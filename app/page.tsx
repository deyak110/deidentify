"use client";
import { useState } from "react";

type ApiResponse = { result: string; log: string[]; timestamp: string; error?: string };

export default function HomePage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDeidentify() {
    setError(""); setStatus("");
    if (!input.trim()) { setError("Please paste some text to de-identify."); return; }
    setLoading(true);
    try {
      const response = await fetch("/api/deidentify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: input }) });
      const data: ApiResponse = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to process the request.");
      setOutput(data.result); setLog(data.log); setStatus(`De-identification complete at ${new Date(data.timestamp).toLocaleString()}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally { setLoading(false); }
  }

  async function handleCopy() {
    setError(""); setStatus("");
    if (!output.trim()) { setError("There is no output to copy yet."); return; }
    try { await navigator.clipboard.writeText(output); setStatus("De-identified text copied to clipboard."); }
    catch { setError("Clipboard access failed. Please copy manually."); }
  }

  function handleClear() { setInput(""); setOutput(""); setLog([]); setStatus("All fields cleared."); setError(""); }

  return (
    <main className="page-shell">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <section className="app-card" id="main-content" aria-labelledby="page-title">
        <header className="hero-block">
          <p className="eyebrow">Clinical text utility</p>
          <h1 id="page-title">PHI De-Identifier</h1>
          <p className="lede">Accessible browser-based tool for reviewing and de-identifying pasted clinical text.</p>
          <div className="warning-banner" role="note" aria-label="Privacy notice">Use only in approved workflows. Do not paste real patient identifiers into a public demo environment unless your organisation has approved the hosting arrangement.</div>
        </header>
        <div className="status-stack" aria-live="polite" aria-atomic="true">
          {status ? <p className="status success">{status}</p> : null}
          {error ? <p className="status error">{error}</p> : null}
        </div>
        <section className="panel-grid" aria-label="De-identification workspace">
          <div className="panel">
            <div className="panel-head"><h2>Input text</h2><p>Paste source clinical text below.</p></div>
            <label className="field-label" htmlFor="input-text">Clinical text</label>
            <textarea id="input-text" className="text-area" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste text here" />
          </div>
          <div className="panel">
            <div className="panel-head"><h2>Actions</h2><p>Run de-identification, copy the result, or clear the form.</p></div>
            <div className="button-row">
              <button type="button" className="btn btn-primary" onClick={handleDeidentify} disabled={loading}>{loading ? "Processing…" : "De-identify"}</button>
              <button type="button" className="btn btn-secondary" onClick={handleCopy}>Copy output</button>
              <button type="button" className="btn btn-ghost" onClick={handleClear}>Clear all</button>
            </div>
          </div>
          <div className="panel">
            <div className="panel-head"><h2>De-identified output</h2><p>Review the transformed text before reuse.</p></div>
            <label className="field-label" htmlFor="output-text">Output</label>
            <textarea id="output-text" className="text-area" value={output} readOnly placeholder="De-identified output will appear here" />
          </div>
          <div className="panel">
            <div className="panel-head"><h2>Replacement log</h2><p>Each detected name or pattern appears here.</p></div>
            <div className="log-box" role="log" aria-live="polite">
              {log.length > 0 ? <ul className="log-list">{log.map((entry, index) => <li key={`${entry}-${index}`}>{entry}</li>)}</ul> : <p className="empty-copy">No replacements logged yet.</p>}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}