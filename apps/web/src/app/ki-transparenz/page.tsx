"use client";

import type { ReactNode } from "react";
import { AiTransparencyLabel, VoxyAiSystemDisclosure } from "@/components/ai/AiTransparencyDisclosure";
import { useLocale } from "@/context/LocaleContext";

const COPY = {
  de: {
    kicker: "KI-Transparenz",
    title: "Nachvollziehbar, wo KI beteiligt ist",
    lead: "eDebatte kennzeichnet KI-Unterstützung und KI-generierte Inhalte bewusst sichtbar – auch dann, wenn eine redaktionelle Prüfung und Verantwortung dokumentiert sind. Derselbe zentrale Standard gilt für öffentliche Ausgaben von eDebatte, VoiceOpenGov und Vote4Gov.",
    legal: "Der technische Vertrag orientiert sich an Artikel 50 des EU AI Act. Diese Seite ist keine Rechtsberatung; konkrete Veröffentlichungen bleiben vor Freigabe in menschlicher Legal- und Produktprüfung.",
    voxyTitle: "Voxy beim ersten Kontakt",
    labelsTitle: "Kurze Inhaltslabels",
    labelsLead: "Die Labels unterscheiden Unterstützung, wesentliche Erzeugung und redaktionelle Prüfung. Reine menschliche Inhalte erhalten kein KI-Label.",
    mediaTitle: "Bild, Audio und Video",
    mediaLead: "Synthetische oder wesentlich KI-bearbeitete Medien werden nach Medienart sichtbar gekennzeichnet. Deepfake-relevante Inhalte brauchen einen unmittelbaren Hinweis und bleiben ohne ihn blockiert.",
    publishTitle: "Veröffentlichung bleibt fail-closed",
    publishBody: "Ungeprüfte wesentlich KI-generierte öffentliche Informationsinhalte werden nicht regulär veröffentlicht. Menschliche Prüfung, redaktionelle Freigabe, sichtbares Label, belastbare Provenienz und alle bestehenden Review-, Sichtbarkeits-, Export- und Distributionsgates müssen positiv belegt sein. Nichts wird automatisch veröffentlicht.",
    metadataTitle: "Provenienz und technische Metadaten",
    metadataBody: "eDebatte führt sichere Trace-, Herkunfts-, Review- und Original-/Bearbeitungsreferenzen maschinenlesbar. Eine End-to-End-Unterstützung für C2PA, Content Credentials, IPTC oder XMP ist derzeit nicht belegt und wird deshalb nicht behauptet. Vorhandene Herkunftsmetadaten dürfen nicht unbemerkt verloren gehen.",
    altTitle: "Ältere Inhalte",
    altBody: "Inhalte rund um den 2. August 2026 werden bei Bedarf einzeln und review-first auditiert. Es gibt keine automatische Massenkennzeichnung und keine automatische Sichtbarkeitsänderung.",
  },
  en: {
    kicker: "AI transparency",
    title: "See clearly where AI is involved",
    lead: "eDebatte visibly labels AI assistance and AI-generated content even when editorial review and responsibility are documented. The same central standard applies to public outputs built on eDebatte by VoiceOpenGov and Vote4Gov.",
    legal: "The technical contract is informed by Article 50 of the EU AI Act. This page is not legal advice; individual publications remain subject to human legal and product review before approval.",
    voxyTitle: "Voxy at first contact",
    labelsTitle: "Short content labels",
    labelsLead: "Labels distinguish assistance, substantial generation, and editorial review. Human-only content receives no AI label.",
    mediaTitle: "Images, audio, and video",
    mediaLead: "Synthetic or substantially AI-edited media is visibly labelled by media type. Deepfake-relevant content requires an immediate disclosure and remains blocked without it.",
    publishTitle: "Publishing remains fail-closed",
    publishBody: "Substantially AI-generated public-information content that has not been reviewed cannot be published as regular content. Human review, editorial approval, a visible label, reliable provenance, and every existing review, visibility, export, and distribution gate must be positively established. Nothing is published automatically.",
    metadataTitle: "Provenance and technical metadata",
    metadataBody: "eDebatte carries safe trace, origin, review, and original/derivative references in machine-readable form. End-to-end support for C2PA, Content Credentials, IPTC, or XMP is not currently established and is therefore not claimed. Existing provenance metadata must not be lost without notice.",
    altTitle: "Older content",
    altBody: "Content around 2 August 2026 can be audited individually and review-first. There is no automatic mass labelling and no automatic visibility change.",
  },
} as const;

function InfoCard(props: { title: string; children: ReactNode; id?: string }) {
  return (
    <section
      className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm"
      id={props.id}
    >
      <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">{props.title}</h2>
      <div className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">{props.children}</div>
    </section>
  );
}

export default function AiTransparencyPage() {
  const { locale } = useLocale();
  const language = locale === "en" ? "en" : "de";
  const copy = COPY[language];

  return (
    <main className="public-canvas min-h-screen py-12">
      <div className="public-shell mx-auto max-w-4xl space-y-6 px-4">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-200">
            {copy.kicker}
          </p>
          <h1 className="text-3xl font-bold text-[rgb(var(--fg))] md:text-4xl">{copy.title}</h1>
          <p className="max-w-3xl text-base leading-7 text-[rgb(var(--muted))]">{copy.lead}</p>
          <p className="max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">{copy.legal}</p>
        </header>

        <InfoCard id="voxy" title={copy.voxyTitle}>
          <VoxyAiSystemDisclosure locale={language} />
        </InfoCard>

        <InfoCard title={copy.labelsTitle}>
          <p>{copy.labelsLead}</p>
          <div className="mt-4 flex flex-wrap gap-2" data-ai-transparency-text-labels="">
            <AiTransparencyLabel locale={language} status="ai_assisted" contentKind="text" />
            <AiTransparencyLabel locale={language} status="ai_assisted" contentKind="text" humanReviewed />
            <AiTransparencyLabel locale={language} status="ai_generated_reviewed" contentKind="text" humanReviewed />
            <AiTransparencyLabel locale={language} status="ai_generated_unreviewed" contentKind="text" />
          </div>
        </InfoCard>

        <InfoCard title={copy.mediaTitle}>
          <p>{copy.mediaLead}</p>
          <div className="mt-4 flex flex-wrap gap-2" data-ai-transparency-media-labels="">
            <AiTransparencyLabel locale={language} status="ai_manipulated_media" contentKind="image" />
            <AiTransparencyLabel locale={language} status="ai_manipulated_media" contentKind="audio" />
            <AiTransparencyLabel locale={language} status="ai_manipulated_media" contentKind="video" />
            <AiTransparencyLabel locale={language} status="deepfake_disclosure_required" contentKind="video" />
          </div>
        </InfoCard>

        <InfoCard title={copy.publishTitle}>
          <p>{copy.publishBody}</p>
        </InfoCard>

        <InfoCard title={copy.metadataTitle}>
          <p>{copy.metadataBody}</p>
        </InfoCard>

        <InfoCard title={copy.altTitle}>
          <p>{copy.altBody}</p>
        </InfoCard>
      </div>
    </main>
  );
}
