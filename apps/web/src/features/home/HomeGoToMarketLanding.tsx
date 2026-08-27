"use client";

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import type { StartExperienceModel } from "@/features/start/startExperience";
import { buildFreeBallotStartHref, GO_TO_MARKET_PACKAGING, GO_TO_MARKET_TEMPLATES } from "@features/pricing/goToMarketPackaging";
import { HomeBallotExperience } from "./HomeBallotExperience";

type Props = { experience: StartExperienceModel };

const copy = {
  de: {
    eyebrow: "eDebatte für Gruppen, die gemeinsam etwas bewegen",
    title: "Abstimmen. Verstehen. Gemeinsam weiterkommen.",
    intro: "Stellt eine konkrete Frage, sammelt Positionen und macht sichtbar, was eure Gruppe trägt – kostenlos und ohne lange Einführung.",
    cta: "Kostenlos Abstimmung starten",
    free: `Für kleine Gruppen kostenlos · Richtwert bis ${GO_TO_MARKET_PACKAGING.freeParticipantGuideline} Teilnehmende`,
    audienceTitle: "Passt zu eurer Gruppe",
    audienceIntro: "Vom Vereinsvorstand bis zur Kommune: Der Einstieg bleibt einfach, der Debattenstand nachvollziehbar.",
    audiences: [
      ["Vereine", "Mitglieder beteiligen, Prioritäten klären und Vorhaben gemeinsam vorbereiten."],
      ["Bürgerinitiativen & lokale Gruppen", "Meinungen vor Ort einholen und gemeinsame nächste Schritte erkennen."],
      ["Verbände & Netzwerke", "Perspektiven aus mehreren Gruppen strukturiert zusammenführen."],
      ["Organisationen & Kommunen", "Beteiligung verständlich starten und Entscheidungen transparent vorbereiten."],
    ],
    stepsTitle: "In drei Schritten zur gemeinsamen Orientierung",
    steps: [
      ["1", "Frage stellen", "Mit einer Vorlage beginnen oder die eigene Frage formulieren."],
      ["2", "Link teilen", "Eine freigegebene Abstimmung per Link, QR-Code oder mobilem Teilen verbreiten."],
      ["3", "Positionen verstehen", "Zustimmung, offene Fragen und weiteren Beratungsbedarf erkennen."],
    ],
    templatesTitle: "Mit einer passenden Vorlage starten",
    templatesIntro: "Die Beispiele öffnen einen vorbereiteten Entwurf. Ihr behaltet die Kontrolle und gebt erst nach eigener Prüfung etwas frei.",
    depthTitle: "Mehr als ein Prozentwert",
    depthIntro: "eDebatte verbindet Positionen mit nachvollziehbarem Kontext – ohne so zu tun, als ließen sich Fakten oder Wahrheit abstimmen.",
    depth: [
      ["Positionen & Prioritäten", "Zeigt, was Menschen auswählen und welche Themen sie zuerst angehen möchten."],
      ["Argumente & Perspektiven", "Hält unterschiedliche Begründungen sichtbar, wo sie im freigegebenen Thema vorliegen."],
      ["Quellen & offene Fragen", "Bewahrt Herkunft, Unsicherheit und Widersprüche, statt sie glattzubügeln."],
    ],
    pricingTitle: "Klein anfangen. Ohne erfundene Hürden.",
    pricingIntro: `Kleine Abstimmungen sind kostenlos. ${GO_TO_MARKET_PACKAGING.freeParticipantGuideline} Teilnehmende sind ein zentraler Packaging-Richtwert, kein technisch erzwungenes Limit.`,
    packages: [
      ["Kostenlos starten", "Für kleine Gruppen", "Abstimmung vorbereiten, Positionen einholen und vorhandene Teilen-Funktionen nutzen."],
      ["Erweiterungen", "Bei größerem Bedarf", "Zusätzliche Unterstützung gibt es nur, wo sie tatsächlich verfügbar und ausdrücklich aktiviert ist."],
      ["Organisation", "Für abgestimmte Einsätze", "Umfang, Datenschutz und Betrieb werden passend zum konkreten Einsatz geklärt."],
    ],
    pricingTruth: "Noch keine veröffentlichten Preise, kein erfundener Checkout und keine versteckten Freischaltungen.",
    trustTitle: "Menschen entscheiden. eDebatte macht den Stand verständlich.",
    trust: ["Keine Abstimmung über Fakten oder Wahrheit", "Keine automatische Veröffentlichung", "KI unterstützt gekennzeichnet und entscheidet nicht autonom", "Quellen, Unsicherheiten und Widersprüche bleiben nachvollziehbar"],
    narrative: [
      "Gute Entscheidungen brauchen einen Raum, in dem Stimmen zählen und Verständigung möglich wird. Wo Perspektiven unsichtbar bleiben, Quellen unklar sind und Zusammenhänge fehlen, verlieren Menschen Orientierung – und Debatten ihre gemeinsame Grundlage.",
      "eDebatte verbindet menschliche Beteiligung mit nachvollziehbarer Evidenz und ordnet den Debattenstand über Zeit. Die Plattform macht Stimmen, Perspektiven, Quellen, Evidenzen und Zusammenhänge sichtbar, ohne menschliche Verantwortung zu ersetzen oder über Fakten und Wahrheit abstimmen zu lassen.",
      "So entsteht ein verlässlicher Ort für gemeinsame Meinungs- und Willensbildung: zugänglich, transparent, mehrsprachig und so gestaltet, dass Menschen informierter urteilen, Entscheidungen besser vorbereiten und ihre Wirkung nachvollziehen können.",
    ],
    finalTitle: "Welche Frage möchtet ihr morgen gemeinsam klären?",
    finalText: "Startet heute mit einem kostenlosen Entwurf. Ihr prüft alles selbst, bevor ihr die Abstimmung freigebt und teilt.",
  },
  en: {
    eyebrow: "eDebatte for groups that want to move things forward together",
    title: "Vote. Understand. Move forward together.",
    intro: "Ask a concrete question, collect positions and see what your group supports—free of charge and without a lengthy introduction.",
    cta: "Start a ballot for free",
    free: `Free for small groups · guideline of up to ${GO_TO_MARKET_PACKAGING.freeParticipantGuideline} participants`,
    audienceTitle: "Made for your kind of group",
    audienceIntro: "From club boards to municipalities: the entry stays simple and the state of the debate remains traceable.",
    audiences: [
      ["Clubs", "Involve members, clarify priorities and prepare initiatives together."],
      ["Citizen initiatives & local groups", "Gather local views and identify shared next steps."],
      ["Associations & networks", "Bring perspectives from several groups into one clear view."],
      ["Organisations & municipalities", "Start participation clearly and prepare decisions transparently."],
    ],
    stepsTitle: "Three steps towards shared orientation",
    steps: [
      ["1", "Ask a question", "Start with a template or formulate your own question."],
      ["2", "Share the link", "Distribute an approved ballot by link, QR code or mobile sharing."],
      ["3", "Understand positions", "See support, open questions and what needs further discussion."],
    ],
    templatesTitle: "Start with a suitable template",
    templatesIntro: "Each example opens a prepared draft. You remain in control and only release something after your own review.",
    depthTitle: "More than a percentage",
    depthIntro: "eDebatte connects positions with traceable context—without pretending that facts or truth can be decided by a vote.",
    depth: [
      ["Positions & priorities", "Shows what people choose and which topics they want to tackle first."],
      ["Arguments & perspectives", "Keeps different reasons visible where they are available in an approved topic."],
      ["Sources & open questions", "Preserves provenance, uncertainty and contradictions instead of smoothing them over."],
    ],
    pricingTitle: "Start small. Without invented barriers.",
    pricingIntro: `Small ballots are free. ${GO_TO_MARKET_PACKAGING.freeParticipantGuideline} participants are a central packaging guideline, not a technically enforced limit.`,
    packages: [
      ["Start free", "For small groups", "Prepare a ballot, collect positions and use the existing sharing options."],
      ["Extensions", "For greater needs", "Additional support is only offered where it is actually available and explicitly enabled."],
      ["Organisation", "For coordinated deployments", "Scope, privacy and operations are agreed for the concrete use case."],
    ],
    pricingTruth: "No published prices yet, no invented checkout and no hidden entitlements.",
    trustTitle: "People decide. eDebatte makes the state of debate understandable.",
    trust: ["No voting on facts or truth", "No automatic publishing", "AI provides labelled support and does not decide autonomously", "Sources, uncertainty and contradictions remain traceable"],
    narrative: [
      "Good decisions need a space where voices count and mutual understanding can grow. When perspectives remain invisible, sources are unclear and connections are missing, people lose orientation—and debates lose their common ground.",
      "eDebatte combines human participation with traceable evidence and organises the state of debate over time. The platform makes voices, perspectives, sources, evidence and connections visible without replacing human responsibility or putting facts and truth to a vote.",
      "The result is a dependable place for forming opinions and collective intent: accessible, transparent, multilingual and designed to help people judge with better information, prepare decisions and understand their effects.",
    ],
    finalTitle: "Which question would you like to clarify together tomorrow?",
    finalText: "Start with a free draft today. You review everything yourself before you approve and share the ballot.",
  },
} as const;

