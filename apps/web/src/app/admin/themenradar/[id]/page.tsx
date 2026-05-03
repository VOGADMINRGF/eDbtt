"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { resolveThemenradarMembershipEntry } from "@features/themenradar/membershipCta";

type ThemenradarLifecycleStatus =
  | "raw"
  | "qualified"
  | "content_ready"
  | "review_ready"
  | "published"
  | "archived";

type ThemenradarExportFormat = "post" | "carousel" | "script";

type ThemenradarExportDraft = {
  format: ThemenradarExportFormat;
  generatedAt: string;
  manualReleaseOnly: true;
  reviewRequired: true;
  autoPostEligible: false;
  officialSocialAutoPosting: false;
  source: {
    itemId: string;
    title: string;
    lifecycleStatus: "review_ready" | "published";
    campaignKey: string | null;
    linkedAnlassraumId: string | null;
    linkedDossierId: string | null;
    canonicalPublicTarget: string;
    qrTarget: string;
  };
  payload:
    | {
        kind: "post";
        title: string;
        hook: string;
        caption: string;
        cta: string;
        reviewHint: string;
      }
    | {
        kind: "carousel";
        intro: string;
        slides: Array<{ index: number; title: string; message: string }>;
        closingCta: string;
      }
    | {
        kind: "script";
        targetDurationSeconds: number;
        lines: string[];
        voiceover: string[];
        closingCta: string;
      };
};

type ThemenradarDetailPayload = {
  item: {
    id: string;
    title: string;
    rawSignal: string;
    sourceType: "manual" | "news" | "community" | "create_intake";
    heatScore: number;
    everydayRelevanceScore: number;
    polarizationScore: number;
    membershipPotentialScore: number;
    jurisdiction: "bund" | "land" | "kommune" | "mixed";
    lifecycleStatus: ThemenradarLifecycleStatus;
    linkedAnlassraumId?: string | null;
    linkedDossierId?: string | null;
    campaignKey?: string | null;
    shareContractSnapshot?: {
      canonicalPublicTarget: string;
      qrTarget: string;
      socialPublication: {
        autoPostEligible: false;
        needsReviewBeforeOfficialSocial: true;
      };
      shareMeta: {
        shareTitle: string;
        sharePrompt: string;
        shareSummary: string;
      };
    } | null;
    telemetrySnapshot?: {
      clicks: number;
      leads: number;
      memberships: number;
      updatedAt: string;
    } | null;
    reviewRequired: true;
    autoPostEligible: false;
    officialSocialRequiresReview: true;
    createdBy: string | null;
    updatedBy: string | null;
    lastReviewedBy: string | null;
    lastReviewedAt: string | null;
    reviewNotes: string[];
    auditVersion: number;
    archivedAt: string | null;
    archivedBy: string | null;
    createdAt: string;
    updatedAt: string;
  };
  contentPrep: {
    socialHook: string;
    captionVariants: [string, string, string];
    carouselOutline: Array<{ title: string; message: string }>;
    shortVideoScript: {
      targetDurationSeconds: number;
      lines: string[];
    };
    membershipCta: string;
    dossierOrAnlassraumCta: string;
  } | null;
  lifecycleHistory: Array<{
    status: ThemenradarLifecycleStatus;
    at: string;
    note: string | null;
  }>;
  auditTrail: Array<{
    id: string;
    eventType:
      | "created"
      | "qualified"
      | "content_prep_generated"
      | "review_ready_set"
      | "share_ready_generated"
      | "published_set"
      | "archived"
      | "lifecycle_transition";
    at: string;
    actorUserId: string | null;
    actorEmail: string | null;
    fromStatus: ThemenradarLifecycleStatus | null;
    toStatus: ThemenradarLifecycleStatus | null;
    note: string | null;
    auditVersion: number;
  }>;
};

const STATUS_OPTIONS: ThemenradarLifecycleStatus[] = [
  "raw",
  "qualified",
  "content_ready",
  "review_ready",
  "published",
  "archived",
];

