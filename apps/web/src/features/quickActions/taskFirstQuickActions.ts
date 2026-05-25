export type TaskFirstQuickAction = {
  id: string;
  label: string;
  description: string;
  href: string;
  priority: "primary" | "secondary";
  badge?: string;
};

export type TaskFirstQuickActionCenterModel = {
  eyebrow: string;
  title: string;
  description: string;
  primaryActions: TaskFirstQuickAction[];
  secondaryActions: TaskFirstQuickAction[];
};

type DashboardQuickActionContext =
  | "public"
  | "pending"
  | "verified"
  | "limited"
  | "blocked"
  | "operator";

export function buildPublicTaskFirstQuickActionCenter(): TaskFirstQuickActionCenterModel {
  return {
    eyebrow: "Schnell starten",
    title: "Vier Wege, die sofort klar machen, was du hier tun kannst.",
    description:
      "Du musst nicht wissen, welches Modul richtig ist. Diese Einstiege führen direkt auf die bestehenden review-first Pfade.",
    primaryActions: [
      {
        id: "contribute",
        label: "Ich will etwas beitragen",
        description:
          "Starte mit einem Hinweis, einer Frage oder einer Beobachtung. Der Einstieg bleibt leicht und review-first.",
        href: "/create?intent=contribute",
        priority: "primary",
      },
      {
        id: "topics",
        label: "Ich will Themen anschauen",
        description:
          "Sieh dir an, welche Themen, Dossiers und Fragen gerade öffentlich sichtbar sind.",
        href: "/themen",
        priority: "secondary",
      },
      {
        id: "rounds",
        label: "Ich will einen Anlassraum/Event erstellen",
        description:
          "Ein schlanker Start auf dem bestehenden Pfad: Titel, Wirkraum, Ziel. Zeitraum bleibt optional und alles ist review-first.",
        href: "/runden?intent=create",
        priority: "secondary",
      },
      {
        id: "organization",
        label: "Ich melde eine Organisation an",
        description:
          "Ein Einstieg für Verwaltung, Kommune, Verein, Träger, Medienpartner, Agentur oder Stiftung mit geführter Freischaltung.",
        href: "/account/organization",
        priority: "secondary",
      },
    ],
    secondaryActions: [],
  };
}

export function buildOrganizationTaskFirstQuickActionCenter(input: {
  context: DashboardQuickActionContext;
  organizationHref: string;
  canSourceMaterial: boolean;
  canReviewApprovals: boolean;
}): TaskFirstQuickActionCenterModel {
  const organizationAction =
    input.context === "verified" || input.context === "operator"
      ? {
          id: "organization",
          label: "Ich öffne meinen Arbeitsbereich",
          description:
            "Öffne Status, Scope, Freigaben und die nächsten produktiven Schritte deiner Organisation.",
          href: input.organizationHref,
          priority: "secondary" as const,
          badge: input.context === "operator" ? "Betreiberkontext" : "Arbeitsbereich",
        }
      : input.context === "blocked"
        ? {
            id: "organization",
            label: "Ich prüfe meine Freischaltung",
            description:
              "Dein Zugang ist pausiert oder gesperrt. Hier siehst du den Status und die nächsten sicheren Schritte.",
            href: input.organizationHref,
            priority: "secondary" as const,
            badge: "Nächster Schritt",
          }
        : {
            id: "organization",
            label: "Ich prüfe meine Organisation",
            description:
              "Hier siehst du Antrag, Nachweise, Freischaltung und die nächsten sicheren Schritte für deine Organisation.",
            href: input.organizationHref,
            priority: "secondary" as const,
            badge: "Nächster Schritt",
          };

  const roundsAction =
    input.context === "verified" || input.context === "operator"
      ? {
          id: "rounds",
          label: "Ich will einen Anlassraum/Event erstellen",
          description:
            "Starte schlank mit Titel, Wirkraum und Ziel. Zeitraum bleibt optional und alles bleibt review-first.",
          href: "/runden?intent=create",
          priority: "secondary" as const,
          badge: "Produktiver Pfad",
        }
      : input.context === "blocked"
        ? {
            id: "rounds",
            label: "Ich will einen Anlassraum/Event erstellen",
            description:
              "Anlassräume bleiben bis zur Klärung von Vertrag, Freischaltung oder Sperre im sicheren Hinweis-Modus.",
            href: input.organizationHref,
            priority: "secondary" as const,
            badge: "Freischaltung nötig",
          }
        : {
            id: "rounds",
            label: "Ich will einen Anlassraum/Event erstellen",
            description:
              "Für einen produktiven Anlassraum braucht deine Organisation zuerst die passende Freischaltung. Hier siehst du den nächsten sicheren Schritt.",
            href: input.organizationHref,
            priority: "secondary" as const,
            badge: "Freischaltung nötig",
          };

  const secondaryActions: TaskFirstQuickAction[] = [];
  if (input.context === "verified" || input.context === "operator") {
    if (input.canSourceMaterial) {
      secondaryActions.push({
        id: "source-material",
        label: "Quelle/Material einreichen",
        description:
          "Reiche Quelle, Dokument oder Material bewusst ein. Rohmaterial bleibt review-first und ohne Automatikversprechen.",
        href: "/create?intent=contribute&mode=source",
        priority: "secondary",
        badge: "Optional",
      });
    }
    if (input.canReviewApprovals) {
      secondaryActions.push({
        id: "review-approvals",
        label: "Freigaben prüfen",
        description:
          "Öffne deine Review-, Freigabe- und Sichtbarkeitsaufgaben im bestehenden Organisationspfad.",
        href: "/account/organization/dashboard#aufgaben",
        priority: "secondary",
        badge: "Optional",
      });
    }
  }

  return {
    eyebrow: "Schnell starten",
    title: "Aufgaben zuerst, nicht Module",
    description:
      input.context === "verified" || input.context === "operator"
        ? "Diese Einstiege führen direkt in die produktiven V1-Pfade deiner Organisation. Review-first und ohne falsche Vollzugriffsversprechen."
        : "Wenige klare Wege statt voller Modulwahl: du siehst nur sichere Einstiege und die nächsten Schritte für Freischaltung oder Arbeitsbereich.",
    primaryActions: [
      {
        id: "contribute",
        label: "Ich will etwas beitragen",
        description:
          "Starte mit einem Hinweis, einer Frage oder einem Arbeitsstand auf dem bestehenden review-first Pfad.",
        href: "/create?intent=contribute",
        priority: "primary",
      },
      {
        id: "topics",
        label: "Ich will Themen anschauen",
        description: "Öffne sichtbare Themen, Dossiers und öffentliche Arbeitsstände.",
        href: "/themen",
        priority: "secondary",
      },
      roundsAction,
      organizationAction,
    ],
    secondaryActions,
  };
}
