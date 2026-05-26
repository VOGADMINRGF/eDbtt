"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  dossierUpdateOriginLabel,
  dossierUpdateSectionLabel,
  resolveDossierUpdateStatus,
  resolveDossierUpdateStatusMeta,
  type DossierUpdateOrigin,
  type DossierUpdateSection,
} from "@features/dossier/updateStatusContract";
import type { DossierPublicUpdateContext } from "@features/dossier/updateReadModel";

type DossierBundle = {
  dossier: any;
  claims: any[];
  sources: any[];
  findings: any[];
  findingsRaw?: any[];
  openQuestions: any[];
  updateContext?: DossierPublicUpdateContext | null;
  updateSummary?: {
    total: number;
    reviewRequired: number;
    published: number;
    rejected: number;
  } | null;
};

const CLAIM_KINDS = ["fact", "interpretation", "value", "question"];
const CLAIM_STATUSES = ["open", "supported", "refuted", "unclear"];
const SOURCE_TYPES = ["official", "research", "primary_doc", "quality_media", "stakeholder", "other"];
const QUESTION_STATUSES = ["open", "in_review", "answered", "closed"];
const EDGE_RELS = ["supports", "refutes", "mentions", "depends_on", "questions", "context_for"];
const NODE_TYPES = ["claim", "source", "finding", "open_question"];
const FINDING_VERDICTS = ["supports", "refutes", "unclear", "mixed"];

