"use client";

import Link from "next/link";
import { FiCheckCircle, FiShield } from "react-icons/fi";
import AccountEditorialReviewReplyForm from "./AccountEditorialReviewReplyForm";
import type { EditorialReviewRequest } from "@features/editorialReviewQueueClient";
import {
  getEditorialReviewNextStepLabel,
  getEditorialReviewReasonLabel,
  getEditorialReviewSourceTypeLabel,
  getEditorialReviewStatusLabel,
} from "@features/editorialReviewQueueClient";

type Props = {
  requests: EditorialReviewRequest[];
  onRefresh?: (() => Promise<void>) | (() => void);
};

function statusTone(status: EditorialReviewRequest["status"]) {
  switch (status) {
    case "accepted_for_workup":
      return "border-emerald-300/60 bg-emerald-50 text-emerald-900 dark:border-emerald-500/35 dark:bg-emerald-500/12 dark:text-emerald-100";
    case "rejected":
      return "border-rose-300/60 bg-rose-50 text-rose-900 dark:border-rose-500/35 dark:bg-rose-500/12 dark:text-rose-100";
    case "archived":
      return "border-slate-300/60 bg-slate-100 text-slate-900 dark:border-slate-500/35 dark:bg-slate-500/12 dark:text-slate-100";
    default:
      return "border-amber-300/60 bg-amber-50 text-amber-900 dark:border-amber-500/35 dark:bg-amber-500/12 dark:text-amber-100";
  }
}

export default function AccountEditorialReviewSection({ requests, onRefresh }: Props) {
  if (requests.length === 0) return null;

  return (
    <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-500 ring-1 ring-sky-300/30">
          <FiShield className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Redaktionelle Prüfung</h2>
          <p className="mt-1 text-xs text-[rgb(var(--muted))]">
            Diese Anfragen sind Arbeitsstände. Nichts davon ist automatisch veröffentlicht, zusammengeführt oder verifiziert.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {requests.map((request) => (
          <article key={request.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`rounded-full border px-2 py-1 ${statusTone(request.status)}`}>
                {getEditorialReviewStatusLabel(request.status)}
              </span>
              <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-[rgb(var(--muted))]">
                {getEditorialReviewSourceTypeLabel(request.sourceType)}
              </span>
              <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-[rgb(var(--muted))]">
                {getEditorialReviewReasonLabel(request.reason)}
              </span>
              <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-[rgb(var(--muted))]">
                Noch nicht veröffentlicht
              </span>
              {request.lastAction === "user_replied" ? (
                <span className="rounded-full border border-emerald-300/60 bg-emerald-50 px-2 py-1 text-emerald-900 dark:border-emerald-500/35 dark:bg-emerald-500/12 dark:text-emerald-100">
                  Antwort gesendet
                </span>
              ) : null}
            </div>
            <div className="mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                Ursprünglicher Beitrag
              </p>
              <p className="mt-2 text-sm text-[rgb(var(--fg))]">{request.originalText}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-[rgb(var(--muted))]">
              <span>Status: {request.verificationLabel}</span>
              <span>Truth-Status: {request.truthStatus}</span>
              <span>Quellenlage: {request.sourceSupport}</span>
              <span>Nächster Schritt: {getEditorialReviewNextStepLabel({ sourceType: request.sourceType, status: request.status })}</span>
              <span>{new Date(request.updatedAt).toLocaleString("de-DE")}</span>
            </div>
            {request.userNote ? (
              <p className="mt-3 text-xs text-[rgb(var(--muted))]">Dein Hinweis: {request.userNote}</p>
            ) : null}
            {request.userVisibleNote || request.statusNote ? (
              <div className="mt-3 rounded-2xl border border-amber-300/60 bg-amber-50 p-3 text-xs text-amber-950 dark:border-amber-500/35 dark:bg-amber-500/12 dark:text-amber-100">
                <p className="font-semibold">Rückfrage der Redaktion</p>
                <p className="mt-2 inline-flex items-start gap-2">
                  <FiCheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span>{request.userVisibleNote ?? request.statusNote}</span>
                </p>
              </div>
            ) : null}
            {request.userReplies?.length ? (
              <div className="mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 text-xs text-[rgb(var(--muted))]">
                <p className="font-semibold text-[rgb(var(--fg))]">Deine letzte Antwort</p>
                <p className="mt-2 text-sm text-[rgb(var(--fg))]">
                  {request.userReplies[request.userReplies.length - 1]?.text}
                </p>
              </div>
            ) : null}
            {request.status === "needs_user_clarification" ? (
              <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                  Rückfrage erforderlich
                </p>
                <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                  Noch nicht veröffentlicht. Deine Antwort bleibt an dieser Prüfbitte und erzeugt keinen neuen Request.
                </p>
                <div className="mt-3">
                  <AccountEditorialReviewReplyForm requestId={request.id} onSubmitted={onRefresh} />
                </div>
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/create"
                className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--fg))]"
              >
                Prüfung fortsetzen
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
