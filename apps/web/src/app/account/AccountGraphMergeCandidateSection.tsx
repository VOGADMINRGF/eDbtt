"use client";

import Link from "next/link";
import { FiLayers } from "react-icons/fi";
import type { GraphMergeCandidate } from "@features/graphMergeCandidatesClient";
import {
  getGraphMergeCandidateKindLabel,
  getGraphMergeCandidateMergeStatusLabel,
  getGraphMergeCandidateReviewStatusLabel,
} from "@features/graphMergeCandidatesClient";

type Props = {
  candidates: GraphMergeCandidate[];
};

export default function AccountGraphMergeCandidateSection({ candidates }: Props) {
  if (candidates.length === 0) return null;

  return (
    <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-500 ring-1 ring-sky-300/30">
          <FiLayers className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Graph-Kandidaten</h2>
          <p className="mt-1 text-xs text-[rgb(var(--muted))]">
            Diese Kandidaten bleiben Arbeitsstände rund um eine mögliche Zusammenführung. Eine Zusammenführung ist nicht automatisch eine Veröffentlichung.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {candidates.map((candidate) => (
          <article
            key={candidate.id}
            className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4"
          >
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-[rgb(var(--muted))]">
                {getGraphMergeCandidateKindLabel(candidate.candidateKind)}
              </span>
              <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-[rgb(var(--muted))]">
                {getGraphMergeCandidateReviewStatusLabel(candidate.reviewStatus)}
              </span>
              <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-[rgb(var(--muted))]">
                {getGraphMergeCandidateMergeStatusLabel(candidate.mergeStatus)}
              </span>
              <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-[rgb(var(--muted))]">
                Noch nicht veröffentlicht
              </span>
              {candidate.reviewStatus === "merged" || candidate.mergeStatus === "merged" ? (
                <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-[rgb(var(--muted))]">
                  Zusammenführung bestätigt
                </span>
              ) : (
                <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-[rgb(var(--muted))]">
                  Noch nicht zusammengeführt
                </span>
              )}
            </div>
            <p className="mt-3 text-sm text-[rgb(var(--fg))]">{candidate.text}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-[rgb(var(--muted))]">
              <span>Status: {candidate.verificationLabel}</span>
              <span>Truth-Status: {candidate.truthStatus}</span>
              <span>Quellenlage: {candidate.sourceSupport}</span>
              <span>Nur nach redaktioneller Bestätigung</span>
              <span>{new Date(candidate.updatedAt).toLocaleString("de-DE")}</span>
            </div>
            <p className="mt-2 text-xs text-[rgb(var(--muted))]">
              {candidate.reviewStatus === "merged" || candidate.mergeStatus === "merged"
                ? "Zusammenführung bestätigt"
                : candidate.reviewStatus === "staged" || candidate.mergeStatus === "merge_ready"
                  ? "Für Zusammenführung vorbereitet"
                  : "Graph-Merge in Prüfung"}
            </p>
            {candidate.duplicateCandidates?.length ? (
              <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                Möglicherweise bereits vorhanden: {candidate.duplicateCandidates.length} Hinweis(e)
              </p>
            ) : null}
            {candidate.statusNote ? (
              <p className="mt-2 text-xs text-[rgb(var(--muted))]">{candidate.statusNote}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/account"
                className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--fg))]"
              >
                Arbeitsstand ansehen
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
