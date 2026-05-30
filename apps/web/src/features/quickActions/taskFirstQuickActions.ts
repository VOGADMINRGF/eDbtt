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

export type DashboardQuickActionContext =
  | "public"
  | "signed_in"
  | "pending"
  | "verified"
  | "limited"
  | "blocked"
  | "operator";

export type StartQuickActionContext =
  | "unknown_visitor"
  | "returning_visitor"
  | "signed_in"
  | "organization_pending"
  | "organization_verified"
  | "organization_blocked"
  | "operator";

export function buildPublicTaskFirstQuickActionCenter(input?: {
  context?: StartQuickActionContext;
  workspaceHref?: string;
}): TaskFirstQuickActionCenterModel {
  const context = input?.context ?? "unknown_visitor";
  const workspaceHref = input?.workspaceHref ?? "/account/organization";

  if (context === "operator") {
    return {
      eyebrow: "Schon dabei?",
      title: "Öffne deinen Arbeitsbereich und geh direkt in die nächste Aufgabe.",
      description:
        "Du bist bereits im Betreiber- oder Review-Kontext. Die wichtigsten Wege liegen direkt auf den bestehenden produktiven Pfaden.",
      primaryActions: [
        {
          id: "review",
          label: "Ich öffne die Review-Queue",
          description:
            "Gehe direkt in die zentrale Prüf- und Freigabestrecke. Sichtbarkeit bleibt bewusst und review-first.",
          href: "/admin/review",
          priority: "primary",
          badge: "Arbeitsbereich",
        },
        {
          id: "workspace",
          label: "Ich öffne meinen Arbeitsbereich",
          description:
            "Öffne den Organisations- und Scope-Blick auf dieselben produktiven V1-Pfade.",
          href: "/account/organization/dashboard",
          priority: "secondary",
          badge: "Betreiberkontext",
        },
        {
          id: "rounds",
          label: "Ich lege einen Anlassraum an",
          description:
            "Starte direkt mit Rahmen, Optionen und Sichtbarkeit. KI bleibt optional.",
          href: "/runden/new",
          priority: "secondary",
          badge: "Produktiver Pfad",
        },
      ],
      secondaryActions: [
        {
          id: "contribute",
          label: "Ich will etwas beitragen",
          description:
            "Starte einen neuen Hinweis, eine Frage oder einen Arbeitsstand auf dem review-first Create-Pfad.",
          href: "/create?intent=contribute",
          priority: "secondary",
        },
        {
          id: "topics",
          label: "Ich sehe Themen an",
          description: "Öffne sichtbare Themen, Dossiers und öffentliche Arbeitsstände.",
          href: "/themen",
          priority: "secondary",
        },
      ],
    };
  }

  if (
    context === "signed_in" ||
    context === "returning_visitor" ||
    context === "organization_pending" ||
    context === "organization_verified" ||
    context === "organization_blocked"
  ) {
    const isVerified = context === "organization_verified";
    const isBlocked = context === "organization_blocked";
    return {
      eyebrow: "Schon dabei?",
      title: isVerified
        ? "Öffne deinen Arbeitsbereich oder arbeite direkt weiter."
        : isBlocked
          ? "Klare nächste Schritte statt gesperrter Vollzugriffe."
          : "Öffne deinen Arbeitsbereich oder kläre den nächsten sicheren Schritt.",
      description: isVerified
        ? "Du bist schon im produktiven V1-Pfad. Arbeitsbereich, Anlassraum und Beitragseinstieg liegen direkt vorne."
        : isBlocked
          ? "Produktive Organisationsschritte bleiben bis zur Klärung gesperrt. Du siehst hier nur sichere nächste Wege."
          : "Du musst nicht neu einsteigen. Arbeitsbereich, Status und die nächsten sicheren Aktionen stehen vorne.",
      primaryActions: [
        {
          id: "workspace",
          label: "Ich öffne meinen Arbeitsbereich",
          description: isVerified
            ? "Öffne Status, Aufgaben, Dossier-, Anlassraum- und Review-Kontext deiner Organisation."
            : isBlocked
              ? "Prüfe Status, Sperre und nächste sichere Schritte deiner Organisation."
              : "Prüfe Antrag, Freischaltung, Status und nächste sichere Schritte deiner Organisation.",
          href: isVerified ? "/account/organization/dashboard" : workspaceHref,
          priority: "primary",
          badge: isVerified ? "Arbeitsbereich" : "Nächster Schritt",
        },
        {
          id: "rounds",
          label: "Ich lege einen Anlassraum an",
          description: isVerified
            ? "Starte direkt mit Rahmen, Optionen und Sichtbarkeit."
            : "Produktive Anlassräume folgen nach passender Freischaltung. Hier siehst du den sicheren nächsten Schritt.",
          href: isVerified ? "/runden/new" : workspaceHref,
          priority: "secondary",
          badge: isVerified ? "Produktiver Pfad" : "Freischaltung nötig",
        },
        {
          id: "contribute",
          label: "Ich will etwas beitragen",
          description:
            "Starte mit einem Hinweis, einer Frage oder einem Arbeitsstand auf dem review-first Create-Pfad.",
          href: "/create?intent=contribute",
          priority: "secondary",
        },
      ],
      secondaryActions: [
        {
          id: "topics",
          label: "Ich sehe Themen an",
          description: "Öffne sichtbare Themen, Dossiers und öffentliche Arbeitsstände.",
          href: "/themen",
          priority: "secondary",
        },
      ],
    };
  }

  return {
    eyebrow: "Neu hier?",
    title: "Starte mit einem Beitrag oder einem Anlassraum.",
    description:
      "Drei klare Einstiege reichen für den Anfang: ein Anliegen einreichen, einen Anlassraum anlegen oder sichtbare Themen ansehen.",
    primaryActions: [
      {
        id: "contribute",
        label: "Ich reiche ein Anliegen ein",
        description:
          "Starte mit einem Hinweis, einer Frage oder einer Beobachtung. Der Einstieg bleibt leicht und review-first.",
        href: "/create?intent=contribute",
        priority: "primary",
      },
      {
        id: "topics",
        label: "Ich sehe Themen an",
        description:
          "Sieh dir an, welche Themen, Dossiers und Fragen gerade öffentlich sichtbar sind.",
        href: "/themen",
        priority: "secondary",
      },
      {
        id: "rounds",
        label: "Ich lege einen Anlassraum an",
        description:
          "Rahmen, Optionen und Sichtbarkeit zuerst. KI und Prüfung bleiben optionale nächste Schritte.",
        href: "/runden/new",
        priority: "secondary",
      },
    ],
    secondaryActions: [
      {
        id: "organization",
        label: "Ich melde eine Organisation an",
        description:
          "Ein Einstieg für Verwaltung, Kommune, Verein, Träger, Medienpartner, Agentur oder Stiftung mit geführter Freischaltung.",
        href: "/account/organization",
        priority: "secondary",
      },
    ],
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
          label: "Ich lege einen Anlassraum an",
          description:
            "Starte schlank mit Rahmen, Optionen und Sichtbarkeit. KI bleibt optional.",
          href: "/runden/new",
          priority: "secondary" as const,
          badge: "Produktiver Pfad",
        }
      : input.context === "blocked"
        ? {
          id: "rounds",
          label: "Ich kläre die Anlassraum-Freischaltung",
          description:
            "Anlassräume bleiben bis zur Klärung von Vertrag, Freischaltung oder Sperre im sicheren Hinweis-Modus.",
          href: input.organizationHref,
          priority: "secondary" as const,
          badge: "Freischaltung nötig",
        }
        : {
            id: "rounds",
            label: "Ich kläre die Anlassraum-Freischaltung",
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
  } else if (input.context === "blocked") {
    secondaryActions.push({
      id: "contact",
      label: "Kontakt aufnehmen",
      description:
        "Wenn Vertrag, Billing oder Freischaltung gesperrt sind, klärst du hier den nächsten Schritt.",
      href: "/kontakt",
      priority: "secondary",
      badge: "Sicherer Weg",
    });
  }

  return {
    eyebrow: "Schnell starten",
    title:
      input.context === "verified" || input.context === "operator"
        ? "Arbeite direkt auf den produktiven V1-Pfaden weiter"
        : input.context === "blocked"
          ? "Klare nächste Schritte statt gesperrter Vollzugriffe"
          : "Nächste sichere Schritte statt Modulteppich",
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
      roundsAction,
      organizationAction,
    ],
    secondaryActions,
  };
}
