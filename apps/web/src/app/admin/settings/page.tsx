"use client";

import { useState } from "react";
import { adminConfig, type AdminConfig } from "@/config/admin-config";

function toNumberOrZero(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function AdminSettingsPage() {
  const [cfg, setCfg] = useState<AdminConfig>(adminConfig);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">Admin - Einstellungen</h1>
      <p className="mt-1 text-sm text-[rgb(var(--muted))]">Kosten und Limits live justieren.</p>

      <section className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">Mitgliedschaft (EUR/Monat)</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            defaultValue={cfg.pricing.membershipMonthlyEUR}
            onChange={(e) =>
              setCfg({
                ...cfg,
                pricing: { ...cfg.pricing, membershipMonthlyEUR: toNumberOrZero(e.target.value) },
              })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Sofort-Beitrag (EUR/Post)</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            defaultValue={cfg.pricing.postImmediateEUR}
            onChange={(e) =>
              setCfg({
                ...cfg,
                pricing: { ...cfg.pricing, postImmediateEUR: toNumberOrZero(e.target.value) },
              })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Swipe-zu-Post Schwellen (Komma-getrennt)</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            defaultValue={cfg.pricing.swipeToPostThresholds.join(",")}
            onChange={(e) =>
              setCfg({
                ...cfg,
                pricing: {
                  ...cfg.pricing,
                  swipeToPostThresholds: e.target.value
                    .split(",")
                    .map((entry) => toNumberOrZero(entry.trim())),
                },
              })
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Newsfeed Max/Run</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              defaultValue={cfg.limits.newsfeedMaxPerRun}
              onChange={(e) =>
                setCfg({
                  ...cfg,
                  limits: { ...cfg.limits, newsfeedMaxPerRun: toNumberOrZero(e.target.value) },
                })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Factcheck Token-Limit</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              defaultValue={cfg.limits.factcheckMaxPerItemTokens}
              onChange={(e) =>
                setCfg({
                  ...cfg,
                  limits: { ...cfg.limits, factcheckMaxPerItemTokens: toNumberOrZero(e.target.value) },
                })
              }
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="autopost"
            type="checkbox"
            defaultChecked={cfg.limits.enableAutoPost}
            onChange={(e) =>
              setCfg({
                ...cfg,
                limits: { ...cfg.limits, enableAutoPost: e.target.checked },
              })
            }
          />
          <label htmlFor="autopost" className="text-sm">
            Auto-Draft für neue Themen aktiv
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium">Standard-Region (Key)</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            defaultValue={cfg.region.defaultRegionKey}
            onChange={(e) =>
              setCfg({
                ...cfg,
                region: { ...cfg.region, defaultRegionKey: e.target.value },
              })
            }
          />
        </div>
      </section>

      <button type="button" className="btn btn-primary mt-6 rounded px-4 py-2">
        Speichern (env-basiert)
      </button>
      <p className="mt-2 text-xs text-[rgb(var(--muted))]">
        Hinweis: Werte werden aus ENV gelesen. Persistenz via Admin-API ergänzen.
      </p>
    </div>
  );
}
