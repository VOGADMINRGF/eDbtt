import type { CreateSupportHandoffPublic } from "@/features/support/createSupportTicketContract";

export type CreateVoxyLocale = "de" | "en";

const UNSUITABLE_NAME_TOKENS = new Set([
  "admin",
  "administrator",
  "anonymous",
  "anonym",
  "demo",
  "guest",
  "gast",
  "neighbor",
  "nachbar",
  "null",
  "test",
  "undefined",
  "unknown",
  "user",
  "dein",
]);

export function deriveVoxyGreetingName(
  displayName: string | null | undefined,
): string | null {
  const normalized = String(displayName ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ");
  if (!normalized || normalized.includes("@") || /https?:\/\/|www\./i.test(normalized)) {
    return null;
  }
  const first = normalized.split(" ")[0]?.replace(/^[^\p{L}]+|[^\p{L}'’-]+$/gu, "");
  if (!first || first.length < 2 || first.length > 40) return null;
  if (!/^\p{L}[\p{L}'’-]*$/u.test(first)) return null;
  if (UNSUITABLE_NAME_TOKENS.has(first.toLowerCase())) return null;
  if (/^[a-f0-9-]{8,}$/i.test(first) || /\d/.test(first)) return null;
  return first;
}

export function getCreateVoxyCopy(
  locale: CreateVoxyLocale,
  displayName: string | null | undefined,
) {
  const firstName = deriveVoxyGreetingName(displayName);
  if (locale === "en") {
    return {
      label: "Voxy",
      greeting: firstName ? `Hello ${firstName},` : "Hello neighbor,",
      intro:
        "What would you like to contribute? Write freely. I’ll organize your contribution, identify the main topics, and show you suitable next steps.",
      noAutoPublish: "No auto-publishing",
      retry: "Try again",
      viewTicket: "View ticket",
      continueLater: "Continue later",
      savedFailureTitle: "Oops, something went wrong.",
      savedFailureLead:
        "Your contribution is saved. The analysis could not be completed.",
      handedOff:
        "I handed the incident over to our IT team.",
      resolutionNotice:
        "You’ll receive a notification as soon as the incident has been resolved.",
      noTicket:
        "No topics were derived. Please try again. If the problem persists, use the technical reference shown below.",
      technicalReference: "Technical reference",
    } as const;
  }
  return {
    label: "Voxy",
    greeting: firstName ? `Hallo ${firstName},` : "Hallo Nachbar,",
    intro:
      "Was möchtest du einbringen? Schreib einfach frei los. Ich ordne deinen Beitrag, erkenne die wichtigsten Themen und zeige dir passende nächste Schritte.",
    noAutoPublish: "Kein Auto-Publish",
    retry: "Erneut versuchen",
    viewTicket: "Ticket ansehen",
    continueLater: "Später fortsetzen",
    savedFailureTitle: "Ups, hier ist etwas schiefgelaufen.",
    savedFailureLead:
      "Deinen Beitrag habe ich gespeichert. Die Analyse konnte gerade nicht abgeschlossen werden.",
    handedOff:
      "Ich habe die Meldung an unser IT-Team übergeben.",
    resolutionNotice:
      "Sobald der Fall gelöst ist, bekommst du eine Nachricht.",
    noTicket:
      "Es wurden keine Themen abgeleitet. Bitte versuche es erneut. Falls der Fehler bestehen bleibt, nutze die angezeigte Fehlerreferenz.",
    technicalReference: "Fehlerreferenz",
  } as const;
}

export function buildCreateSupportFailureCopy(input: {
  locale: CreateVoxyLocale;
  handoff: CreateSupportHandoffPublic | null;
}) {
  const copy = getCreateVoxyCopy(input.locale, null);
  if (input.handoff?.status === "created") {
    return {
      title: copy.savedFailureTitle,
      paragraphs: [
        copy.savedFailureLead,
        copy.handedOff,
        `${input.locale === "en" ? "Your ticket" : "Dein Ticket"}: ${
          input.handoff.ticket.ticketNumber
        }`,
        input.handoff.ticket.notificationLinked ? copy.resolutionNotice : null,
      ].filter((value): value is string => Boolean(value)),
      ticketHref: input.handoff.ticket.viewHref,
    };
  }
  return {
    title: copy.savedFailureTitle,
    paragraphs: [
      copy.savedFailureLead,
      copy.noTicket,
      input.handoff?.status === "failed"
        ? `${copy.technicalReference}: ${input.handoff.technicalReference}`
        : null,
    ].filter((value): value is string => Boolean(value)),
    ticketHref: null,
  };
}
