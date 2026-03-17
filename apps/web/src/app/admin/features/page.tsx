"use client";

import { useEffect, useMemo, useState } from "react";
import { ACCESS_TIERS, type AccessTier } from "@/config/accessTiers";
import {
  ENGAGEMENT_LEVEL_THRESHOLDS,
  XP_EVENTS,
  type EngagementLevel,
} from "@/config/engagement";
import {
  MAX_STORED_CONTRIBUTION_CREDITS,
  SWIPES_PER_CONTRIBUTION_CREDIT,
} from "@/config/credits";

type FeatureValue = string | number | boolean;

type FeatureRow = {
  key: string;
  label: string;
  description: string;
  valueType: "boolean" | "number" | "enum";
  enumValues?: string[];
  defaults: Partial<Record<AccessTier, FeatureValue>>;
  overrides: Partial<Record<AccessTier, FeatureValue | null>>;
  effective: Partial<Record<AccessTier, FeatureValue>>;
};

type AdminFeaturesPayload = {
  ok: boolean;
  features: FeatureRow[];
  engagement: {
    xpEvents: Record<string, number>;
    thresholds: Array<{ level: EngagementLevel; minXp: number }>;
  };
  credits: {
    swipesPerContributionCredit: number;
    maxStoredContributionCredits: number;
  };
};

type DraftValues = Record<string, Partial<Record<AccessTier, string>>>;

type TabKey = "features" | "engagement" | "credits";

function toCellString(value: FeatureValue | null | undefined) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function parseValue(kind: FeatureRow["valueType"], raw: string) {
  if (kind === "boolean") {
    if (raw !== "true" && raw !== "false") {
      return { ok: false as const, error: "Nur true/false erlaubt." };
    }
    return { ok: true as const, value: raw === "true" };
  }

  if (kind === "number") {
    const num = Number(raw);
    if (!Number.isFinite(num)) {
      return { ok: false as const, error: "Bitte eine Zahl eingeben." };
    }
    return { ok: true as const, value: Math.max(0, Math.floor(num)) };
  }

  if (!raw.trim()) {
    return { ok: false as const, error: "Bitte einen Wert wählen." };
  }

  return { ok: true as const, value: raw };
}

