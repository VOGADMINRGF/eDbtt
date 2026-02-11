"use client";

import { useState } from "react";
import type { Campaign } from "@core/campaigns";
import { useLocale } from "@/context/LocaleContext";
import { useAutoTranslateText } from "@/lib/i18n/autoTranslate";

type JoinStatus = "idle" | "loading" | "success" | "error";

type CampaignJoinClientProps = {
  campaign: Campaign;
};

function formatDate(value?: string | Date | null) {
  if (!value) return "—";
  const dt = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dt.valueOf())) return "—";
  return dt.toLocaleDateString("de-DE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default function CampaignJoinClient({ campaign }: CampaignJoinClientProps) {
  const { locale } = useLocale();
  const t = useAutoTranslateText({ locale, namespace: `campaign-join-${campaign.id ?? "unknown"}` });
  const [status, setStatus] = useState<JoinStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [regionCode, setRegionCode] = useState("");

  const joinCampaign = async () => {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id ?? campaign.slug}/join`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          source: "page",
          regionCode: regionCode.trim() || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error || res.statusText);
      }
      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setError(err?.message ?? "Join fehlgeschlagen.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      <section className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("Campaign", "label")}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{campaign.title}</h1>
          <p className="mt-3 text-sm text-slate-600">{campaign.description || t("Ohne Beschreibung.", "empty")}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("Zeitraum", "range.label")}
              </p>
              <p className="mt-2 font-semibold text-slate-800">
                {formatDate(campaign.startsAt ?? null)} – {formatDate(campaign.endsAt ?? null)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("Ziel", "goal.label")}
              </p>
              <p className="mt-2 font-semibold text-slate-800">{campaign.goal || t("Offen", "goal.empty")}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("Status", "status.label")}
              </p>
              <p className="mt-2 font-semibold text-slate-800">{campaign.status ?? "draft"}</p>
            </div>
          </div>

          {campaign.tags?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {campaign.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
            <label className="flex flex-col gap-2 text-sm text-slate-600">
              {t("Deine Region (optional)", "region.label")}
              <input
                value={regionCode}
                onChange={(e) => setRegionCode(e.target.value)}
                placeholder={t("z. B. DE-BE", "region.placeholder")}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </label>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                {t("Mit deinem Join wird eine Session für diese Kampagne erfasst.", "hint")}
              </p>
              <button
                onClick={joinCampaign}
                disabled={status === "loading"}
                className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === "loading" ? t("Bitte warten…", "cta.loading") : t("Kampagne unterstützen", "cta")}
              </button>
            </div>
            <div className="mt-3 text-xs text-slate-500" aria-live="polite">
              {status === "success" && t("Danke! Deine Session wurde erfasst.", "status.success")}
              {status === "error" && (error ? `${t("Fehler:", "status.error")} ${error}` : t("Fehler.", "status.error.default"))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