export default function AdminThemenradarDetailPage() {
  const params = useParams();
  const idParam = params?.id;
  const itemId =
    typeof idParam === "string" ? idParam : Array.isArray(idParam) ? idParam[0] : "";

  const [detail, setDetail] = useState<ThemenradarDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportDraft, setExportDraft] = useState<ThemenradarExportDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [rawSignal, setRawSignal] = useState("");
  const [linkedAnlassraumId, setLinkedAnlassraumId] = useState("");
  const [linkedDossierId, setLinkedDossierId] = useState("");
  const [campaignKey, setCampaignKey] = useState("");
  const [status, setStatus] = useState<ThemenradarLifecycleStatus>("raw");
  const [reviewNote, setReviewNote] = useState("");
  const [publishIntent, setPublishIntent] = useState(false);
  const [scores, setScores] = useState({
    heatScore: 50,
    everydayRelevanceScore: 50,
    polarizationScore: 40,
    membershipPotentialScore: 45,
  });

  async function loadDetail() {
    if (!itemId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/themenradar/${encodeURIComponent(itemId)}`, {
        cache: "no-store",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error ?? "themenradar_detail_failed");
      }
      const payload = body.detail as ThemenradarDetailPayload;
      setDetail(payload);
      setTitle(payload.item.title ?? "");
      setRawSignal(payload.item.rawSignal ?? "");
      setLinkedAnlassraumId(payload.item.linkedAnlassraumId ?? "");
      setLinkedDossierId(payload.item.linkedDossierId ?? "");
      setCampaignKey(payload.item.campaignKey ?? "");
      setStatus(payload.item.lifecycleStatus);
      setPublishIntent(false);
      setExportDraft(null);
      setScores({
        heatScore: payload.item.heatScore,
        everydayRelevanceScore: payload.item.everydayRelevanceScore,
        polarizationScore: payload.item.polarizationScore,
        membershipPotentialScore: payload.item.membershipPotentialScore,
      });
    } catch (loadError: any) {
      setDetail(null);
      setError(loadError?.message ?? "themenradar_detail_failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  const telemetry = useMemo(() => detail?.item.telemetrySnapshot ?? null, [detail]);
  const membershipEntry = useMemo(() => {
    if (!detail) return null;
    return resolveThemenradarMembershipEntry({
      id: detail.item.id,
      title: detail.item.title,
      membershipPotentialScore: detail.item.membershipPotentialScore,
    });
  }, [detail]);
  const exportAllowed =
    detail?.item.lifecycleStatus === "review_ready" ||
    detail?.item.lifecycleStatus === "published";

  async function patchItem() {
    if (!itemId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/themenradar/${encodeURIComponent(itemId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          rawSignal,
          linkedAnlassraumId: linkedAnlassraumId || null,
          linkedDossierId: linkedDossierId || null,
          campaignKey: campaignKey || null,
          lifecycleStatus: status,
          reviewNote: reviewNote || null,
          publishIntent: status === "published" ? publishIntent : false,
          heatScore: Number(scores.heatScore),
          everydayRelevanceScore: Number(scores.everydayRelevanceScore),
          polarizationScore: Number(scores.polarizationScore),
          membershipPotentialScore: Number(scores.membershipPotentialScore),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error ?? "themenradar_update_failed");
      }
      await loadDetail();
    } catch (saveError: any) {
      setError(saveError?.message ?? "themenradar_update_failed");
    } finally {
      setSaving(false);
    }
  }

  async function runContentPrep() {
    if (!itemId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/themenradar/${encodeURIComponent(itemId)}/content-prep`,
        { method: "POST" },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error ?? "themenradar_content_prep_failed");
      }
      await loadDetail();
    } catch (prepError: any) {
      setError(prepError?.message ?? "themenradar_content_prep_failed");
    } finally {
      setSaving(false);
    }
  }

  async function buildShareReady() {
    if (!itemId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/themenradar/${encodeURIComponent(itemId)}/share-ready`,
        { method: "POST" },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error ?? "themenradar_share_ready_failed");
      }
      await loadDetail();
    } catch (shareError: any) {
      setError(shareError?.message ?? "themenradar_share_ready_failed");
    } finally {
      setSaving(false);
    }
  }

  async function addTelemetry(type: "click" | "lead" | "membership") {
    if (!itemId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/themenradar/${encodeURIComponent(itemId)}/telemetry`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ type, amount: 1 }),
        },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error ?? "themenradar_telemetry_failed");
      }
      await loadDetail();
    } catch (telemetryError: any) {
      setError(telemetryError?.message ?? "themenradar_telemetry_failed");
    } finally {
      setSaving(false);
    }
  }

  async function generateManualExport(format: ThemenradarExportFormat) {
    if (!itemId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/themenradar/${encodeURIComponent(itemId)}/export`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ format }),
        },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error ?? "themenradar_export_failed");
      }
      setExportDraft((body?.draft as ThemenradarExportDraft) ?? null);
      await loadDetail();
    } catch (exportError: any) {
      setExportDraft(null);
      setError(exportError?.message ?? "themenradar_export_failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="w-full max-w-full overflow-x-hidden py-6" data-testid="themenradar-detail-page">
        <p className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-4 text-sm text-[rgb(var(--muted))]">
          Lade Themenradar-Details …
        </p>
      </main>
    );
  }

  if (!detail) {
    return (
      <main className="w-full max-w-full overflow-x-hidden py-6 space-y-3" data-testid="themenradar-detail-page">
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
          {error ?? "Eintrag nicht gefunden."}
        </p>
        <Link href="/admin/themenradar" className="text-sm font-semibold text-sky-700 hover:underline">
          Zurück zur Themenradar-Liste
        </Link>
      </main>
    );
  }

  return (
    <main
      className="flex w-full max-w-full flex-col gap-6 overflow-x-hidden py-4"
      data-testid="themenradar-detail-page"
    >
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          Admin · VOG Themenradar Detail
        </p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">{detail.item.title}</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Review-first Arbeitsstand von Rohsignal bis share-ready Candidate.
        </p>
        <Link href="/admin/themenradar" className="text-sm font-semibold text-sky-700 hover:underline">
          Zurück zur Liste
        </Link>
      </header>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2" data-testid="themenradar-detail-main">
        <article className="min-w-0 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm space-y-3">
          <h2 className="text-base font-semibold text-[rgb(var(--fg))]">Thema qualifizieren</h2>
          <label className="flex flex-col gap-1 text-sm">
            Titel
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="rounded-xl border border-[rgb(var(--border))] bg-transparent px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Rohsignal
            <textarea
              value={rawSignal}
              onChange={(event) => setRawSignal(event.target.value)}
              rows={5}
              className="rounded-xl border border-[rgb(var(--border))] bg-transparent px-3 py-2"
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              Anlassraum-ID
              <input
                value={linkedAnlassraumId}
                onChange={(event) => setLinkedAnlassraumId(event.target.value)}
                className="rounded-xl border border-[rgb(var(--border))] bg-transparent px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Dossier-ID
              <input
                value={linkedDossierId}
                onChange={(event) => setLinkedDossierId(event.target.value)}
                className="rounded-xl border border-[rgb(var(--border))] bg-transparent px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Campaign Key
              <input
                value={campaignKey}
                onChange={(event) => setCampaignKey(event.target.value)}
                className="rounded-xl border border-[rgb(var(--border))] bg-transparent px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Lifecycle
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ThemenradarLifecycleStatus)
                }
                className="rounded-xl border border-[rgb(var(--border))] bg-transparent px-3 py-2"
              >
                {STATUS_OPTIONS.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            Review-Notiz (optional, empfohlen bei Freigaben)
            <textarea
              value={reviewNote}
              onChange={(event) => setReviewNote(event.target.value)}
              rows={2}
              className="rounded-xl border border-[rgb(var(--border))] bg-transparent px-3 py-2"
              placeholder="z. B. warum ein Statuswechsel erfolgt"
            />
          </label>
          {status === "published" ? (
            <label className="flex items-start gap-2 text-sm text-[rgb(var(--muted))]">
              <input
                type="checkbox"
                checked={publishIntent}
                onChange={(event) => setPublishIntent(event.target.checked)}
                className="mt-1 size-4 rounded border border-[rgb(var(--border))]"
              />
              <span>
                Ich bestätige den publizierungsnahen Statuswechsel bewusst
                (review-first bleibt verbindlich).
              </span>
            </label>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-2">
            <ScoreInput
              label="Heat"
              value={scores.heatScore}
              onChange={(value) => setScores((prev) => ({ ...prev, heatScore: value }))}
            />
            <ScoreInput
              label="Alltagsrelevanz"
              value={scores.everydayRelevanceScore}
              onChange={(value) =>
                setScores((prev) => ({ ...prev, everydayRelevanceScore: value }))
              }
            />
            <ScoreInput
              label="Polarisierung"
              value={scores.polarizationScore}
              onChange={(value) =>
                setScores((prev) => ({ ...prev, polarizationScore: value }))
              }
            />
            <ScoreInput
              label="Membership"
              value={scores.membershipPotentialScore}
              onChange={(value) =>
                setScores((prev) => ({ ...prev, membershipPotentialScore: value }))
              }
            />
          </div>
          <button
            data-testid="themenradar-save-button"
            type="button"
            onClick={patchItem}
            disabled={saving}
            className="inline-flex items-center rounded-full bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-60"
          >
            {saving ? "Speichert …" : "Änderungen speichern"}
          </button>
        </article>

        <article className="min-w-0 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm space-y-3">
          <h2 className="text-base font-semibold text-[rgb(var(--fg))]">
            Review-ready Funnel
          </h2>
          <p className="text-sm text-[rgb(var(--muted))]">
            Guardrails bleiben fix: reviewRequired=true, autoPostEligible=false,
            officialSocialRequiresReview=true.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              data-testid="themenradar-content-prep-action"
              type="button"
              onClick={runContentPrep}
              disabled={saving}
              className="inline-flex items-center rounded-full border border-[rgb(var(--border))] px-3 py-1.5 text-sm font-semibold hover:border-sky-300 hover:text-sky-700 disabled:opacity-60"
            >
              Content prep erzeugen
            </button>
            <button
              data-testid="themenradar-share-ready-action"
              type="button"
              onClick={buildShareReady}
              disabled={saving}
              className="inline-flex items-center rounded-full border border-[rgb(var(--border))] px-3 py-1.5 text-sm font-semibold hover:border-sky-300 hover:text-sky-700 disabled:opacity-60"
            >
              Share-ready Candidate
            </button>
          </div>
          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
              Manuelle Exporte (review-gebunden)
            </p>
            <p className="text-xs text-[rgb(var(--muted))]">
              Export ist nur in `review_ready` oder `published` erlaubt. Kein
              Auto-Publish, kein offizielles Social-Autoposting.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                data-testid="themenradar-export-post"
                type="button"
                onClick={() => generateManualExport("post")}
                disabled={saving || !exportAllowed}
                className="inline-flex items-center rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs font-semibold disabled:opacity-50"
              >
                Export Post
              </button>
              <button
                data-testid="themenradar-export-carousel"
                type="button"
                onClick={() => generateManualExport("carousel")}
                disabled={saving || !exportAllowed}
                className="inline-flex items-center rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs font-semibold disabled:opacity-50"
              >
                Export Carousel
              </button>
              <button
                data-testid="themenradar-export-script"
                type="button"
                onClick={() => generateManualExport("script")}
                disabled={saving || !exportAllowed}
                className="inline-flex items-center rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs font-semibold disabled:opacity-50"
              >
                Export Script
              </button>
            </div>
            {exportDraft ? (
              <pre
                data-testid="themenradar-export-preview"
                className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-2 text-[11px] leading-relaxed text-[rgb(var(--muted))]"
              >
                {JSON.stringify(exportDraft, null, 2)}
              </pre>
            ) : (
              <p className="text-xs text-[rgb(var(--muted))]">
                Noch kein Export-Entwurf erzeugt.
              </p>
            )}
          </div>
          {membershipEntry ? (
            <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                Membership-/Mitmach-Einstiege
              </p>
              <p className="text-xs text-[rgb(var(--muted))]">
                {membershipEntry.contextLabel}
              </p>
              <p className="text-xs text-[rgb(var(--muted))]">
                {membershipEntry.separationHint}
              </p>
              <div className="flex flex-wrap gap-2">
                {membershipEntry.callsToAction.map((entry) => (
                  <Link
                    key={entry.id}
                    href={entry.href}
                    className="inline-flex items-center rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs font-semibold hover:border-sky-300 hover:text-sky-700"
                  >
                    {entry.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
          {detail.item.shareContractSnapshot ? (
            <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3 text-xs text-[rgb(var(--muted))] space-y-1">
              <p>
                <span className="font-semibold text-[rgb(var(--fg))]">Target:</span>{" "}
                {detail.item.shareContractSnapshot.canonicalPublicTarget}
              </p>
              <p>
                <span className="font-semibold text-[rgb(var(--fg))]">QR:</span>{" "}
                {detail.item.shareContractSnapshot.qrTarget}
              </p>
              <p>
                <span className="font-semibold text-[rgb(var(--fg))]">Social:</span>{" "}
                autoPostEligible=
                {String(
                  detail.item.shareContractSnapshot.socialPublication.autoPostEligible,
                )}
                , needsReviewBeforeOfficialSocial=
                {String(
                  detail.item.shareContractSnapshot.socialPublication
                    .needsReviewBeforeOfficialSocial,
                )}
              </p>
            </div>
          ) : (
            <p className="text-xs text-[rgb(var(--muted))]">
              Noch kein Share-ready Snapshot erstellt.
            </p>
          )}
          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
              Telemetrie (aggregiert)
            </p>
            <p className="mt-1 text-sm text-[rgb(var(--fg))]">
              Klicks {telemetry?.clicks ?? 0} · Leads {telemetry?.leads ?? 0} ·
              Membership {telemetry?.memberships ?? 0}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                data-testid="themenradar-telemetry-click"
                type="button"
                onClick={() => addTelemetry("click")}
                className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs font-semibold"
              >
                + Klick
              </button>
              <button
                data-testid="themenradar-telemetry-lead"
                type="button"
                onClick={() => addTelemetry("lead")}
                className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs font-semibold"
              >
                + Lead
              </button>
              <button
                data-testid="themenradar-telemetry-membership"
                type="button"
                onClick={() => addTelemetry("membership")}
                className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs font-semibold"
              >
                + Mitgliedschaft
              </button>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="min-w-0 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
          <h2 className="text-base font-semibold text-[rgb(var(--fg))]">Assistive Content-Vorlagen</h2>
          {!detail.contentPrep ? (
            <p className="mt-2 text-sm text-[rgb(var(--muted))]">
              Noch keine Vorlagen erzeugt.
            </p>
          ) : (
            <div className="mt-2 space-y-3 text-sm text-[rgb(var(--muted))]">
              <p>
                <span className="font-semibold text-[rgb(var(--fg))]">Hook:</span>{" "}
                {detail.contentPrep.socialHook}
              </p>
              <div>
                <p className="font-semibold text-[rgb(var(--fg))]">Caption-Varianten</p>
                <ul className="mt-1 list-disc pl-5">
                  {detail.contentPrep.captionVariants.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-[rgb(var(--fg))]">Carousel (max. 5)</p>
                <ul className="mt-1 list-disc pl-5">
                  {detail.contentPrep.carouselOutline.map((slide, index) => (
                    <li key={`${slide.title}_${index}`}>
                      {slide.title}: {slide.message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </article>

        <article
          data-testid="themenradar-lifecycle-history"
          className="min-w-0 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm"
        >
          <h2 className="text-base font-semibold text-[rgb(var(--fg))]">Lifecycle-Historie</h2>
          <ol className="mt-2 space-y-2 text-sm">
            {detail.lifecycleHistory.map((event, index) => (
              <li
                key={`${event.status}_${event.at}_${index}`}
                className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-[rgb(var(--muted))]"
              >
                <p className="font-semibold text-[rgb(var(--fg))]">{event.status}</p>
                <p>{new Date(event.at).toLocaleString("de-DE")}</p>
                {event.note ? <p>Hinweis: {event.note}</p> : null}
              </li>
            ))}
          </ol>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="min-w-0 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
          <h2 className="text-base font-semibold text-[rgb(var(--fg))]">Review-Metadaten</h2>
          <dl className="mt-2 grid gap-2 text-sm text-[rgb(var(--muted))] sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-[rgb(var(--fg))]">createdBy</dt>
              <dd>{detail.item.createdBy ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[rgb(var(--fg))]">updatedBy</dt>
              <dd>{detail.item.updatedBy ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[rgb(var(--fg))]">lastReviewedBy</dt>
              <dd>{detail.item.lastReviewedBy ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[rgb(var(--fg))]">lastReviewedAt</dt>
              <dd>
                {detail.item.lastReviewedAt
                  ? new Date(detail.item.lastReviewedAt).toLocaleString("de-DE")
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-[rgb(var(--fg))]">auditVersion</dt>
              <dd>{detail.item.auditVersion}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[rgb(var(--fg))]">archivedBy</dt>
              <dd>{detail.item.archivedBy ?? "—"}</dd>
            </div>
          </dl>
          {detail.item.reviewNotes.length > 0 ? (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                Review Notes
              </p>
              <ul className="mt-1 space-y-1 text-sm text-[rgb(var(--muted))]">
                {detail.item.reviewNotes.map((entry, index) => (
                  <li key={`${entry}_${index}`} className="break-words rounded-lg bg-[rgb(var(--bg))] px-2 py-1">
                    {entry}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </article>

        <article
          data-testid="themenradar-audit-trail"
          className="min-w-0 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm"
        >
          <h2 className="text-base font-semibold text-[rgb(var(--fg))]">Audit-Spur (append-only)</h2>
          <ol className="mt-2 space-y-2 text-sm">
            {detail.auditTrail.map((event) => (
              <li
                key={event.id}
                className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-[rgb(var(--muted))]"
              >
                <p className="font-semibold text-[rgb(var(--fg))]">
                  {event.auditVersion}. {event.eventType}
                </p>
                <p>{new Date(event.at).toLocaleString("de-DE")}</p>
                <p>
                  {event.fromStatus ?? "—"} → {event.toStatus ?? "—"}
                </p>
                <p>Actor: {event.actorUserId ?? "system"}</p>
                {event.note ? <p>Hinweis: {event.note}</p> : null}
              </li>
            ))}
          </ol>
        </article>
      </section>
    </main>
  );
}

function ScoreInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="rounded-xl border border-[rgb(var(--border))] bg-transparent px-3 py-2"
      />
    </label>
  );
}