export default function HomeGoToMarketLanding({ experience }: Props) {
  const { locale } = useLocale();
  const language = locale === "de" ? "de" : "en";
  const t = copy[language];

  return <div className="overflow-hidden bg-[color:var(--background)] text-[color:var(--foreground)]">
    <section className="relative border-b border-[color:var(--border)]">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_88%_12%,rgba(99,102,241,0.12),transparent_30%)]" />
      <div className="relative mx-auto grid max-w-[82rem] gap-10 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:gap-14 lg:px-10 lg:py-16">
        <div><p className="text-sm font-bold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300">{t.eyebrow}</p><h1 className="mt-4 max-w-3xl text-balance text-4xl font-bold leading-[1.03] tracking-tight sm:text-5xl lg:text-6xl">{t.title}</h1><p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-[color:var(--muted)] sm:text-xl">{t.intro}</p>
          <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:items-center"><Link href={buildFreeBallotStartHref()} className="inline-flex min-h-12 items-center justify-center rounded-full bg-cyan-500 px-6 py-3 text-base font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2">{t.cta}<span aria-hidden="true" className="ml-2">→</span></Link><span className="text-sm font-medium text-[color:var(--muted)]">{t.free}</span></div>
          {experience.workspaceHref && experience.workspaceLabel ? <Link href={experience.workspaceHref} className="mt-5 inline-block text-sm font-semibold text-cyan-700 underline-offset-4 hover:underline dark:text-cyan-300">{experience.workspaceLabel}</Link> : null}
        </div><HomeBallotExperience />
      </div>
    </section>

    <section className="mx-auto max-w-[82rem] px-5 py-16 sm:px-8 lg:px-10" aria-labelledby="audiences-title"><h2 id="audiences-title" className="text-3xl font-bold tracking-tight sm:text-4xl">{t.audienceTitle}</h2><p className="mt-3 max-w-3xl text-lg leading-relaxed text-[color:var(--muted)]">{t.audienceIntro}</p><div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{t.audiences.map(([title, body], index) => <article key={title} className={`rounded-3xl border p-6 ${index === 0 ? "border-cyan-400 bg-cyan-50 dark:bg-cyan-950/25" : "border-[color:var(--border)] bg-[color:var(--surface)]"}`}>{index === 0 ? <span className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300">{language === "de" ? "Pilotgruppe" : "Pilot group"}</span> : null}<h3 className="mt-2 text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-relaxed text-[color:var(--muted)]">{body}</p></article>)}</div></section>

    <section className="border-y border-[color:var(--border)] bg-slate-950 py-16 text-white" aria-labelledby="steps-title"><div className="mx-auto max-w-[82rem] px-5 sm:px-8 lg:px-10"><h2 id="steps-title" className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">{t.stepsTitle}</h2><div className="mt-9 grid gap-5 md:grid-cols-3">{t.steps.map(([number, title, body]) => <article key={number} className="rounded-3xl border border-white/15 bg-white/[0.06] p-6"><span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400 font-black text-slate-950">{number}</span><h3 className="mt-5 text-xl font-bold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-300">{body}</p></article>)}</div></div></section>

    <section className="mx-auto max-w-[82rem] px-5 py-16 sm:px-8 lg:px-10" aria-labelledby="templates-title"><h2 id="templates-title" className="text-3xl font-bold tracking-tight sm:text-4xl">{t.templatesTitle}</h2><p className="mt-3 max-w-3xl text-lg leading-relaxed text-[color:var(--muted)]">{t.templatesIntro}</p><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{GO_TO_MARKET_TEMPLATES.map((template) => <Link key={template.id} href={buildFreeBallotStartHref(template.id, "homepage-template")} className="group flex min-h-44 flex-col rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 transition hover:-translate-y-1 hover:border-cyan-400 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"><h3 className="font-bold">{template.title[language]}</h3><p className="mt-2 flex-1 text-sm leading-relaxed text-[color:var(--muted)]">{template.description[language]}</p><span className="mt-4 text-sm font-bold text-cyan-700 group-hover:underline dark:text-cyan-300">{language === "de" ? "Vorlage öffnen →" : "Open template →"}</span></Link>)}</div></section>

    <section className="border-y border-[color:var(--border)] bg-[color:var(--surface-muted)] py-16" aria-labelledby="depth-title"><div className="mx-auto grid max-w-[82rem] gap-10 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10"><div><h2 id="depth-title" className="text-3xl font-bold tracking-tight sm:text-4xl">{t.depthTitle}</h2><p className="mt-4 text-lg leading-relaxed text-[color:var(--muted)]">{t.depthIntro}</p></div><div className="grid gap-4">{t.depth.map(([title, body]) => <article key={title} className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6"><h3 className="text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-[color:var(--muted)]">{body}</p></article>)}</div></div></section>

    <section className="mx-auto max-w-[82rem] px-5 py-16 sm:px-8 lg:px-10" aria-labelledby="pricing-title"><h2 id="pricing-title" className="text-3xl font-bold tracking-tight sm:text-4xl">{t.pricingTitle}</h2><p className="mt-3 max-w-4xl text-lg leading-relaxed text-[color:var(--muted)]">{t.pricingIntro}</p><div className="mt-8 grid gap-5 lg:grid-cols-3">{t.packages.map(([title, label, body], index) => <article key={title} className={`rounded-3xl border p-6 ${index === 0 ? "border-cyan-400 bg-cyan-50 dark:bg-cyan-950/25" : "border-[color:var(--border)] bg-[color:var(--surface)]"}`}><span className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--muted)]">{label}</span><h3 className="mt-2 text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-relaxed text-[color:var(--muted)]">{body}</p>{index === 0 ? <Link href={buildFreeBallotStartHref(undefined, "homepage-packaging")} className="mt-6 inline-flex min-h-11 items-center rounded-full bg-slate-950 px-5 py-2 text-sm font-bold text-white dark:bg-white dark:text-slate-950">{t.cta}</Link> : null}</article>)}</div><p className="mt-5 text-sm font-semibold text-[color:var(--muted)]">{t.pricingTruth}</p></section>

    <section className="border-y border-[color:var(--border)] bg-[color:var(--surface)] py-16" aria-labelledby="trust-title"><div className="mx-auto grid max-w-[82rem] gap-10 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-10"><div><h2 id="trust-title" className="text-3xl font-bold tracking-tight sm:text-4xl">{t.trustTitle}</h2><ul className="mt-6 grid gap-3">{t.trust.map((item) => <li key={item} className="flex gap-3 text-sm leading-relaxed"><span aria-hidden="true" className="mt-0.5 text-cyan-600">✓</span><span>{item}</span></li>)}</ul></div><div className="space-y-5 text-base leading-relaxed text-[color:var(--muted)]">{t.narrative.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></div></section>

    <section className="mx-auto max-w-[82rem] px-5 py-16 sm:px-8 lg:px-10"><div className="rounded-[2rem] bg-gradient-to-br from-cyan-500 to-indigo-500 p-7 text-slate-950 shadow-xl sm:p-10"><h2 className="max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">{t.finalTitle}</h2><p className="mt-3 max-w-3xl text-base font-medium leading-relaxed text-slate-900">{t.finalText}</p><Link href={buildFreeBallotStartHref(undefined, "homepage-final")} className="mt-7 inline-flex min-h-12 items-center rounded-full bg-slate-950 px-6 py-3 font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-cyan-500">{t.cta}<span aria-hidden="true" className="ml-2">→</span></Link></div></section>
  </div>;
}