export default function AdminDossierClient({ dossierId }: { dossierId: string }) {
  const [bundle, setBundle] = useState<DossierBundle | null>(null);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [newClaim, setNewClaim] = useState({
    text: "",
    kind: "fact",
    status: "open",
  });
  const [newSource, setNewSource] = useState({
    url: "",
    title: "",
    publisher: "",
    type: "other",
    snippet: "",
  });
  const [newQuestion, setNewQuestion] = useState({
    text: "",
    status: "open",
  });
  const [newEdge, setNewEdge] = useState({
    fromType: "claim",
    fromId: "",
    toType: "source",
    toId: "",
    rel: "mentions",
  });
  const [newFinding, setNewFinding] = useState({
    claimId: "",
    verdict: "unclear",
    rationale: "",
  });

  const dossierKey = bundle?.dossier?.dossierId ?? dossierId;
  const rawFindings = bundle?.findingsRaw ?? bundle?.findings ?? [];
  const dossierUpdateSummary = bundle?.updateSummary ?? null;

  const claimMap = useMemo(() => {
    const map = new Map<string, any>();
    bundle?.claims?.forEach((c) => map.set(c.claimId, c));
    return map;
  }, [bundle]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const dossierRes = await fetch(`/api/dossiers/${encodeURIComponent(dossierId)}?include=raw`, { cache: "no-store" });
        if (!dossierRes.ok) {
          throw new Error(`Dossier load failed (${dossierRes.status})`);
        }
        const dossierBody = await dossierRes.json();
        const baseBundle: DossierBundle = {
          dossier: dossierBody.dossier,
          claims: dossierBody.claims ?? [],
          sources: dossierBody.sources ?? [],
          findings: dossierBody.findings ?? [],
          findingsRaw: dossierBody.findingsRaw ?? [],
          openQuestions: dossierBody.openQuestions ?? [],
          updateContext: dossierBody.updateContext ?? null,
          updateSummary: dossierBody.updateSummary ?? null,
        };
        const key = dossierBody.dossier?.dossierId ?? dossierId;

        const [revRes, suggRes, disputeRes] = await Promise.all([
          fetch(`/api/dossiers/${encodeURIComponent(key)}/revisions`, { cache: "no-store" }),
          fetch(`/api/dossiers/${encodeURIComponent(key)}/suggestions`, { cache: "no-store" }),
          fetch(`/api/dossiers/${encodeURIComponent(key)}/disputes`, { cache: "no-store" }),
        ]);

        const [revBody, suggBody, disputeBody] = await Promise.all([
          revRes.ok ? revRes.json() : Promise.resolve({ items: [] }),
          suggRes.ok ? suggRes.json() : Promise.resolve({ items: [] }),
          disputeRes.ok ? disputeRes.json() : Promise.resolve({ items: [] }),
        ]);

        if (!active) return;
        setBundle(baseBundle);
        setRevisions(revBody.items ?? []);
        setSuggestions(suggBody.items ?? []);
        setDisputes(disputeBody.items ?? []);
      } catch (err: any) {
        if (active) setError(err?.message ?? "load_failed");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [dossierId]);

  useEffect(() => {
    if (!bundle?.claims?.length) return;
    setNewFinding((prev) => (prev.claimId ? prev : { ...prev, claimId: bundle.claims[0].claimId }));
  }, [bundle?.claims]);

  async function postJson(url: string, body: any) {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || res.statusText);
      }
      setMessage("Gespeichert.");
      return await res.json().catch(() => ({}));
    } catch (err: any) {
      setError(err?.message ?? "save_failed");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function refresh() {
    const dossierRes = await fetch(`/api/dossiers/${encodeURIComponent(dossierId)}?include=raw`, { cache: "no-store" });
    if (!dossierRes.ok) return;
    const dossierBody = await dossierRes.json();
    setBundle({
      dossier: dossierBody.dossier,
      claims: dossierBody.claims ?? [],
      sources: dossierBody.sources ?? [],
      findings: dossierBody.findings ?? [],
      findingsRaw: dossierBody.findingsRaw ?? [],
      openQuestions: dossierBody.openQuestions ?? [],
      updateContext: dossierBody.updateContext ?? null,
      updateSummary: dossierBody.updateSummary ?? null,
    });
  }

  async function saveClaim(claim: any) {
    const res = await postJson(`/api/dossiers/${encodeURIComponent(dossierKey)}/claims/upsert`, {
      items: [
        {
          claimId: claim.claimId,
          text: claim.text,
          kind: claim.kind,
          status: claim.status,
        },
      ],
    });
    if (res) await refresh();
  }

  async function createClaim() {
    if (!newClaim.text.trim()) return;
    const res = await postJson(`/api/dossiers/${encodeURIComponent(dossierKey)}/claims/upsert`, {
      items: [newClaim],
    });
    if (res) {
      setNewClaim({ text: "", kind: "fact", status: "open" });
      await refresh();
    }
  }

  async function saveSource(source: any) {
    const res = await postJson(`/api/dossiers/${encodeURIComponent(dossierKey)}/sources/upsert`, {
      items: [
        {
          sourceId: source.sourceId,
          url: source.url,
          title: source.title,
          publisher: source.publisher,
          type: source.type,
          snippet: source.snippet,
        },
      ],
    });
    if (res) await refresh();
  }

  async function createSource() {
    if (!newSource.url.trim() || !newSource.title.trim() || !newSource.publisher.trim()) return;
    const res = await postJson(`/api/dossiers/${encodeURIComponent(dossierKey)}/sources/upsert`, {
      items: [newSource],
    });
    if (res) {
      setNewSource({ url: "", title: "", publisher: "", type: "other", snippet: "" });
      await refresh();
    }
  }

  async function saveQuestion(question: any) {
    const res = await postJson(`/api/dossiers/${encodeURIComponent(dossierKey)}/open-questions/upsert`, {
      items: [
        {
          questionId: question.questionId,
          text: question.text,
          status: question.status,
        },
      ],
    });
    if (res) await refresh();
  }

  async function createQuestion() {
    if (!newQuestion.text.trim()) return;
    const res = await postJson(`/api/dossiers/${encodeURIComponent(dossierKey)}/open-questions/upsert`, {
      items: [newQuestion],
    });
    if (res) {
      setNewQuestion({ text: "", status: "open" });
      await refresh();
    }
  }

  async function createEdge() {
    if (!newEdge.fromId.trim() || !newEdge.toId.trim()) return;
    const res = await postJson(`/api/dossiers/${encodeURIComponent(dossierKey)}/edges/upsert`, {
      items: [newEdge],
    });
    if (res) {
      setNewEdge({ fromType: "claim", fromId: "", toType: "source", toId: "", rel: "mentions" });
      await refresh();
    }
  }

  async function saveFinding(finding: any) {
    const rationale = Array.isArray(finding.rationale) ? finding.rationale : [];
    const res = await postJson(`/api/dossiers/${encodeURIComponent(dossierKey)}/findings/upsert`, {
      items: [
        {
          claimId: finding.claimId,
          verdict: finding.verdict,
          rationale: rationale.length ? rationale : undefined,
          citations: Array.isArray(finding.citations) && finding.citations.length ? finding.citations : undefined,
        },
      ],
    });
    if (res) await refresh();
  }

  async function createFinding() {
    if (!newFinding.claimId.trim()) return;
    const rationaleItems = newFinding.rationale
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean);
    const res = await postJson(`/api/dossiers/${encodeURIComponent(dossierKey)}/findings/upsert`, {
      items: [
        {
          claimId: newFinding.claimId,
          verdict: newFinding.verdict,
          rationale: rationaleItems.length ? rationaleItems : undefined,
        },
      ],
    });
    if (res) {
      setNewFinding((prev) => ({ ...prev, rationale: "" }));
      await refresh();
    }
  }

  async function moderateSuggestion(id: string, status: "accepted" | "rejected") {
    const res = await postJson(`/api/dossiers/${encodeURIComponent(dossierKey)}/suggestions/${id}/moderate`, {
      status,
    });
    if (!res) return;
    const listRes = await fetch(`/api/dossiers/${encodeURIComponent(dossierKey)}/suggestions`, { cache: "no-store" });
    if (listRes.ok) {
      const body = await listRes.json();
      setSuggestions(body.items ?? []);
    }
  }

  async function resolveDispute(id: string, status: "resolved" | "rejected") {
    const res = await postJson(`/api/dossiers/${encodeURIComponent(dossierKey)}/disputes/${id}/resolve`, {
      status,
    });
    if (!res) return;
    const listRes = await fetch(`/api/dossiers/${encodeURIComponent(dossierKey)}/disputes`, { cache: "no-store" });
    if (listRes.ok) {
      const body = await listRes.json();
      setDisputes(body.items ?? []);
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-[rgb(var(--muted))]">Lade Dossier...</div>;
  }

  if (error || !bundle) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-rose-600">
        Fehler: {error ?? "Dossier nicht gefunden"}
      </div>
    );
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Admin · Dossiers</p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">{bundle.dossier?.title ?? "Dossier"}</h1>
        <div className="flex flex-wrap items-center gap-3 text-xs text-[rgb(var(--muted))]">
          <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1">
            ID: <span className="font-mono">{dossierKey}</span>
          </span>
          <Link href={`/dossier/${encodeURIComponent(dossierKey)}`} className="underline">
            Viewer öffnen
          </Link>
          <Link href={`/api/dossiers/${encodeURIComponent(dossierKey)}/export.json`} className="underline">
            Export JSON
          </Link>
          <Link href={`/api/dossiers/${encodeURIComponent(dossierKey)}/export.csv`} className="underline">
            Export CSV
          </Link>
        </div>
        {message ? <div className="text-xs text-emerald-600">{message}</div> : null}
        {error ? <div className="text-xs text-rose-600">{error}</div> : null}
        {busy ? <div className="text-xs text-[rgb(var(--muted))]">Aktion läuft...</div> : null}
      </header>

      <section className="rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))]">
        <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Update-Engine</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
            <div className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Vorschläge</div>
            <div className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))]">{dossierUpdateSummary?.total ?? suggestions.length}</div>
          </div>
          <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
            <div className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">In Prüfung</div>
            <div className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))]">{dossierUpdateSummary?.reviewRequired ?? suggestions.filter((item) => item.status === "pending").length}</div>
          </div>
          <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
            <div className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Im Dossier sichtbar</div>
            <div className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))]">{dossierUpdateSummary?.published ?? 0}</div>
          </div>
          <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
            <div className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Abgelehnt</div>
            <div className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))]">{dossierUpdateSummary?.rejected ?? suggestions.filter((item) => item.status === "rejected").length}</div>
          </div>
        </div>
        {bundle.updateContext ? (
          <div className="mt-3 text-sm text-[rgb(var(--muted))]">
            <p>
              {bundle.updateContext.checkedStandLabel}: {bundle.updateContext.checkedStandHint}
            </p>
            <p className="mt-2">
              Verknüpft: {bundle.updateContext.originSummary.map((entry) => `${entry.label} (${entry.count})`).join(" · ") || "keine Herkunftssignale"}
            </p>
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))]">
        <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Neue Claim</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <input
            value={newClaim.text}
            onChange={(e) => setNewClaim((prev) => ({ ...prev, text: e.target.value }))}
            placeholder="Claim-Text"
            className="md:col-span-2 rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
          />
          <select
            value={newClaim.kind}
            onChange={(e) => setNewClaim((prev) => ({ ...prev, kind: e.target.value }))}
            className="rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
          >
            {CLAIM_KINDS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <select
            value={newClaim.status}
            onChange={(e) => setNewClaim((prev) => ({ ...prev, status: e.target.value }))}
            className="rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
          >
            {CLAIM_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <button
          onClick={createClaim}
          className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white"
        >
          Claim speichern
        </button>
      </section>

      <section className="rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))]">
        <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Claims bearbeiten</h2>
        <div className="mt-3 space-y-3">
          {bundle.claims.map((claim) => (
            <div key={claim.claimId} className="rounded-2xl border border-[rgb(var(--border))] p-3">
              <div className="text-xs text-[rgb(var(--muted))]">{claim.claimId}</div>
              <textarea
                value={claim.text}
                onChange={(e) => {
                  const text = e.target.value;
                  setBundle((prev) =>
                    prev
                      ? { ...prev, claims: prev.claims.map((c) => (c.claimId === claim.claimId ? { ...c, text } : c)) }
                      : prev,
                  );
                }}
                className="mt-2 w-full rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
                rows={2}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <select
                  value={claim.kind}
                  onChange={(e) => {
                    const kind = e.target.value;
                    setBundle((prev) =>
                      prev
                        ? { ...prev, claims: prev.claims.map((c) => (c.claimId === claim.claimId ? { ...c, kind } : c)) }
                        : prev,
                    );
                  }}
                  className="rounded-lg border border-[rgb(var(--border))] px-2 py-1 text-xs"
                >
                  {CLAIM_KINDS.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
                <select
                  value={claim.status}
                  onChange={(e) => {
                    const status = e.target.value;
                    setBundle((prev) =>
                      prev
                        ? { ...prev, claims: prev.claims.map((c) => (c.claimId === claim.claimId ? { ...c, status } : c)) }
                        : prev,
                    );
                  }}
                  className="rounded-lg border border-[rgb(var(--border))] px-2 py-1 text-xs"
                >
                  {CLAIM_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button
                  onClick={() => saveClaim(claim)}
                  className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-white"
                >
                  Update
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))]">
        <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Neue Quelle</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-5">
          <input
            value={newSource.url}
            onChange={(e) => setNewSource((prev) => ({ ...prev, url: e.target.value }))}
            placeholder="URL"
            className="md:col-span-2 rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
          />
          <input
            value={newSource.title}
            onChange={(e) => setNewSource((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Titel"
            className="rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
          />
          <input
            value={newSource.publisher}
            onChange={(e) => setNewSource((prev) => ({ ...prev, publisher: e.target.value }))}
            placeholder="Publisher"
            className="rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
          />
          <select
            value={newSource.type}
            onChange={(e) => setNewSource((prev) => ({ ...prev, type: e.target.value }))}
            className="rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
          >
            {SOURCE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <input
          value={newSource.snippet}
          onChange={(e) => setNewSource((prev) => ({ ...prev, snippet: e.target.value }))}
          placeholder="Snippet (optional)"
          className="mt-2 w-full rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
        />
        <button
          onClick={createSource}
          className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white"
        >
          Quelle speichern
        </button>
      </section>

      <section className="rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))]">
        <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Quellen klassifizieren</h2>
        <div className="mt-3 space-y-3">
          {bundle.sources.map((source) => (
            <div key={source.sourceId} className="rounded-2xl border border-[rgb(var(--border))] p-3">
              <div className="text-xs text-[rgb(var(--muted))]">{source.sourceId}</div>
              <div className="mt-2 grid gap-2 md:grid-cols-4">
                <input
                  value={source.url}
                  onChange={(e) => {
                    const url = e.target.value;
                    setBundle((prev) =>
                      prev
                        ? { ...prev, sources: prev.sources.map((s) => (s.sourceId === source.sourceId ? { ...s, url } : s)) }
                        : prev,
                    );
                  }}
                  className="md:col-span-2 rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-xs"
                />
                <input
                  value={source.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setBundle((prev) =>
                      prev
                        ? { ...prev, sources: prev.sources.map((s) => (s.sourceId === source.sourceId ? { ...s, title } : s)) }
                        : prev,
                    );
                  }}
                  className="rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-xs"
                />
                <input
                  value={source.publisher}
                  onChange={(e) => {
                    const publisher = e.target.value;
                    setBundle((prev) =>
                      prev
                        ? { ...prev, sources: prev.sources.map((s) => (s.sourceId === source.sourceId ? { ...s, publisher } : s)) }
                        : prev,
                    );
                  }}
                  className="rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-xs"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <select
                  value={source.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    setBundle((prev) =>
                      prev
                        ? { ...prev, sources: prev.sources.map((s) => (s.sourceId === source.sourceId ? { ...s, type } : s)) }
                        : prev,
                    );
                  }}
                  className="rounded-lg border border-[rgb(var(--border))] px-2 py-1 text-xs"
                >
                  {SOURCE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <button
                  onClick={() => saveSource(source)}
                  className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-white"
                >
                  Update
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))]">
        <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Neue offene Frage</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <input
            value={newQuestion.text}
            onChange={(e) => setNewQuestion((prev) => ({ ...prev, text: e.target.value }))}
            placeholder="Frage"
            className="md:col-span-2 rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
          />
          <select
            value={newQuestion.status}
            onChange={(e) => setNewQuestion((prev) => ({ ...prev, status: e.target.value }))}
            className="rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
          >
            {QUESTION_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <button
          onClick={createQuestion}
          className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white"
        >
          Frage speichern
        </button>
      </section>

      <section className="rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))]">
        <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Offene Fragen bearbeiten</h2>
        <div className="mt-3 space-y-3">
          {bundle.openQuestions.map((q) => (
            <div key={q.questionId} className="rounded-2xl border border-[rgb(var(--border))] p-3">
              <div className="text-xs text-[rgb(var(--muted))]">{q.questionId}</div>
              <textarea
                value={q.text}
                onChange={(e) => {
                  const text = e.target.value;
                  setBundle((prev) =>
                    prev
                      ? { ...prev, openQuestions: prev.openQuestions.map((x) => (x.questionId === q.questionId ? { ...x, text } : x)) }
                      : prev,
                  );
                }}
                className="mt-2 w-full rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
                rows={2}
              />
              <div className="mt-2 flex items-center gap-2">
                <select
                  value={q.status}
                  onChange={(e) => {
                    const status = e.target.value;
                    setBundle((prev) =>
                      prev
                        ? { ...prev, openQuestions: prev.openQuestions.map((x) => (x.questionId === q.questionId ? { ...x, status } : x)) }
                        : prev,
                    );
                  }}
                  className="rounded-lg border border-[rgb(var(--border))] px-2 py-1 text-xs"
                >
                  {QUESTION_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button
                  onClick={() => saveQuestion(q)}
                  className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-white"
                >
                  Update
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))]">
        <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Graph Edge anlegen</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-5">
          <select
            value={newEdge.fromType}
            onChange={(e) => setNewEdge((prev) => ({ ...prev, fromType: e.target.value }))}
            className="rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
          >
            {NODE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            value={newEdge.fromId}
            onChange={(e) => setNewEdge((prev) => ({ ...prev, fromId: e.target.value }))}
            placeholder="fromId"
            className="rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
          />
          <select
            value={newEdge.toType}
            onChange={(e) => setNewEdge((prev) => ({ ...prev, toType: e.target.value }))}
            className="rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
          >
            {NODE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            value={newEdge.toId}
            onChange={(e) => setNewEdge((prev) => ({ ...prev, toId: e.target.value }))}
            placeholder="toId"
            className="rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
          />
          <select
            value={newEdge.rel}
            onChange={(e) => setNewEdge((prev) => ({ ...prev, rel: e.target.value }))}
            className="rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
          >
            {EDGE_RELS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <button
          onClick={createEdge}
          className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white"
        >
          Edge speichern
        </button>
      </section>

      <section className="rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))]">
        <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Finding override (Editor)</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <select
            value={newFinding.claimId}
            onChange={(e) => setNewFinding((prev) => ({ ...prev, claimId: e.target.value }))}
            className="rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
          >
            {bundle.claims.map((claim) => (
              <option key={claim.claimId} value={claim.claimId}>
                {claim.claimId}
              </option>
            ))}
          </select>
          <select
            value={newFinding.verdict}
            onChange={(e) => setNewFinding((prev) => ({ ...prev, verdict: e.target.value }))}
            className="rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
          >
            {FINDING_VERDICTS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <textarea
          value={newFinding.rationale}
          onChange={(e) => setNewFinding((prev) => ({ ...prev, rationale: e.target.value }))}
          placeholder="Rationale (eine Zeile pro Punkt)"
          className="mt-2 w-full rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
          rows={3}
        />
        <button
          onClick={createFinding}
          className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white"
        >
          Finding speichern
        </button>
      </section>

      <section className="rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))]">
        <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Findings bearbeiten (Pipeline + Editor)</h2>
        <div className="mt-3 space-y-3 text-sm">
          {rawFindings.map((finding) => {
            const claim = claimMap.get(finding.claimId);
            const rationaleText = Array.isArray(finding.rationale) ? finding.rationale.join("\n") : "";
            return (
              <div key={finding.findingId} className="rounded-2xl border border-[rgb(var(--border))] p-3">
                <div className="text-xs text-[rgb(var(--muted))]">{finding.producedBy ?? "pipeline"}</div>
                <div className="font-semibold text-[rgb(var(--fg))]">{claim?.text ?? finding.claimId}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <select
                    value={finding.verdict}
                    onChange={(e) => {
                      const verdict = e.target.value;
                      setBundle((prev) =>
                        prev
                          ? {
                              ...prev,
                              findings: prev.findings.map((f) =>
                                f.findingId === finding.findingId ? { ...f, verdict } : f,
                              ),
                            }
                          : prev,
                      );
                    }}
                    className="rounded-lg border border-[rgb(var(--border))] px-2 py-1 text-xs"
                  >
                    {FINDING_VERDICTS.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => saveFinding(finding)}
                    className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-white"
                  >
                    Update
                  </button>
                </div>
                <textarea
                  value={rationaleText}
                  onChange={(e) => {
                    const items = e.target.value
                      .split(/\n+/)
                      .map((item) => item.trim())
                      .filter(Boolean);
                    setBundle((prev) =>
                      prev
                        ? {
                            ...prev,
                            findings: prev.findings.map((f) =>
                              f.findingId === finding.findingId ? { ...f, rationale: items } : f,
                            ),
                          }
                        : prev,
                    );
                  }}
                  className="mt-2 w-full rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-xs"
                  rows={3}
                />
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))]">
        <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Vorschläge (Queue)</h2>
        <div className="mt-3 space-y-3">
          {suggestions.length === 0 ? (
            <div className="text-sm text-[rgb(var(--muted))]">Keine Vorschläge offen.</div>
          ) : (
            suggestions.map((s) => (
              <div key={s.suggestionId} className="rounded-2xl border border-[rgb(var(--border))] p-3 text-sm">
                <SuggestionMetaCard suggestion={s} />
                {s.status === "pending" ? (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => moderateSuggestion(s.suggestionId, "accepted")}
                      className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"
                    >
                      Übernehmen
                    </button>
                    <button
                      onClick={() => moderateSuggestion(s.suggestionId, "rejected")}
                      className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white"
                    >
                      Ablehnen
                    </button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))]">
        <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Einsprueche</h2>
        <div className="mt-3 space-y-3">
          {disputes.length === 0 ? (
            <div className="text-sm text-[rgb(var(--muted))]">Keine Einsprueche offen.</div>
          ) : (
            disputes.map((d) => (
              <div key={d.disputeId} className="rounded-2xl border border-[rgb(var(--border))] p-3 text-sm">
                <div className="text-xs text-[rgb(var(--muted))]">{d.entityType} · {d.status}</div>
                <div className="mt-1 font-semibold text-[rgb(var(--fg))]">{d.reason}</div>
                <div className="text-xs text-[rgb(var(--muted))]">{d.requestedChange}</div>
                {d.status === "open" ? (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => resolveDispute(d.disputeId, "resolved")}
                      className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => resolveDispute(d.disputeId, "rejected")}
                      className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white"
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))]">
        <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Verlauf</h2>
        <div className="mt-3 space-y-2 text-sm">
          {revisions.length === 0 ? (
            <div className="text-sm text-[rgb(var(--muted))]">Keine Revisionen.</div>
          ) : (
            revisions.map((rev) => (
              <div key={rev.revId} className="rounded-2xl border border-[rgb(var(--border))] p-3">
                <div className="text-xs text-[rgb(var(--muted))]">{rev.entityType} · {rev.action} · {rev.byRole}</div>
                <div className="mt-1 text-[rgb(var(--fg))]">{rev.diffSummary}</div>
                <div className="mt-1 text-xs text-[rgb(var(--muted))]">{formatDate(rev.timestamp)}</div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))]">
        <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Quellen-Index (Helper)</h2>
        <div className="mt-3 text-xs text-[rgb(var(--muted))]">
          {bundle.sources.map((source) => (
            <div key={source.sourceId}>
              <span className="font-mono">{source.sourceId}</span> · {source.title}
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-[rgb(var(--muted))]">
          {bundle.claims.map((claim) => (
            <div key={claim.claimId}>
              <span className="font-mono">{claim.claimId}</span> · {claim.text.slice(0, 80)}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "–";
  try {
    return new Date(value).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return value;
  }
}

function normalizeSuggestionSection(value: unknown): DossierUpdateSection {
  const normalized = String(value ?? "").trim();
  if (normalized === "sources") return "sources";
  if (normalized === "claim") return "claim";
  if (normalized === "perspective") return "perspective";
  if (normalized === "question") return "question";
  if (normalized === "result") return "result";
  return "update";
}

function normalizeSuggestionOrigin(value: unknown): DossierUpdateOrigin {
  const normalized = String(value ?? "").trim();
  if (normalized === "create") return "create";
  if (normalized === "feed") return "feed";
  if (normalized === "swipe") return "swipe";
  if (normalized === "anlassraum") return "anlassraum";
  if (normalized === "evidence") return "evidence";
  return "manual";
}

function suggestionToneClass(tone: ReturnType<typeof resolveDossierUpdateStatusMeta>["tone"]) {
  if (tone === "success") return "border-emerald-300/70 bg-emerald-500/10 text-emerald-950";
  if (tone === "warning") return "border-amber-300/70 bg-amber-500/10 text-amber-950";
  if (tone === "danger") return "border-rose-300/70 bg-rose-500/10 text-rose-950";
  if (tone === "info") return "border-sky-300/70 bg-sky-500/10 text-sky-950";
  return "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))]";
}

function SuggestionMetaCard({ suggestion }: { suggestion: any }) {
  const payload = suggestion?.payload ?? {};
  const section = normalizeSuggestionSection(payload.section ?? suggestion?.type);
  const origin = normalizeSuggestionOrigin(payload.origin);
  const status = resolveDossierUpdateStatus({
    moderationStatus: suggestion?.status,
    section,
    publicVisible: true,
    attachedToDossier: true,
    archived: payload.archived === true,
    superseded: payload.superseded === true,
    hasError: payload.hasError === true,
  });
  const meta = resolveDossierUpdateStatusMeta(status);
  const title = String(payload.title ?? payload.text ?? "Reviewpflichtiger Vorschlag").trim();
  const summary = String(payload.summary ?? payload.reason ?? payload.text ?? "").trim();
  const riskHint = String(payload.riskHint ?? "").trim();
  const reviewHint = String(payload.reviewHint ?? "").trim();
  const nextAction = String(payload.nextAction ?? "").trim();

  return (
    <>
      <div className="flex flex-wrap gap-2 text-[11px]">
        <span className={`rounded-full border px-2 py-0.5 font-semibold ${suggestionToneClass(meta.tone)}`}>
          {meta.label}
        </span>
        <span className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[rgb(var(--muted))]">
          {dossierUpdateOriginLabel(origin)}
        </span>
        <span className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[rgb(var(--muted))]">
          {dossierUpdateSectionLabel(section)}
        </span>
      </div>
      <p className="mt-2 font-semibold text-[rgb(var(--fg))]">{title}</p>
      {summary ? <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[rgb(var(--muted))]">{summary}</p> : null}
      <div className="mt-2 grid gap-2 text-xs text-[rgb(var(--muted))] md:grid-cols-2">
        <div>
          <span className="font-semibold text-[rgb(var(--fg))]">Review-Hinweis:</span> {reviewHint || meta.description}
        </div>
        <div>
          <span className="font-semibold text-[rgb(var(--fg))]">Nächste Aktion:</span> {nextAction || "Im Dossier prüfen."}
        </div>
        {riskHint ? (
          <div className="md:col-span-2">
            <span className="font-semibold text-[rgb(var(--fg))]">Risiko:</span> {riskHint}
          </div>
        ) : null}
        <div>
          <span className="font-semibold text-[rgb(var(--fg))]">Letzte Änderung:</span> {formatDate(suggestion?.updatedAt ?? suggestion?.createdAt ?? null)}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-xs">
        {payload.sourceHref ? (
          <Link href={String(payload.sourceHref)} className="font-semibold text-[rgb(var(--fg))] underline">
            Ursprung öffnen
          </Link>
        ) : null}
        {payload.anlassraumHref ? (
          <Link href={String(payload.anlassraumHref)} className="font-semibold text-[rgb(var(--fg))] underline">
            Anlassraum
          </Link>
        ) : null}
        {payload.swipesHref ? (
          <Link href={String(payload.swipesHref)} className="font-semibold text-[rgb(var(--fg))] underline">
            Swipes
          </Link>
        ) : null}
      </div>
    </>
  );
}
