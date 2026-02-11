"use client";

import { useEffect, useMemo, useState } from "react";
import type { Campaign } from "@core/campaigns";
import { useLocale } from "@/context/LocaleContext";
import { useAutoTranslateText } from "@/lib/i18n/autoTranslate";

type Question = {
  id: string;
  prompt: string;
  description?: string;
  type?: "choice" | "scale" | "text";
  options?: string[];
};

type LoadState = "idle" | "loading" | "error";

const DEFAULT_OPTIONS = ["Zustimme", "Neutral", "Lehne ab"];

type CampaignQrClientProps = {
  campaign: Campaign;
  sessionCode: string;
};

export default function CampaignQrClient({ campaign, sessionCode }: CampaignQrClientProps) {
  const { locale } = useLocale();
  const t = useAutoTranslateText({ locale, namespace: `campaign-qr-${campaign.id ?? campaign.slug}` });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const ready = useMemo(() => sessionId && questions.length > 0, [sessionId, questions.length]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setState("loading");
      setError(null);
      try {
        const [questionRes, joinRes] = await Promise.all([
          fetch(`/api/campaigns/${campaign.id ?? campaign.slug}/questions`, { cache: "no-store" }),
          fetch(`/api/campaigns/${campaign.id ?? campaign.slug}/join`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              source: "qr",
              sessionCode,
              meta: { sessionCode },
            }),
          }),
        ]);
        const questionBody = await questionRes.json().catch(() => ({}));
        const joinBody = await joinRes.json().catch(() => ({}));
        if (!questionRes.ok || !questionBody?.ok) {
          throw new Error(questionBody?.error || questionRes.statusText);
        }
        if (!joinRes.ok || !joinBody?.ok) {
          throw new Error(joinBody?.error || joinRes.statusText);
        }
        if (!cancelled) {
          setQuestions(questionBody.items ?? []);
          setSessionId(joinBody.session?.id ?? null);
          setState("idle");
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? "Kampagne konnte nicht geladen werden.");
          setState("error");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [campaign.id, campaign.slug, sessionCode]);

  const handleSubmit = async () => {
    if (!sessionId) return;
    setError(null);
    try {
      const payload = questions
        .map((q) => ({ questionId: q.id, answer: answers[q.id]?.trim() || "" }))
        .filter((entry) => entry.answer);
      if (payload.length === 0) {
        setError(t("Bitte beantworte mindestens eine Frage.", "error.minimum"));
        return;
      }
      const res = await fetch(`/api/campaigns/${campaign.id ?? campaign.slug}/responses`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId, answers: payload }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error || res.statusText);
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message ?? t("Senden fehlgeschlagen.", "error.submit"));
    }
  };

  if (state === "loading") {
    return (
      <main className="min-h-screen bg-slate-50 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center text-sm text-slate-500">
          {t("Kampagne lädt …", "loading")}
        </div>
      </main>
    );
  }

  if (state === "error") {
    return (
      <main className="min-h-screen bg-slate-50 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center text-sm text-rose-600">
          {error ?? t("Kampagne nicht verfügbar.", "error.default")}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      <section className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("Kampagne", "label")}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{campaign.title}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {campaign.description ?? t("Danke, dass du teilnimmst.", "intro")}
          </p>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            {t("Session-Code", "code.label")}:{" "}
            <span className="font-semibold text-slate-700">{sessionCode}</span>
          </div>

          {!ready && (
            <p className="mt-6 text-sm text-slate-500">{t("Fragen werden geladen …", "questions.loading")}</p>
          )}

          {ready && (
            <div className="mt-6 space-y-6">
              {questions.map((question, idx) => {
                const options = question.options?.length ? question.options : DEFAULT_OPTIONS;
                return (
                  <div key={question.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {t("Frage", "question.label")} {idx + 1}
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-slate-900">{question.prompt}</h2>
                    {question.description && (
                      <p className="mt-1 text-sm text-slate-600">{question.description}</p>
                    )}

                    {question.type === "text" ? (
                      <label className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
                        {t("Antwort", "answer.label")}
                        <textarea
                          value={answers[question.id] ?? ""}
                          onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                          className="min-h-[96px] rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                        />
                      </label>
                    ) : (
                      <fieldset className="mt-4 space-y-2">
                        <legend className="sr-only">{question.prompt}</legend>
                        {options.map((opt) => (
                          <label key={opt} className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                              type="radio"
                              name={`q-${question.id}`}
                              value={opt}
                              checked={answers[question.id] === opt}
                              onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: opt }))}
                              className="h-4 w-4 text-slate-900"
                            />
                            {opt}
                          </label>
                        ))}
                      </fieldset>
                    )}
                  </div>
                );
              })}

              {error && (
                <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
                  {error}
                </div>
              )}

              {submitted ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {t("Danke! Deine Antworten sind eingegangen.", "submit.success")}
                </div>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                >
                  {t("Antworten absenden", "submit")}
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
