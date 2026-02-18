import * as React from "react";
import type { EditorialAudit, EditorialSourceClass } from "@features/analyze/schemas";
import { EDITORIAL_SOURCE_CLASS_LABELS_DE } from "@features/analyze/schemas";
import { postEditorialFeedback, type EditorialFeedbackPayload } from "@/components/analyze/editorialFeedback";
import ContentLanguageSelect from "@/components/ContentLanguageSelect";
import { useContentLang } from "@/lib/i18n/contentLanguage";
import { pickI18n } from "@features/i18n/i18nText";

function pct(n: number): string {
  const v = Math.round(Math.max(0, Math.min(1, n)) * 100);
  return `${v}%`;
}

function sortCounts(countsByClass: Record<string, number>): Array<[string, number]> {
  return Object.entries(countsByClass)
    .filter(([, n]) => Number.isFinite(n) && n > 0)
    .sort((a, b) => b[1] - a[1]);
}

export default function EditorialAuditPanel({
  audit,
  context,
}: {
  audit: EditorialAudit;
  context?: { contributionId?: string; statementId?: string; url?: string };
}) {
  const counts = sortCounts(audit.sourceBalance.countsByClass);
  const score = audit.sourceBalance.balanceScore ?? 0;
  const [localMarks, setLocalMarks] = React.useState<Record<string, "sufficient" | "insufficient" | undefined>>({});
  const { lang, setLang } = useContentLang();

  async function send(action: EditorialFeedbackPayload["action"]) {
    const payload: EditorialFeedbackPayload = {
      context,
      action,
      ts: new Date().toISOString(),
    };
    await postEditorialFeedback(payload);
  }

  return (
    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Journalismus-Audit</div>
          <div className="text-sm font-medium text-[rgb(var(--fg))]">Quellen-Diversitaet: {pct(score)}</div>
          <div className="text-xs text-[rgb(var(--muted))]">
            Hinweis: heuristische Signale (kein Urteil). Nutze es als Checkliste fuer redaktionelle Sorgfalt.
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <ContentLanguageSelect value={lang} onChange={setLang} />
          <div className="text-xs text-[rgb(var(--muted))]">Confidence: {pct(audit.confidence ?? 0.6)}</div>
        </div>
      </div>

      {counts.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {counts.slice(0, 10).map(([k, n]) => {
            const key = k as EditorialSourceClass;
            const label = EDITORIAL_SOURCE_CLASS_LABELS_DE[key] ?? k;
            return (
              <span
                key={k}
                className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-1 text-xs text-[rgb(var(--muted))]"
              >
                <span className="font-medium">{label}</span>
                <span className="rounded-full bg-[rgb(var(--bg))] px-2 py-0.5 text-[11px] text-[rgb(var(--muted))]">{n}</span>
              </span>
            );
          })}
        </div>
      )}

      {audit.sourceBalance.missingVoices?.length > 0 && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200">
          <div className="font-semibold">Moegliche "fehlende Stimmen"</div>
          <div className="mt-1">{audit.sourceBalance.missingVoices.join(" / ")}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {audit.sourceBalance.missingVoices.slice(0, 6).map((voice) => (
              <button
                key={voice}
                type="button"
                onClick={() => void send({ type: "add_missing_voice", voice })}
                className="rounded-full border border-amber-300 bg-[rgb(var(--card))] px-2 py-1 text-[11px] text-amber-900 hover:bg-amber-100 dark:border-amber-400/40 dark:text-amber-200 dark:hover:bg-amber-500/15"
              >
                + {voice}
              </button>
            ))}
          </div>
        </div>
      )}

      {audit.policyPack?.version ? (
        <div className="mt-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-[rgb(var(--muted))]">PolicyPack</div>
            <div className="text-[11px] text-[rgb(var(--muted))]">
              {audit.policyPack.id} / v{audit.policyPack.version}
            </div>
          </div>
          {Array.isArray(audit.euphemismFindings) && audit.euphemismFindings.length > 0 ? (
            <div className="mt-2 space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                Euphemismen / Framing - Findings
              </div>
              {audit.euphemismFindings.slice(0, 6).map((f, idx) => {
                const rationale = pickI18n(f.rationaleI18n, lang) ?? f.rationale;
                const preferred = pickI18n(f.preferredWordingI18n, lang) ?? f.preferredWording;
                return (
                  <div key={idx} className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs text-[rgb(var(--fg))]">
                        <span className="font-semibold">{f.matched}</span>{" "}
                        <span className="text-[rgb(var(--muted))]">({f.kind}:{f.key})</span>
                      </div>
                      <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-0.5 text-[11px] text-[rgb(var(--muted))]">
                        {f.severity}
                      </span>
                    </div>
                    {preferred ? <div className="mt-1 text-[11px] text-[rgb(var(--muted))]">Vorschlag: {preferred}</div> : null}
                    {rationale ? <div className="mt-1 text-[11px] text-[rgb(var(--muted))]">{rationale}</div> : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void send({ type: "confirm_flag", flagKind: "euphemism", key: f.key })}
                        className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-1 text-[11px] text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]"
                      >
                        confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => void send({ type: "reject_flag", flagKind: "euphemism", key: f.key })}
                        className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-1 text-[11px] text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]"
                      >
                        reject
                      </button>
                    </div>
                  </div>
                );
              })}
              <div className="mt-2 text-[11px] text-[rgb(var(--muted))]">
                Hinweis: Flags sind heuristische Marker. Feedback macht sie reviewbar.
              </div>
            </div>
          ) : (
            <div className="mt-2 text-[11px] text-[rgb(var(--muted))]">Keine Euphemismus/Framing-Findings erkannt.</div>
          )}
        </div>
      ) : null}

      {audit.voiceCoverage ? (
        <div className="mt-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-[rgb(var(--muted))]">Voice Coverage</div>
            <div className="text-[11px] text-[rgb(var(--muted))]">Score: {pct(audit.voiceCoverage.score ?? 0)}</div>
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-2">
              <div className="text-[11px] font-semibold text-[rgb(var(--muted))]">Required Roles</div>
              <div className="mt-1 text-[11px] text-[rgb(var(--muted))]">{(audit.voiceCoverage.required ?? []).join(", ") || "—"}</div>
            </div>
            <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-2">
              <div className="text-[11px] font-semibold text-[rgb(var(--muted))]">Missing Roles</div>
              <div className="mt-1 text-[11px] text-[rgb(var(--muted))]">{(audit.voiceCoverage.missing ?? []).join(", ") || "—"}</div>
            </div>
          </div>
          {Array.isArray(audit.voiceCoverage.notes) && audit.voiceCoverage.notes.length ? (
            <div className="mt-2 text-[11px] text-[rgb(var(--muted))]">{audit.voiceCoverage.notes[0]}</div>
          ) : null}
        </div>
      ) : null}

      {(Array.isArray(audit.attachedContextPacks) && audit.attachedContextPacks.length > 0) ||
      (Array.isArray(audit.contextGaps) && audit.contextGaps.length > 0) ? (
        <div className="mt-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
          <div className="text-xs font-semibold text-[rgb(var(--muted))]">Kontexttiefe (Packs + Gaps)</div>
          {Array.isArray(audit.attachedContextPacks) && audit.attachedContextPacks.length > 0 ? (
            <div className="mt-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Attached ContextPacks</div>
              <ul className="mt-1 space-y-1 text-[11px] text-[rgb(var(--muted))]">
                {audit.attachedContextPacks.slice(0, 6).map((p) => {
                  const packTitle = pickI18n(p.titleI18n, lang) ?? p.title;
                  const packSummary = pickI18n(p.summaryI18n, lang) ?? p.summary;
                  return (
                    <li key={p.id} className="flex items-start justify-between gap-2">
                      <span>
                        <span className="font-medium">{packTitle}</span>{" "}
                        <span className="text-[rgb(var(--muted))]">({p.id} / v{p.version})</span>
                        {packSummary ? <div className="text-[11px] text-[rgb(var(--muted))]">{packSummary}</div> : null}
                      </span>
                      <button
                        type="button"
                        onClick={() => void send({ type: "attach_context_pack", packId: p.id })}
                        className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-0.5 text-[11px] text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]"
                      >
                        attach
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
          {Array.isArray(audit.contextGaps) && audit.contextGaps.length > 0 ? (
            <div className="mt-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Context Gap Checklist</div>
              <div className="mt-1 flex flex-wrap gap-2">
                {audit.contextGaps.slice(0, 10).map((g, idx) => {
                  const gapRationale = pickI18n(g.rationaleI18n, lang) ?? g.rationale;
                  return (
                    <span
                      key={idx}
                      title={gapRationale || undefined}
                      className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-1 text-[11px] text-[rgb(var(--muted))]"
                    >
                      {g.key} / {g.severity}
                    </span>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {(audit.burdenOfProof.notes?.length ?? 0) > 0 && (
        <div className="mt-3">
          <div className="text-xs font-semibold text-[rgb(var(--muted))]">Beweislast</div>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-[rgb(var(--muted))]">
            {audit.burdenOfProof.notes.slice(0, 6).map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      )}

      {(audit.burdenOfProof.claimEvidence?.length ?? 0) > 0 && (
        <div className="mt-3">
          <div className="text-xs font-semibold text-[rgb(var(--muted))]">Claim zu Quellen (heuristisch)</div>
          <div className="mt-2 space-y-2">
            {audit.burdenOfProof.claimEvidence.slice(0, 8).map((c, i) => {
              const ok = (c.linkedSources?.length ?? 0) > 0;
              const mark = localMarks[c.claim];
              return (
                <div key={i} className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs text-[rgb(var(--fg))]">{c.claim}</div>
                    <span
                      className={
                        "shrink-0 rounded-full px-2 py-0.5 text-[11px] " +
                        (ok
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-400/30"
                          : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:border-rose-400/30")
                      }
                    >
                      {ok ? "linked" : "unlinked"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLocalMarks((p) => ({ ...p, [c.claim]: "sufficient" }));
                        void send({ type: "mark_evidence_sufficient", claim: c.claim });
                      }}
                      className={
                        "rounded-full border px-2 py-1 text-[11px] " +
                        (mark === "sufficient"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200"
                          : "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]")
                      }
                    >
                      ok
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLocalMarks((p) => ({ ...p, [c.claim]: "insufficient" }));
                        void send({ type: "mark_evidence_insufficient", claim: c.claim });
                      }}
                      className={
                        "rounded-full border px-2 py-1 text-[11px] " +
                        (mark === "insufficient"
                          ? "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-400/30 dark:bg-rose-500/15 dark:text-rose-200"
                          : "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]")
                      }
                    >
                      nicht ok
                    </button>
                  </div>
                  {ok && (
                    <ul className="mt-2 space-y-1">
                      {c.linkedSources.slice(0, 3).map((s, si) => (
                        <li key={si} className="text-[11px] text-[rgb(var(--muted))]">
                          <span className="font-medium text-[rgb(var(--muted))]">{s.publisher || s.sourceClass || "Quelle"}</span>
                          {s.title ? <span> / {s.title}</span> : null}
                          {typeof s.score === "number" ? <span className="text-[rgb(var(--muted))]"> / score {s.score}</span> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                  {!ok && (
                    <div className="mt-1 text-[11px] text-[rgb(var(--muted))]">
                      Tipp: Claim praezisieren oder zusaetzliche Belege/Quellen ergaenzen.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(audit.internationalContrast?.findings?.length ?? 0) > 0 && (
        <div className="mt-3">
          <div className="text-xs font-semibold text-[rgb(var(--muted))]">Internationaler Kontrastblick (Metadaten)</div>
          {(audit.internationalContrast.differences?.length ?? 0) > 0 && (
            <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-[rgb(var(--muted))]">
              {audit.internationalContrast.differences.slice(0, 4).map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          )}
          <div className="mt-2 space-y-2">
            {audit.internationalContrast.findings.slice(0, 6).map((f, i) => (
              <div key={i} className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-xs text-[rgb(var(--muted))]">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{f.outlet}</div>
                  <div className="text-[11px] text-[rgb(var(--muted))]">{f.localeHint}</div>
                </div>
                <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                  <span
                    className={
                      "rounded-full border px-2 py-0.5 " +
                      (f.hasAttribution
                        ? "border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
                        : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-400/40 dark:bg-rose-500/15 dark:text-rose-200")
                    }
                  >
                    Attribution: {f.hasAttribution ? "yes" : "no"}
                  </span>
                  <span
                    className={
                      "rounded-full border px-2 py-0.5 " +
                      (f.hasEvidenceCaveat
                        ? "border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
                        : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200")
                    }
                  >
                    Evidence caveat: {f.hasEvidenceCaveat ? "yes" : "no"}
                  </span>
                  <span
                    className={
                      "rounded-full border px-2 py-0.5 " +
                      (f.usesPassiveAgency
                        ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200"
                        : "border-[rgb(var(--border))] bg-[rgb(var(--bg))]")
                    }
                  >
                    Passive/agency: {f.usesPassiveAgency ? "flag" : "ok"}
                  </span>
                </div>
                {f.headlineOrTitle && <div className="mt-1 text-[11px] text-[rgb(var(--muted))]">{f.headlineOrTitle}</div>}
              </div>
            ))}
          </div>
          {(audit.internationalContrast.notes?.length ?? 0) > 0 && (
            <div className="mt-2 text-[11px] text-[rgb(var(--muted))]">
              {audit.internationalContrast.notes.slice(0, 2).join(" / ")}
            </div>
          )}
        </div>
      )}

      {(audit.powerStenographyFlags?.length ?? 0) > 0 && (
        <div className="mt-3">
          <div className="text-xs font-semibold text-[rgb(var(--muted))]">Macht-Narrativ / Stenografie (Hinweise)</div>
          <ul className="mt-1 space-y-2">
            {audit.powerStenographyFlags.slice(0, 4).map((f, i) => (
              <li key={i} className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-xs text-[rgb(var(--muted))]">
                <div className="font-medium">{f.reason}</div>
                {f.suggestion && <div className="mt-1 text-[rgb(var(--muted))]">{f.suggestion}</div>}
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => void send({ type: "disagree_flag", flagKind: "power", payload: f })}
                    className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-1 text-[11px] text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]"
                  >
                    disagree
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(audit.agencyOpacityFlags?.length ?? 0) > 0 && (
        <div className="mt-3">
          <div className="text-xs font-semibold text-[rgb(var(--muted))]">Agency/Attribution (Opak-Machen)</div>
          <ul className="mt-1 space-y-2">
            {audit.agencyOpacityFlags.slice(0, 6).map((f, i) => (
              <li key={i} className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-xs text-[rgb(var(--muted))]">
                <div className="italic text-[rgb(var(--muted))]">"{f.sentence}"</div>
                <div className="mt-1">{f.reason}</div>
                {f.suggestion && <div className="mt-1 text-[rgb(var(--muted))]">{f.suggestion}</div>}
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => void send({ type: "disagree_flag", flagKind: "agency", payload: f })}
                    className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-1 text-[11px] text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]"
                  >
                    disagree
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(audit.euphemismTermFlags?.length ?? 0) > 0 && (
        <div className="mt-3">
          <div className="text-xs font-semibold text-[rgb(var(--muted))]">Begriffe/Frames (Kontext pruefen)</div>
          <ul className="mt-1 space-y-2">
            {audit.euphemismTermFlags.slice(0, 6).map((f, i) => (
              <li key={i} className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-xs text-[rgb(var(--muted))]">
                <div className="font-medium">{f.term}</div>
                <div className="mt-1">{f.rationale}</div>
                {f.suggestion && <div className="mt-1 text-[rgb(var(--muted))]">Vorschlag: {f.suggestion}</div>}
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => void send({ type: "disagree_flag", flagKind: "euphemism", payload: f })}
                    className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-1 text-[11px] text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]"
                  >
                    disagree
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(audit.notesForTraining?.length ?? 0) > 0 && (
        <div className="mt-3 text-xs text-[rgb(var(--muted))]">
          <div className="font-semibold text-[rgb(var(--muted))]">Notizen</div>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {audit.notesForTraining.slice(0, 6).map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
