import type { ThemenradarItem } from "@features/themenradar/contracts";

export type ThemenradarBrandStyleContract = {
  toneProfile: "sachlich_klar" | "nahbar_pruefend";
  visualProfile: "vog_edebatte_editorial";
  narrativeProfile: "problem_kontext_weg";
  ctaProfile: "mitwirkung_review_first";
  voiceoverProfile: "ruhig_erklaerend";
};

export type ThemenradarCarouselSlide = {
  title: string;
  message: string;
};

export type ThemenradarContentPrep = {
  generatedAt: string;
  sourceItemId: string;
  preservesOriginalInput: true;
  suggestionsAreNonBinding: true;
  styleContract: ThemenradarBrandStyleContract;
  socialHook: string;
  captionVariants: [string, string, string];
  carouselOutline: ThemenradarCarouselSlide[];
  shortVideoScript: {
    targetDurationSeconds: 40;
    lines: string[];
  };
  voiceoverScript: string[];
  membershipCta: string;
  dossierOrAnlassraumCta: string;
};

const BASE_STYLE_CONTRACT: ThemenradarBrandStyleContract = {
  toneProfile: "sachlich_klar",
  visualProfile: "vog_edebatte_editorial",
  narrativeProfile: "problem_kontext_weg",
  ctaProfile: "mitwirkung_review_first",
  voiceoverProfile: "ruhig_erklaerend",
};

function shorten(text: string, max = 180) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, Math.max(40, max - 1)).trimEnd()}…`;
}

function firstSentence(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  const split = normalized.split(/[.!?]/).map((entry) => entry.trim()).filter(Boolean);
  if (split.length === 0) return normalized;
  return split[0];
}

function buildMembershipCta(item: ThemenradarItem) {
  if (item.membershipPotentialScore >= 70) {
    return "Wenn euch dieses Thema wichtig ist: als Mitglied könnt ihr die Arbeit dauerhaft ermöglichen.";
  }
  if (item.membershipPotentialScore >= 40) {
    return "Wer den Prozess dauerhaft begleiten möchte, kann die Initiative als Mitglied stärken.";
  }
  return "Mitgliedschaft bleibt optional und unterstützt die kontinuierliche Themenarbeit.";
}

function buildDossierOrAnlassraumCta(item: ThemenradarItem) {
  if (item.linkedDossierId) {
    return `Zum Dossier wechseln und offene Punkte strukturiert weiterführen: /dossier/${encodeURIComponent(item.linkedDossierId)}`;
  }
  if (item.linkedAnlassraumId) {
    return `Im Anlassraum weiterarbeiten und Rückmeldungen sammeln: /anlassraum?anlassraumId=${encodeURIComponent(item.linkedAnlassraumId)}`;
  }
  return "Anlassraum anlegen, Kontext bündeln und den Prozess review-ready weiterführen.";
}

function buildCarousel(item: ThemenradarItem): ThemenradarCarouselSlide[] {
  const relevance = item.everydayRelevanceScore >= 60 ? "hoch" : "mittel";
  const heat = item.heatScore >= 70 ? "sehr dynamisch" : "in Bewegung";
  const polar = item.polarizationScore >= 65 ? "klar umstritten" : "mit unterschiedlichen Sichtweisen";
  return [
    {
      title: "Ausgangslage",
      message: shorten(item.title, 120),
    },
    {
      title: "Warum jetzt",
      message: shorten(`Das Thema ist aktuell ${heat} und für den Alltag ${relevance} relevant.`, 140),
    },
    {
      title: "Konfliktlinie",
      message: shorten(`Der Diskurs ist ${polar}. Wir trennen Beobachtung und Bewertung konsequent.`, 140),
    },
    {
      title: "Arbeitsweg",
      message: shorten("Hinweise bündeln, offene Fragen sichtbar machen, dann review-ready verdichten.", 140),
    },
    {
      title: "Mitmachen",
      message: shorten(buildDossierOrAnlassraumCta(item), 140),
    },
  ];
}

export function generateThemenradarContentPrep(item: ThemenradarItem): ThemenradarContentPrep {
  const now = new Date().toISOString();
  const signalSentence = firstSentence(item.rawSignal) || item.rawSignal;
  const socialHook = shorten(
    `${item.title}: ${signalSentence} Was bedeutet das konkret für Entscheidungen im Alltag?`,
    170,
  );

  const captionA = shorten(
    `Themenradar: ${item.title}. Wir sammeln Hinweise, prüfen offene Fragen und führen den Kontext review-first weiter.`,
    220,
  );
  const captionB = shorten(
    `Neue Lageeinschätzung zu "${item.title}". Jetzt zählt: Rückmeldungen strukturieren, Streitpunkte sauber trennen, nächste Schritte sichtbar machen.`,
    220,
  );
  const captionC = shorten(
    `${item.title} betrifft viele direkt. Wir bereiten den Anlass so auf, dass Beiträge, Dossier und Beteiligung anschlussfähig bleiben.`,
    220,
  );

  const shortVideoScriptLines = [
    `Hook: ${socialHook}`,
    "Kontext: Was ist belegt, was ist offen, was wird gerade diskutiert?",
    "Relevanz: Welche Folgen hat das für Menschen vor Ort?",
    "Arbeitsstand: Welche Fragen sind noch ungeklärt und wie geht es weiter?",
    `CTA: ${buildDossierOrAnlassraumCta(item)}`,
    `Mitgliedschaft: ${buildMembershipCta(item)}`,
  ];

  const voiceoverScript = [
    `Heute im Themenradar: ${item.title}.`,
    "Wir halten den Ursprung sichtbar und ordnen Hinweise schrittweise ein.",
    "Ziel ist ein belastbarer Arbeitsstand statt schneller Zuspitzung.",
    buildDossierOrAnlassraumCta(item),
  ];

  return {
    generatedAt: now,
    sourceItemId: item.id,
    preservesOriginalInput: true,
    suggestionsAreNonBinding: true,
    styleContract: BASE_STYLE_CONTRACT,
    socialHook,
    captionVariants: [captionA, captionB, captionC],
    carouselOutline: buildCarousel(item).slice(0, 5),
    shortVideoScript: {
      targetDurationSeconds: 40,
      lines: shortVideoScriptLines,
    },
    voiceoverScript,
    membershipCta: buildMembershipCta(item),
    dossierOrAnlassraumCta: buildDossierOrAnlassraumCta(item),
  };
}

