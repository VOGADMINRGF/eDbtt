"use client";

import Link from "next/link";
import { FiCopy } from "react-icons/fi";
import type {
  CreateBranchLedgerItem,
  CreateContributionLedgerEntry,
} from "@features/create/createContributionLedger";
import { dedupeCreateContributionLedgerEntries } from "@features/create/createContributionLedger";
import {
  buildLedgerBranchAnchorId,
  buildLedgerSimilarityGroupCounts,
  resolveBranchHandoffTarget,
} from "@/features/create/branchHandoffTargets";

function ghostDarkButtonClass() {
  return "btn-ghost inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold";
}

function SectionHeading(props: {
  id: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <h2
        id={props.id}
        className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-[rgb(var(--fg))]"
      >
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/10 text-sky-400 ring-1 ring-sky-300/30">
          <FiCopy className="h-3.5 w-3.5" aria-hidden />
        </span>
        <span>{props.title}</span>
      </h2>
      <p className="text-xs text-[rgb(var(--muted))]">{props.description}</p>
    </div>
  );
}

function resolveLedgerStatusLabel(branch: CreateBranchLedgerItem): string {
  if (branch.needsPlaceClarification && branch.placeClarificationStatus !== "answered") {
    return "Ort noch offen";
  }
  if (branch.streetVerificationStatus === "verified") return "Straße im Register gefunden";
  if (branch.streetVerificationStatus === "skipped") return "Straßenprüfung übersprungen";
  if (branch.streetVerificationStatus === "unavailable") return "Straße noch nicht im Register geprüft";
  if (branch.qrParticipationDraft) return "QR-Beteiligung als Entwurf vorbereitet";
  if (branch.swipeDraft) return "Swipe-Aussagen als Entwurf vorbereitet";
  if (branch.status === "qr_draft_prepared") return "QR-Beteiligung als Entwurf vorbereitet";
  if (branch.status === "swipe_draft_prepared") return "Swipe-Aussagen als Entwurf vorbereitet";
  if (branch.status === "review_draft_prepared") return "Prüfung oder Quellen vorbereitet";
  if (branch.status === "match_decision_pending" || branch.status === "match_decision_recorded") {
    return "Mögliche Zuordnung vorgemerkt";
  }
  if (branch.status === "server_failed") return "Lokal gesichert, Serverspeicherung offen";
  if (branch.status === "local_only") return "Nur lokal als Entwurf gesichert";
  return "Nur als Entwurf gespeichert";
}

function resolveLedgerGuardrailLines(branch: CreateBranchLedgerItem): string[] {
  const lines = ["Noch nicht veröffentlicht"];
  if (branch.needsPlaceClarification && branch.placeClarificationStatus !== "answered") {
    lines.push("Ort noch offen");
  }
  if (branch.qrParticipationDraft) {
    lines.push("Noch kein QR-Link erzeugt");
  }
  if (branch.swipeDraft) {
    lines.push("Noch nicht öffentlich");
    lines.push("Noch nicht gezählt");
  }
  if (
    branch.status === "match_decision_pending" ||
    branch.status === "match_decision_recorded" ||
    branch.existingMatchDecision
  ) {
    lines.push("Noch nicht gezählt");
    lines.push("Noch nicht mit bestehendem Thema zusammengeführt");
  }
  return lines;
}

function resolveLedgerDraftTypeLabel(branch: CreateBranchLedgerItem): string {
  if (branch.qrParticipationDraft) return "QR-Beteiligung";
  if (branch.swipeDraft) return "Swipe-Aussagen";
  if (branch.status === "review_draft_prepared") return "Prüfung/Quellen";
  return "Nur Entwurf";
}

function resolveExistingMatchDecisionSummary(branch: CreateBranchLedgerItem): string | null {
  const decision = branch.existingMatchDecision;
  if (!decision) return null;
  if (decision.userDecision === "count_my_position") {
    return `Vorgemerkt bei ${decision.targetTitle} – noch nicht gezählt.`;
  }
  if (decision.userDecision === "count_as_opposition") {
    return `Gegenposition zu ${decision.targetTitle} vorgemerkt – noch nicht gezählt.`;
  }
  if (decision.userDecision === "add_as_nuance") {
    return `Nuance zu ${decision.targetTitle} vorgemerkt – noch nicht zusammengeführt.`;
  }
  if (decision.userDecision === "keep_separate") {
    return `Eigenes Thema zu ${decision.targetTitle} bleibt getrennt vorgemerkt.`;
  }
  if (decision.userDecision === "request_review") {
    return `Prüfung zu ${decision.targetTitle} vorgemerkt.`;
  }
  return null;
}

function resolveDifferenceReasonLabel(
  reason: CreateBranchLedgerItem["existingMatchDecision"] extends { differenceReason?: infer T }
    ? T
    : never,
): string | null {
  if (reason === "other_scope") return "andere Ebene / anderer Ort";
  if (reason === "other_target_group") return "andere Zielgruppe";
  if (reason === "other_demand") return "andere Forderung";
  if (reason === "other_reasoning") return "andere Begründung";
  if (reason === "different_stance") return "andere Haltung";
  if (reason === "custom_text") return "eigene Formulierung";
  return null;
}

