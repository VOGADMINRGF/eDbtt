"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type AgendaItem = {
  _id: string;
  kind: string;
  status: string;
  customQuestion?: string | null;
  description?: string | null;
  pollOptions?: string[];
  qrTarget?: string | null;
  allowAnonymousVoting: boolean;
  publicAttribution: string;
};

type DeliberationState = {
  enabled: boolean;
  phase: string;
  round: number;
  roundEndsAt?: string | null;
  updatedAt?: string | null;
};

const DELIBERATION_PHASES = [
  { key: "mandate", label: "Mandat" },
  { key: "input", label: "Input" },
  { key: "round_a", label: "Runde A" },
  { key: "round_b", label: "Runde B" },
  { key: "round_c", label: "Runde C" },
  { key: "plenum", label: "Plenum" },
  { key: "vote", label: "Abstimmung" },
  { key: "follow_up", label: "Follow-up" },
] as const;

export default function StreamCockpitPage() {
  const params = useParams<{ id: string }>();
  const [session, setSession] = useState<{
    _id: string;
    title: string;
    slug?: string | null;
    description?: string | null;
  } | null>(null);
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [qrDraftByItem, setQrDraftByItem] = useState<Record<string, string>>({});
  const [deliberation, setDeliberation] = useState<DeliberationState | null>(null);
  const [delibNotice, setDelibNotice] = useState<string | null>(null);
  const [delibError, setDelibError] = useState<string | null>(null);
  const [roundMinutes, setRoundMinutes] = useState("5");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [question, setQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState("Ja\nNein");
  const [autofilling, setAutofilling] = useState(false);
  const [autofillError, setAutofillError] = useState<string | null>(null);
  const [qrQuestions, setQrQuestions] = useState<
    Array<{ title: string; description: string; options: string; publicAttribution: "public" | "hidden" }>
  >([{ title: "", description: "", options: "Ja\nNein", publicAttribution: "hidden" }]);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrNotice, setQrNotice] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrCreating, setQrCreating] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/streams/sessions/${params.id}/agenda`, { cache: "no-store" });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || res.statusText);
        if (!ignore) {
          setSession(body.session);
          const nextItems: AgendaItem[] = body.items ?? [];
          setItems(nextItems);
          setQrDraftByItem((prev) => {
            const next = { ...prev };
            nextItems.forEach((item) => {
              if (!(item._id in next)) {
                next[item._id] = item.qrTarget ?? "";
              }
            });
            return next;
          });
        }
        const delibRes = await fetch(`/api/streams/sessions/${params.id}/deliberation`, {
          cache: "no-store",
        });
        const delibBody = await delibRes.json().catch(() => ({}));
        if (!ignore) {
          if (delibRes.ok && delibBody?.state) {
            setDeliberation(delibBody.state);
          }
        }
      } catch (err: any) {
        if (!ignore) setError(err?.message ?? "Fehler beim Laden der Agenda");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    const timer = setInterval(load, 5000);
    return () => {
      ignore = true;
      clearInterval(timer);
    };
  }, [params.id]);

  const liveItem = useMemo(() => items.find((item) => item.status === "live"), [items]);
  const publicStreamPath = useMemo(() => {
    const slug = session?.slug?.trim();
    if (slug) return `/stream/${slug}`;
    return `/stream/${params.id}`;
  }, [params.id, session?.slug]);
  const overlayPath = useMemo(() => `/overlay/stream/${params.id}`, [params.id]);
  const activeQrTarget =
    liveItem?.qrTarget?.trim() ||
    (liveItem?._id ? `${publicStreamPath}?agendaItemId=${liveItem._id}` : publicStreamPath);
  const phaseLabel =
    DELIBERATION_PHASES.find((p) => p.key === deliberation?.phase)?.label ?? "Mandat";
  const roundEndsLabel = deliberation?.roundEndsAt
    ? new Date(deliberation.roundEndsAt).toLocaleTimeString("de-DE")
    : "—";

  async function addQuestion(kind: "question" | "poll") {
    const payload: any = {
      kind,
      customQuestion: question.trim() || "Neue Frage",
      allowAnonymousVoting: true,
      publicAttribution: "hidden",
    };
    if (kind === "poll") {
      payload.pollOptions = pollOptions
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
    }
    try {
      await fetch(`/api/streams/sessions/${params.id}/agenda`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      setQuestion("");
    } catch {
      setError("Agenda-Item konnte nicht erstellt werden.");
    }
  }

  async function updateItem(itemId: string, action: string, qrTarget?: string) {
    setError(null);
    setNotice(null);
    const res = await fetch(`/api/streams/sessions/${params.id}/agenda`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ itemId, action, qrTarget }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error || "Aktion fehlgeschlagen.");
    }
  }

  async function updateDeliberation(patch: {
    enabled?: boolean;
    phase?: string;
    round?: number;
    roundMinutes?: number | null;
  }) {
    setDelibNotice(null);
    setDelibError(null);
    try {
      const res = await fetch(`/api/streams/sessions/${params.id}/deliberation`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || "Aktion fehlgeschlagen.");
      }
      if (body?.state) setDeliberation(body.state);
      setDelibNotice("Deliberation aktualisiert.");
    } catch (err: any) {
      setDelibError(err?.message ?? "Deliberation konnte nicht aktualisiert werden.");
    }
  }

  async function saveQrTarget(itemId: string) {
    try {
      await updateItem(itemId, "set_qr_target", qrDraftByItem[itemId] ?? "");
      setNotice("QR-Ziel gespeichert.");
    } catch (err: any) {
      setError(err?.message ?? "QR-Ziel konnte nicht gespeichert werden.");
    }
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(`${label} kopiert.`);
    } catch {
      setError(`${label} konnte nicht kopiert werden.`);
    }
  }

  function updateQrQuestion(index: number, patch: Partial<{ title: string; description: string; options: string }>) {
    setQrQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  function toggleQrVisibility(index: number) {
    setQrError(null);
    setQrQuestions((prev) => {
      const currentPublic = prev.filter((q) => q.publicAttribution === "public").length;
      const next = [...prev];
      const target = next[index];
      if (!target) return prev;
      const nextValue = target.publicAttribution === "public" ? "hidden" : "public";
      if (nextValue === "public" && currentPublic >= 3) {
        setQrError("Maximal 3 Fragen dürfen nicht anonym sein.");
        return prev;
      }
      next[index] = { ...target, publicAttribution: nextValue };
      return next;
    });
  }

  function addQrQuestion() {
    setQrError(null);
    setQrQuestions((prev) => {
      if (prev.length >= 5) return prev;
      return [...prev, { title: "", description: "", options: "Ja\nNein", publicAttribution: "hidden" }];
    });
  }

  async function createQrSet() {
    setQrCreating(true);
    setQrError(null);
    setQrNotice(null);
    try {
      const publicCount = qrQuestions.filter((q) => q.publicAttribution === "public").length;
      if (publicCount > 3) {
        setQrError("Maximal 3 Fragen dürfen nicht anonym sein.");
        return;
      }
      const hiddenCount = qrQuestions.length - publicCount;
      if (qrQuestions.length >= 5 && hiddenCount < 2) {
        setQrError("Bei 5 Fragen müssen mindestens 2 anonym sein.");
        return;
      }
      const payload = {
        streamSessionId: params.id,
        title: `Stream ${session?.title ?? "Session"}`,
        questions: qrQuestions.map((q) => ({
          title: q.title.trim() || "Neue Frage",
          description: q.description.trim() || undefined,
          options: q.options
            .split("\n")
            .map((opt) => opt.trim())
            .filter(Boolean),
          publicAttribution: q.publicAttribution,
        })),
      };
      const res = await fetch("/api/qr/sets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body?.error === "public_limit_exceeded") {
          throw new Error("Maximal 3 Fragen dürfen nicht anonym sein.");
        }
        if (body?.error === "anonymous_minimum") {
          throw new Error("Bei 5 Fragen müssen mindestens 2 anonym sein.");
        }
        if (body?.error === "options_required") {
          throw new Error("Bitte mindestens zwei Eventualitäten pro Frage angeben.");
        }
        throw new Error(body?.error || res.statusText);
      }
      setQrCode(body.code ?? null);
      setQrNotice("QR-Set erstellt.");
    } catch (err: any) {
      setQrError(err?.message ?? "QR-Set konnte nicht erstellt werden.");
    } finally {
      setQrCreating(false);
    }
  }

  async function autofillAgenda() {
    setAutofilling(true);
    setAutofillError(null);
    try {
      const res = await fetch(`/api/streams/sessions/${params.id}/agenda/autofill`, {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        const msg = body?.error || res.statusText;
        if (msg === "topic_required") {
          throw new Error("Bitte zuerst ein Thema an der Session setzen.");
        }
        if (msg === "topic_not_ready") {
          throw new Error("Zum Thema fehlen noch Statements. Bitte erst den Workflow durchlaufen.");
        }
        throw new Error(msg);
      }
      setItems(body.agenda ?? []);
    } catch (err: any) {
      setAutofillError(err?.message ?? "Autofill nicht möglich. Bitte später erneut versuchen.");
    } finally {
      setAutofilling(false);
    }
  }

  return (
    <main className="flex flex-col gap-6 px-4 py-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Stream Cockpit</p>
        <h1 className="text-2xl font-bold text-slate-900">{session?.title ?? "Session"}</h1>
        <p className="text-sm text-slate-600">
          Steuere hier Fragen, Statements und Polls. Das OBS-Overlay aktualisiert sich automatisch.
        </p>
      </header>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}
      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Stream-Kit</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-100 p-3 text-xs">
            <p className="font-semibold text-slate-900">Overlay URL</p>
            <p className="mt-1 break-all text-slate-600">{origin ? `${origin}${overlayPath}` : overlayPath}</p>
            <div className="mt-2 flex gap-2">
              <a className="rounded-full border border-slate-300 px-3 py-1" href={overlayPath} target="_blank" rel="noreferrer">
                Öffnen
              </a>
              <button
                className="rounded-full border border-slate-300 px-3 py-1"
                onClick={() => copyText(origin ? `${origin}${overlayPath}` : overlayPath, "Overlay URL")}
              >
                Kopieren
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 p-3 text-xs">
            <p className="font-semibold text-slate-900">Viewer URL</p>
            <p className="mt-1 break-all text-slate-600">
              {origin ? `${origin}${publicStreamPath}` : publicStreamPath}
            </p>
            <div className="mt-2 flex gap-2">
              <a className="rounded-full border border-slate-300 px-3 py-1" href={publicStreamPath} target="_blank" rel="noreferrer">
                Öffnen
              </a>
              <button
                className="rounded-full border border-slate-300 px-3 py-1"
                onClick={() => copyText(origin ? `${origin}${publicStreamPath}` : publicStreamPath, "Viewer URL")}
              >
                Kopieren
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 p-3 text-xs">
            <p className="font-semibold text-slate-900">Aktives QR-Ziel</p>
            <p className="mt-1 break-all text-slate-600">{activeQrTarget}</p>
            <button
              className="mt-2 rounded-full border border-slate-300 px-3 py-1"
              onClick={() => copyText(origin ? `${origin}${activeQrTarget}` : activeQrTarget, "QR-Ziel")}
            >
              Kopieren
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Deliberation Mode</h2>
            <p className="text-xs text-slate-500">
              Phasen, Runden und Timer fuer strukturierte Live-Debatten.
            </p>
          </div>
          <button
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              deliberation?.enabled
                ? "border border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border border-slate-300 bg-white text-slate-600"
            }`}
            onClick={() => updateDeliberation({ enabled: !deliberation?.enabled })}
          >
            {deliberation?.enabled ? "Aktiv" : "Inaktiv"}
          </button>
        </div>

        {delibError && <p className="text-xs text-rose-600">{delibError}</p>}
        {delibNotice && <p className="text-xs text-emerald-600">{delibNotice}</p>}

        <div className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-100 p-3 text-xs">
            <p className="font-semibold text-slate-900">Aktuelle Phase</p>
            <p className="mt-1 text-slate-600">{phaseLabel}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {DELIBERATION_PHASES.map((phase) => (
                <button
                  key={phase.key}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                    deliberation?.phase === phase.key
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 text-slate-600"
                  }`}
                  onClick={() => updateDeliberation({ phase: phase.key, enabled: true })}
                >
                  {phase.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 p-3 text-xs">
            <p className="font-semibold text-slate-900">Runde</p>
            <p className="mt-1 text-slate-600">Runde {deliberation?.round ?? 1}</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                className="rounded-full border border-slate-300 px-3 py-1"
                onClick={() =>
                  updateDeliberation({ round: Math.max(1, (deliberation?.round ?? 1) - 1) })
                }
              >
                −
              </button>
              <button
                className="rounded-full border border-slate-900 bg-slate-900 px-3 py-1 text-white"
                onClick={() => updateDeliberation({ round: (deliberation?.round ?? 1) + 1 })}
              >
                +
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 p-3 text-xs">
            <p className="font-semibold text-slate-900">Timer</p>
            <p className="mt-1 text-slate-600">Ende: {roundEndsLabel}</p>
            <div className="mt-3 flex items-center gap-2">
              <input
                className="w-16 rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-700"
                value={roundMinutes}
                onChange={(e) => setRoundMinutes(e.target.value)}
                inputMode="numeric"
              />
              <span className="text-[11px] text-slate-500">Min</span>
              <button
                className="rounded-full border border-slate-900 bg-slate-900 px-3 py-1 text-white"
                onClick={() => updateDeliberation({ roundMinutes: Number(roundMinutes) || 0 })}
              >
                Start
              </button>
              <button
                className="rounded-full border border-slate-300 px-3 py-1"
                onClick={() => updateDeliberation({ roundMinutes: 0 })}
              >
                Stop
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">Agenda</h2>
            <button
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold"
              onClick={autofillAgenda}
              disabled={autofilling}
            >
              {autofilling ? "Agenda wird gefüllt…" : "Agenda aus Thema füllen"}
            </button>
          </div>
          {autofillError && (
            <p className="text-xs text-rose-600">{autofillError}</p>
          )}
          {loading ? (
            <p className="text-sm text-slate-500">Lädt …</p>
          ) : (
            <ul className="space-y-2 text-sm text-slate-700">
              {items.map((item) => (
                <li key={item._id} className="rounded-xl border border-slate-100 p-3">
                  <p className="font-semibold text-slate-900">{item.customQuestion || item.description || item.kind}</p>
                  <p className="text-xs text-slate-500 mb-2">Status: {item.status}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      className="rounded-full border border-slate-900 bg-slate-900 px-3 py-1 text-white"
                      onClick={async () => {
                        try {
                          await updateItem(item._id, "go_live");
                          setNotice("Aktiver Tagespunkt aktualisiert.");
                        } catch (err: any) {
                          setError(err?.message ?? "Aktivieren fehlgeschlagen.");
                        }
                      }}
                    >
                      Aktiv setzen
                    </button>
                    <button
                      className="rounded-full border border-slate-300 px-3 py-1"
                      onClick={async () => {
                        try {
                          await updateItem(item._id, "skip");
                          setNotice("Item wurde übersprungen.");
                        } catch (err: any) {
                          setError(err?.message ?? "Aktion fehlgeschlagen.");
                        }
                      }}
                    >
                      Skip
                    </button>
                    <button
                      className="rounded-full border border-slate-300 px-3 py-1"
                      onClick={async () => {
                        try {
                          await updateItem(item._id, "archive");
                          setNotice("Item wurde archiviert.");
                        } catch (err: any) {
                          setError(err?.message ?? "Aktion fehlgeschlagen.");
                        }
                      }}
                    >
                      Archiv
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input
                      className="min-w-[240px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs"
                      placeholder={`/qr/${qrCode ?? "deinCode"} oder ${publicStreamPath}?agendaItemId=${item._id}`}
                      value={qrDraftByItem[item._id] ?? ""}
                      onChange={(e) =>
                        setQrDraftByItem((prev) => ({ ...prev, [item._id]: e.target.value }))
                      }
                    />
                    <button
                      className="rounded-full border border-slate-300 px-3 py-1 text-xs"
                      onClick={() => saveQrTarget(item._id)}
                    >
                      QR-Ziel speichern
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">Live</h2>
          {liveItem ? (
            <div>
              <p className="text-xl font-semibold text-slate-900">{liveItem.customQuestion || liveItem.description}</p>
              {liveItem.kind === "poll" && (
                <ul className="mt-3 space-y-2">
                  {(liveItem.pollOptions ?? []).map((opt) => (
                    <li key={opt} className="rounded-lg bg-slate-100 px-3 py-2 text-sm">
                      {opt}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs text-amber-600">
                {liveItem.publicAttribution === "public"
                  ? "Achtung: Öffentliche Abstimmung – Teilnehmer:innen werden sichtbar angezeigt."
                  : "Anonyme Abstimmung aktiv."}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Noch kein Item live.</p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">Neues Item</h2>
          <textarea
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Frage oder Statement"
            rows={4}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <label className="text-xs font-semibold text-slate-500">Poll-Optionen (eine pro Zeile)</label>
          <textarea
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            rows={3}
            value={pollOptions}
            onChange={(e) => setPollOptions(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-full border border-slate-300 px-3 py-1 text-sm"
              onClick={() => addQuestion("question")}
            >
              Frage anlegen
            </button>
            <button
              className="rounded-full border border-slate-900 bg-slate-900 px-3 py-1 text-sm text-white"
              onClick={() => addQuestion("poll")}
            >
              Poll anlegen
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">QR Fragen-Set</h2>
            <button
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold"
              onClick={addQrQuestion}
              disabled={qrQuestions.length >= 5}
            >
              Frage hinzufügen
            </button>
          </div>
          {qrError && <p className="text-xs text-rose-600">{qrError}</p>}
          {qrNotice && <p className="text-xs text-emerald-600">{qrNotice}</p>}
          {qrCode && (
            <p className="text-xs text-slate-600">
              QR-Link: <a className="underline" href={`/qr/${qrCode}`}>{`/qr/${qrCode}`}</a>
            </p>
          )}
          <div className="space-y-3">
            {qrQuestions.map((q, idx) => (
              <div key={idx} className="rounded-xl border border-slate-100 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500">Frage {idx + 1}</p>
                  <button
                    className="text-xs underline text-slate-500"
                    onClick={() => toggleQrVisibility(idx)}
                  >
                    {q.publicAttribution === "public" ? "Nicht anonym" : "Anonym"}
                  </button>
                </div>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Frage"
                  value={q.title}
                  onChange={(e) => updateQrQuestion(idx, { title: e.target.value })}
                />
                <textarea
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Eventualitäten / Optionen (eine pro Zeile)"
                  rows={3}
                  value={q.options}
                  onChange={(e) => updateQrQuestion(idx, { options: e.target.value })}
                />
              </div>
            ))}
          </div>
          <button
            className="rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm text-white"
            onClick={createQrSet}
            disabled={qrCreating}
          >
            {qrCreating ? "QR-Set wird erstellt…" : "QR-Set erstellen"}
          </button>
        </section>
      </div>
    </main>
  );
}