export default function AdminFeaturesPage() {
  const [tab, setTab] = useState<TabKey>("features");
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savingSection, setSavingSection] = useState<"engagement" | "credits" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [features, setFeatures] = useState<FeatureRow[]>([]);
  const [draftValues, setDraftValues] = useState<DraftValues>({});

  const [xpEventsDraft, setXpEventsDraft] = useState<Record<string, number>>(XP_EVENTS);
  const [thresholdDraft, setThresholdDraft] = useState(ENGAGEMENT_LEVEL_THRESHOLDS);
  const [creditsDraft, setCreditsDraft] = useState({
    swipesPerContributionCredit: SWIPES_PER_CONTRIBUTION_CREDIT,
    maxStoredContributionCredits: MAX_STORED_CONTRIBUTION_CREDITS,
  });

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const authRes = await fetch("/api/auth/me", { cache: "no-store" });
        const authBody = await authRes.json().catch(() => ({}));
        if (!authRes.ok || authBody?.user?.accessTier !== "staff") {
          if (!ignore) setError("Nur Staff-Accounts dürfen diese Seite öffnen.");
          return;
        }

        const res = await fetch("/api/admin/features", { cache: "no-store" });
        const body = (await res.json().catch(() => ({}))) as AdminFeaturesPayload;
        if (!res.ok || !body.ok) {
          throw new Error((body as any)?.error ?? "load_failed");
        }

        if (ignore) return;

        setFeatures(body.features ?? []);
        setXpEventsDraft(body.engagement?.xpEvents ?? XP_EVENTS);
        setThresholdDraft(body.engagement?.thresholds ?? ENGAGEMENT_LEVEL_THRESHOLDS);
        setCreditsDraft(
          body.credits ?? {
            swipesPerContributionCredit: SWIPES_PER_CONTRIBUTION_CREDIT,
            maxStoredContributionCredits: MAX_STORED_CONTRIBUTION_CREDITS,
          },
        );

        const nextDrafts: DraftValues = {};
        for (const feature of body.features ?? []) {
          nextDrafts[feature.key] = {};
          for (const tier of ACCESS_TIERS) {
            nextDrafts[feature.key][tier] = toCellString(feature.effective[tier]);
          }
        }
        setDraftValues(nextDrafts);
      } catch (err: any) {
        if (!ignore) {
          setError(err?.message ?? "Daten konnten nicht geladen werden.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, []);

  const validationErrors = useMemo(() => {
    const out: Record<string, Partial<Record<AccessTier, string>>> = {};

    for (const feature of features) {
      out[feature.key] = {};
      for (const tier of ACCESS_TIERS) {
        const raw = draftValues[feature.key]?.[tier] ?? "";
        const parsed = parseValue(feature.valueType, raw);
        if (!parsed.ok) {
          out[feature.key][tier] = parsed.error;
          continue;
        }

        if (feature.valueType === "enum" && feature.enumValues?.length) {
          if (!feature.enumValues.includes(String(parsed.value))) {
            out[feature.key][tier] = "Ungültiger Enum-Wert.";
          }
        }
      }
    }

    return out;
  }, [draftValues, features]);

  async function saveFeature(feature: FeatureRow) {
    const values: Partial<Record<AccessTier, FeatureValue>> = {};

    for (const tier of ACCESS_TIERS) {
      const raw = draftValues[feature.key]?.[tier] ?? "";
      const parsed = parseValue(feature.valueType, raw);
      if (!parsed.ok) {
        setError(`${feature.label} (${tier}): ${parsed.error}`);
        return;
      }

      if (feature.valueType === "enum" && feature.enumValues?.length) {
        if (!feature.enumValues.includes(String(parsed.value))) {
          setError(`${feature.label} (${tier}): Ungültiger Enum-Wert.`);
          return;
        }
      }

      values[tier] = parsed.value;
    }

    setSavingKey(feature.key);
    setError(null);
    setNotice(null);

    try {
      const res = await fetch(`/api/admin/features/${feature.key}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ values }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.message || body?.error || "save_failed");
      }

      const updated = body.feature as FeatureRow;
      setFeatures((prev) => prev.map((row) => (row.key === updated.key ? updated : row)));
      setNotice(`Feature „${feature.label}“ gespeichert.`);
    } catch (err: any) {
      setError(err?.message ?? "Speichern fehlgeschlagen.");
    } finally {
      setSavingKey(null);
    }
  }

  async function saveEngagementSettings() {
    setSavingSection("engagement");
    setNotice(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/features", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          engagement: {
            xpEvents: xpEventsDraft,
            thresholds: thresholdDraft,
          },
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error || "save_failed");
      }
      setNotice("Engagement- und XP-Konfiguration gespeichert.");
    } catch (err: any) {
      setError(err?.message ?? "Speichern fehlgeschlagen.");
    } finally {
      setSavingSection(null);
    }
  }

  async function saveCreditsSettings() {
    setSavingSection("credits");
    setNotice(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/features", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credits: creditsDraft,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error || "save_failed");
      }
      setNotice("Credits- und Swipe-Konfiguration gespeichert.");
    } catch (err: any) {
      setError(err?.message ?? "Speichern fehlgeschlagen.");
    } finally {
      setSavingSection(null);
    }
  }

  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Staff Admin</p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Access & Feature Control</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Zentrale Steuerung für Feature-Matrix, Engagement-Schwellen und Credit-Konfiguration.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("features")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            tab === "features"
              ? "bg-[rgb(var(--fg))] text-[rgb(var(--bg))]"
              : "border border-[rgb(var(--border))] text-[rgb(var(--muted))]"
          }`}
        >
          Features
        </button>
        <button
          type="button"
          onClick={() => setTab("engagement")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            tab === "engagement"
              ? "bg-[rgb(var(--fg))] text-[rgb(var(--bg))]"
              : "border border-[rgb(var(--border))] text-[rgb(var(--muted))]"
          }`}
        >
          Engagement & XP
        </button>
        <button
          type="button"
          onClick={() => setTab("credits")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            tab === "credits"
              ? "bg-[rgb(var(--fg))] text-[rgb(var(--bg))]"
              : "border border-[rgb(var(--border))] text-[rgb(var(--muted))]"
          }`}
        >
          Credits & Swipes
        </button>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{notice}</div>}

      {loading ? (
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-8 text-center text-sm text-[rgb(var(--muted))]">
          Lädt …
        </div>
      ) : null}

      {!loading && tab === "features" ? (
        <div className="overflow-x-auto rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-sm">
          <table className="min-w-full divide-y divide-[rgb(var(--border))] text-sm">
            <thead className="bg-[rgb(var(--bg))] text-left text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
              <tr>
                <th className="px-4 py-3">Feature</th>
                {ACCESS_TIERS.map((tier) => (
                  <th key={tier} className="px-3 py-3">{tier}</th>
                ))}
                <th className="px-4 py-3 text-right">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border))]">
              {features.map((feature) => (
                <tr key={feature.key}>
                  <td className="px-4 py-3 align-top">
                    <div className="font-semibold text-[rgb(var(--fg))]">{feature.label}</div>
                    <div className="text-xs text-[rgb(var(--muted))]">{feature.key}</div>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">{feature.description}</p>
                  </td>

                  {ACCESS_TIERS.map((tier) => {
                    const value = draftValues[feature.key]?.[tier] ?? "";
                    const hasOverride = feature.overrides[tier] !== null && feature.overrides[tier] !== undefined;
                    const cellError = validationErrors[feature.key]?.[tier];

                    return (
                      <td key={`${feature.key}:${tier}`} className="px-3 py-3 align-top">
                        <div className="flex flex-col gap-1">
                          {feature.valueType === "boolean" ? (
                            <select
                              className="rounded-md border border-[rgb(var(--border))] px-2 py-1 text-xs"
                              value={value}
                              onChange={(e) =>
                                setDraftValues((prev) => ({
                                  ...prev,
                                  [feature.key]: { ...(prev[feature.key] ?? {}), [tier]: e.target.value },
                                }))
                              }
                            >
                              <option value="true">true</option>
                              <option value="false">false</option>
                            </select>
                          ) : feature.valueType === "enum" ? (
                            <select
                              className="rounded-md border border-[rgb(var(--border))] px-2 py-1 text-xs"
                              value={value}
                              onChange={(e) =>
                                setDraftValues((prev) => ({
                                  ...prev,
                                  [feature.key]: { ...(prev[feature.key] ?? {}), [tier]: e.target.value },
                                }))
                              }
                            >
                              {(feature.enumValues ?? []).map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              className="w-[92px] rounded-md border border-[rgb(var(--border))] px-2 py-1 text-xs"
                              value={value}
                              onChange={(e) =>
                                setDraftValues((prev) => ({
                                  ...prev,
                                  [feature.key]: { ...(prev[feature.key] ?? {}), [tier]: e.target.value },
                                }))
                              }
                            />
                          )}

                          {hasOverride ? (
                            <span className="inline-flex w-fit rounded-full border border-amber-300 bg-amber-50 px-2 py-[2px] text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                              Override
                            </span>
                          ) : (
                            <span className="text-[10px] text-[rgb(var(--muted))]">Default</span>
                          )}

                          {cellError ? <span className="text-[10px] text-rose-600">{cellError}</span> : null}
                        </div>
                      </td>
                    );
                  })}

                  <td className="px-4 py-3 text-right align-top">
                    <button
                      type="button"
                      onClick={() => saveFeature(feature)}
                      disabled={savingKey === feature.key}
                      className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
                    >
                      {savingKey === feature.key ? "Speichert …" : "Speichern"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!loading && tab === "engagement" ? (
        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">XP Events</h2>
            <p className="mb-3 text-xs text-[rgb(var(--muted))]">Editierbare Vorschau, persistiert aktuell über Code-Config.</p>
            <div className="space-y-2">
              {Object.entries(xpEventsDraft).map(([eventKey, value]) => (
                <label key={eventKey} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-[rgb(var(--fg))]">{eventKey}</span>
                  <input
                    className="w-24 rounded-md border border-[rgb(var(--border))] px-2 py-1 text-right"
                    value={value}
                    onChange={(e) =>
                      setXpEventsDraft((prev) => ({
                        ...prev,
                        [eventKey]: Number.isFinite(Number(e.target.value)) ? Math.max(0, Math.floor(Number(e.target.value))) : 0,
                      }))
                    }
                  />
                </label>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Level Thresholds</h2>
            <p className="mb-3 text-xs text-[rgb(var(--muted))]">Editierbare Vorschau, persistiert aktuell über Code-Config.</p>
            <div className="space-y-2">
              {thresholdDraft.map((entry, idx) => (
                <label key={entry.level} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-[rgb(var(--fg))]">{entry.level}</span>
                  <input
                    className="w-28 rounded-md border border-[rgb(var(--border))] px-2 py-1 text-right"
                    value={entry.minXp}
                    onChange={(e) => {
                      const next = [...thresholdDraft];
                      next[idx] = {
                        ...next[idx],
                        minXp: Number.isFinite(Number(e.target.value)) ? Math.max(0, Math.floor(Number(e.target.value))) : 0,
                      };
                      setThresholdDraft(next);
                    }}
                  />
                </label>
              ))}
            </div>
          </article>

          <div className="md:col-span-2">
            <button
              type="button"
              className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
              onClick={saveEngagementSettings}
              disabled={savingSection === "engagement"}
            >
              {savingSection === "engagement" ? "Speichert …" : "Engagement speichern"}
            </button>
          </div>
        </section>
      ) : null}

      {!loading && tab === "credits" ? (
        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Swipes pro Credit</h2>
            <p className="mb-3 text-xs text-[rgb(var(--muted))]">Editierbare Vorschau, persistiert aktuell über Code-Config.</p>
            <input
              className="w-40 rounded-md border border-[rgb(var(--border))] px-2 py-1"
              value={creditsDraft.swipesPerContributionCredit}
              onChange={(e) =>
                setCreditsDraft((prev) => ({
                  ...prev,
                  swipesPerContributionCredit: Number.isFinite(Number(e.target.value))
                    ? Math.max(1, Math.floor(Number(e.target.value)))
                    : 1,
                }))
              }
            />
          </article>

          <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Max gespeicherte Credits</h2>
            <p className="mb-3 text-xs text-[rgb(var(--muted))]">Editierbare Vorschau, persistiert aktuell über Code-Config.</p>
            <input
              className="w-40 rounded-md border border-[rgb(var(--border))] px-2 py-1"
              value={creditsDraft.maxStoredContributionCredits}
              onChange={(e) =>
                setCreditsDraft((prev) => ({
                  ...prev,
                  maxStoredContributionCredits: Number.isFinite(Number(e.target.value))
                    ? Math.max(1, Math.floor(Number(e.target.value)))
                    : 1,
                }))
              }
            />
          </article>

          <div className="md:col-span-2">
            <button
              type="button"
              className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
              onClick={saveCreditsSettings}
              disabled={savingSection === "credits"}
            >
              {savingSection === "credits" ? "Speichert …" : "Credits speichern"}
            </button>
          </div>
        </section>
      ) : null}
    </main>
  );
}