export default function CreateContributionLedgerSection(props: {
  entries: CreateContributionLedgerEntry[];
}) {
  const entries = dedupeCreateContributionLedgerEntries(props.entries);
  const similarityGroupCounts = buildLedgerSimilarityGroupCounts(entries);

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-[color-mix(in_oklab,rgb(var(--card))_96%,rgb(var(--bg))_4%)] px-4 py-4 shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))]">
      <SectionHeading
        id="account-create-ledger"
        title="Meine Beiträge und Themenstände"
        description="Deine Mehrthemen-Entwürfe bleiben hier als Arbeitsstand sichtbar. Nichts davon ist automatisch veröffentlicht, gezählt oder zusammengeführt."
      />
      {entries.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300/70 px-4 py-4 text-sm text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
          Noch keine gespeicherten Themenstände aus `/create`.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {entries.map((entry) => (
            <article
              key={entry.ledgerId}
              className="rounded-[24px] border border-slate-200/80 bg-[rgb(var(--bg))] px-4 py-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                    {new Date(entry.updatedAt).toLocaleDateString("de-DE")}
                  </p>
                  <p className="text-base font-semibold text-[rgb(var(--fg))]">
                    {entry.branches.length} Themenäste erkannt
                  </p>
                  <p className="max-w-3xl text-sm leading-relaxed text-[rgb(var(--muted))]">
                    {entry.sourceText.slice(0, 220)}
                    {entry.sourceText.length > 220 ? " …" : ""}
                  </p>
                  {similarityGroupCounts.get(entry.packageId) ? (
                    <p className="text-xs leading-relaxed text-[rgb(var(--muted))]">
                      Ähnliche Entwürfe erkannt. Diese Arbeitsstände können später zusammengeführt oder getrennt bleiben.
                    </p>
                  ) : null}
                </div>
              </div>

              <details className="mt-4 rounded-2xl border border-slate-200/80 px-3 py-3 dark:border-[rgb(var(--border))]">
                <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">
                  Originalbeitrag ansehen
                </summary>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[rgb(var(--muted))]">
                  {entry.sourceText}
                </p>
              </details>

              <div className="mt-4 grid gap-3 xl:grid-cols-2">
                {entry.branches.map((branch) => {
                  const guardrailLines = resolveLedgerGuardrailLines(branch);
                  const handoff = resolveBranchHandoffTarget({
                    packageId: entry.packageId,
                    ledgerId: entry.ledgerId,
                    branch,
                    accountAnchorId: buildLedgerBranchAnchorId(entry.packageId, branch.branchId),
                  });

                  return (
                    <div
                      key={`${entry.ledgerId}-${branch.branchId}`}
                      id={buildLedgerBranchAnchorId(entry.packageId, branch.branchId)}
                      className="rounded-2xl border border-slate-200/80 px-4 py-4 dark:border-[rgb(var(--border))]"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-[rgb(var(--fg))]">{branch.title}</p>
                        <p className="text-sm leading-relaxed text-[rgb(var(--muted))]">{branch.summary}</p>
                      </div>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                        {resolveLedgerDraftTypeLabel(branch)}
                      </p>
                      <p className="mt-3 text-sm font-medium text-[rgb(var(--fg))]">
                        {resolveLedgerStatusLabel(branch)}
                      </p>
                      {branch.correctedStreetName || branch.detectedStreetName ? (
                        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                          Straße: {branch.correctedStreetName ?? branch.detectedStreetName}
                        </p>
                      ) : null}
                      {branch.suppliedPlace ? (
                        <p className="mt-2 text-sm text-[rgb(var(--muted))]">Ort: {branch.suppliedPlace}</p>
                      ) : branch.needsPlaceClarification ? (
                        <p className="mt-2 text-sm text-[rgb(var(--muted))]">Ort noch offen</p>
                      ) : null}
                      {branch.streetVerificationStatus === "unavailable" ? (
                        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                          Straße noch nicht im Register geprüft
                        </p>
                      ) : branch.streetVerificationStatus === "verified" ? (
                        <p className="mt-2 text-sm text-[rgb(var(--muted))]">Straße im Register gefunden</p>
                      ) : branch.streetVerificationStatus === "skipped" ? (
                        <p className="mt-2 text-sm text-[rgb(var(--muted))]">Straßenprüfung übersprungen</p>
                      ) : null}
                      {branch.placeResolution?.jurisdictionCandidates?.[0] ? (
                        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                          Mögliche Zuständigkeit: {branch.placeResolution.jurisdictionCandidates[0].label} –
                          bitte prüfen.
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {guardrailLines.map((line) => (
                          <span
                            key={`${branch.branchId}-${line}`}
                            className="rounded-full border border-slate-300/70 px-2.5 py-1 text-xs text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]"
                          >
                            {line}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <details className="rounded-full border border-slate-300/70 px-3 py-1.5 text-xs text-[rgb(var(--fg))] dark:border-[rgb(var(--border))]">
                          <summary className="cursor-pointer list-none font-semibold">Draft ansehen</summary>
                          <div className="mt-3 space-y-2 rounded-xl border border-slate-200/80 bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%)] px-3 py-3 text-left text-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))]">
                            <p className="text-[rgb(var(--muted))]">
                              Draft/Preparation only. Veröffentlichung, Zählung oder Zusammenführung brauchen
                              eine spätere explizite Bestätigung.
                            </p>
                            <p className="text-[rgb(var(--muted))]">
                              Vermutete Haltung: {branch.inferredStance}. Das wurde noch nicht gezählt.
                            </p>
                            {branch.needsPlaceClarification ? (
                              <>
                                {branch.correctedStreetName || branch.detectedStreetName ? (
                                  <p className="text-[rgb(var(--muted))]">
                                    Straße: {branch.correctedStreetName ?? branch.detectedStreetName}
                                  </p>
                                ) : null}
                                <p className="text-[rgb(var(--muted))]">
                                  {branch.suppliedPlace ? `Ort ergänzt: ${branch.suppliedPlace}` : "Ort noch offen"}
                                </p>
                                {branch.placeResolution?.selectedCandidate ? (
                                  <p className="text-[rgb(var(--muted))]">
                                    Vorgemerkter Ortsvorschlag:{" "}
                                    {[
                                      branch.placeResolution.selectedCandidate.streetName,
                                      branch.placeResolution.selectedCandidate.city,
                                    ]
                                      .filter(Boolean)
                                      .join(", ")}
                                  </p>
                                ) : null}
                                {branch.placeClarificationQuestion ? (
                                  <p className="text-[rgb(var(--muted))]">
                                    Ortsfrage: {branch.placeClarificationQuestion}
                                  </p>
                                ) : null}
                              </>
                            ) : null}
                            {branch.qrParticipationDraft ? (
                              <>
                                <p className="text-[rgb(var(--muted))]">
                                  QR-Beteiligung: {branch.qrParticipationDraft.question ?? "Frage noch offen"}
                                </p>
                                <p className="text-[rgb(var(--muted))]">
                                  Noch kein QR-Link erzeugt. Teilen und Veröffentlichen bleiben deaktiviert.
                                </p>
                              </>
                            ) : null}
                            {branch.swipeDraft ? (
                              <>
                                <p className="text-[rgb(var(--muted))]">
                                  Swipe-Draft: {branch.swipeDraft.statements.length} Aussage(n), noch nicht
                                  öffentlich und nicht gezählt.
                                </p>
                                {branch.swipeDraft.statements.length === 0 ? (
                                  <p className="text-[rgb(var(--muted))]">
                                    Für diesen Themenast fehlen noch passende Swipe-Aussagen.
                                  </p>
                                ) : null}
                              </>
                            ) : null}
                            {branch.existingMatchDecision ? (
                              <>
                                <p className="text-[rgb(var(--muted))]">
                                  Bestehende Referenz: {branch.existingMatchDecision.targetTitle}
                                </p>
                                {resolveExistingMatchDecisionSummary(branch) ? (
                                  <p className="text-[rgb(var(--muted))]">
                                    {resolveExistingMatchDecisionSummary(branch)}
                                  </p>
                                ) : null}
                                {resolveDifferenceReasonLabel(
                                  branch.existingMatchDecision.differenceReason,
                                ) ? (
                                  <p className="text-[rgb(var(--muted))]">
                                    Unterschied:{" "}
                                    {resolveDifferenceReasonLabel(
                                      branch.existingMatchDecision.differenceReason,
                                    )}
                                  </p>
                                ) : null}
                                {branch.existingMatchDecision.userNuanceText ? (
                                  <p className="text-[rgb(var(--muted))]">
                                    Nuance: {branch.existingMatchDecision.userNuanceText}
                                  </p>
                                ) : null}
                              </>
                            ) : null}
                          </div>
                        </details>
                        {handoff.handoffTargetUrl ? (
                          <Link href={handoff.handoffTargetUrl} className={ghostDarkButtonClass()}>
                            {handoff.label}
                          </Link>
                        ) : (
                          <span className={ghostDarkButtonClass()}>Arbeitsentwurf vorbereitet</span>
                        )}
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-[rgb(var(--muted))]">
                        {handoff.description}
                      </p>
                      {handoff.reviewPreparationDraft ? (
                        <div className="mt-3 rounded-xl border border-slate-200/80 bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%)] px-3 py-3 text-xs text-[rgb(var(--muted))] dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))]">
                          <p>
                            Analyse-Entwurf mit offener Quellenlage. Du entscheidest, ob eine
                            redaktionelle Prüfung oder Quellenprüfung gestartet wird.
                          </p>
                          {handoff.reviewPreparationDraft.openQuestions.length > 0 ? (
                            <p className="mt-2">
                              Offene Fragen: {handoff.reviewPreparationDraft.openQuestions.join(" · ")}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
