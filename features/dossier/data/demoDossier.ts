import type { Dossier } from "../schemas";

const CREATED_AT = "2026-02-19T08:00:00.000Z";

const BASE_DEBATE_FRAME = {
  rights: [],
  duties: [],
  minimumStandards: [],
  enforcement: {
    stages: [],
    humanitarianExceptions: true,
    legalSafeguards: [],
  },
  metrics: [],
  antiPopulism: {
    score: 0,
    gates: [],
    status: "needs_review" as const,
  },
};

export const demoDossier: Dossier = {
  meta: {
    id: "demo-school-2026",
    title: "Kommunale Bildungsinfrastruktur: Sanierung oder Neubau einer bestehenden Schule",
    jurisdiction: "municipal",
    region: "Beispielstadt",
    status: "draft",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  },
  analyze: {
    mode: "E150",
    sourceText:
      "Welche bauliche Entwicklungsstrategie ist für den bestehenden Schulstandort unter Berücksichtigung von Haushaltslage, pädagogischem Bedarf, Klimazielen und Demografie sachgerecht?",
    language: "de",
    claims: [
      {
        id: "stmt-1",
        title: "Bestandssanierung",
        text: "Die bestehende Schule wird umfassend modernisiert und technisch ertüchtigt.",
        responsibility: "Kommune",
        importance: 5,
        topic: "Schulentwicklung",
        domain: "bildung",
        domains: ["bildung", "infrastruktur"],
        stance: "pro",
        debateFrame: {
          version: "v1",
          level: "local",
          policyDomain: "education",
          jurisdiction: {
            actors: ["Kommune"],
            region: "Beispielstadt",
          },
          objective: "Funktionsfähige Bildungsinfrastruktur bei vertretbarer Haushaltsbelastung.",
          ...BASE_DEBATE_FRAME,
          options: [
            { id: "opt-a", label: "Vollständige Bestandssanierung", type: "reform_strong" },
            { id: "opt-c", label: "Hybridlösung (Teilneubau + Bestand)", type: "reform_moderate" },
            { id: "opt-d", label: "Modularer Neubau mit phasenweiser Umsetzung", type: "pilot" },
          ],
        },
      },
      {
        id: "stmt-2",
        title: "Neubau",
        text: "Der bestehende Standort wird durch einen vollständigen Neubau ersetzt.",
        responsibility: "Kommune",
        importance: 5,
        topic: "Schulentwicklung",
        domain: "bildung",
        domains: ["bildung", "infrastruktur"],
        stance: "contra",
        debateFrame: {
          version: "v1",
          level: "local",
          policyDomain: "education",
          jurisdiction: {
            actors: ["Kommune"],
            region: "Beispielstadt",
          },
          objective: "Langfristig anpassungsfähiger Schulstandort mit moderner Infrastruktur.",
          ...BASE_DEBATE_FRAME,
          options: [
            { id: "opt-b", label: "Kompletter Neubau", type: "reform_strong" },
            { id: "opt-c", label: "Hybridlösung (Teilneubau + Bestand)", type: "reform_moderate" },
            { id: "opt-e", label: "Standortkooperation mit Nachbargemeinde", type: "custom" },
          ],
        },
      },
      {
        id: "stmt-3",
        title: "Übergangslösung: Modulbau zur Reduktion von Unterrichtsausfällen",
        text:
          "Ein modularer Bau kann als zeitlich befristete Übergangslösung eingesetzt werden, um Bauphasen am Standort abzufedern.",
        responsibility: "Kommune",
        importance: 4,
        topic: "Schulentwicklung",
        domain: "infrastruktur",
        domains: ["bildung", "infrastruktur"],
        stance: "neutral",
        debateFrame: {
          version: "v1",
          level: "local",
          policyDomain: "education",
          jurisdiction: {
            actors: ["Kommune"],
            region: "Beispielstadt",
          },
          objective: "Planungssicherheit und Minimierung von Einschränkungen im Schulbetrieb.",
          ...BASE_DEBATE_FRAME,
          options: [
            { id: "opt-d", label: "Modulbau als Übergangslösung", type: "pilot" },
            { id: "opt-f", label: "Phasenplanung mit Ausweichflächen", type: "custom" },
          ],
        },
      },
      {
        id: "stmt-4",
        title: "Risikolage im Bestand: Statik, Schadstoffe und Brandschutz",
        text:
          "Der Umfang einer Sanierung hängt wesentlich von baulichen Risiken (z. B. Statik, Schadstoffe, Brandschutz) und deren Kostenfolgen ab.",
        responsibility: "Kommune",
        importance: 4,
        topic: "Schulentwicklung",
        domain: "infrastruktur",
        domains: ["infrastruktur", "sicherheit"],
        stance: "neutral",
        debateFrame: {
          version: "v1",
          level: "local",
          policyDomain: "education",
          jurisdiction: {
            actors: ["Kommune"],
            region: "Beispielstadt",
          },
          objective: "Risikominimierung und belastbare Kosten- und Zeitplanung.",
          ...BASE_DEBATE_FRAME,
          options: [
            {
              id: "opt-g",
              label: "Vorab-Gutachtenpaket (Statik/Schadstoffe/Brandschutz)",
              type: "custom",
            },
            { id: "opt-c", label: "Hybridlösung (Teilneubau + Bestand)", type: "reform_moderate" },
          ],
        },
      },
      {
        id: "stmt-5",
        title: "Energieeffizienz und Betriebskosten als Entscheidungsdimension",
        text:
          "Energieeffizienzanforderungen und erwartete Betriebskosten beeinflussen die langfristige Wirtschaftlichkeit der Varianten.",
        responsibility: "Kommune",
        importance: 3,
        topic: "Schulentwicklung",
        domain: "klima",
        domains: ["klima", "infrastruktur"],
        stance: "neutral",
        debateFrame: {
          version: "v1",
          level: "local",
          policyDomain: "education",
          jurisdiction: {
            actors: ["Kommune"],
            region: "Beispielstadt",
          },
          objective: "Langfristig tragfähiger Betrieb (Energie/Unterhalt).",
          ...BASE_DEBATE_FRAME,
          options: [
            { id: "opt-a", label: "Vollständige Bestandssanierung", type: "reform_strong" },
            { id: "opt-b", label: "Kompletter Neubau", type: "reform_strong" },
          ],
        },
      },
      {
        id: "stmt-6",
        title: "Raumprogramm und pädagogische Nutzbarkeit",
        text:
          "Die Varianten unterscheiden sich in der Umsetzbarkeit moderner Raumkonzepte (z. B. Differenzierungsräume, Ganztag, Inklusion).",
        responsibility: "Kommune",
        importance: 4,
        topic: "Schulentwicklung",
        domain: "bildung",
        domains: ["bildung", "infrastruktur"],
        stance: "neutral",
        debateFrame: {
          version: "v1",
          level: "local",
          policyDomain: "education",
          jurisdiction: {
            actors: ["Kommune"],
            region: "Beispielstadt",
          },
          objective: "Pädagogisch geeignete Flächen und flexible Nutzung.",
          ...BASE_DEBATE_FRAME,
          options: [
            { id: "opt-b", label: "Kompletter Neubau", type: "reform_strong" },
            { id: "opt-c", label: "Hybridlösung (Teilneubau + Bestand)", type: "reform_moderate" },
          ],
        },
      },
      {
        id: "stmt-7",
        title: "Fördermittel- und Zeitfenster beeinflussen die Variantenwahl",
        text:
          "Zeitlich gebundene Förderprogramme und Antragsfristen können die Machbarkeit, Reihenfolge und Wirtschaftlichkeit der Varianten beeinflussen.",
        responsibility: "Kommune",
        importance: 3,
        topic: "Schulentwicklung",
        domain: "finanzen",
        domains: ["finanzen", "infrastruktur"],
        stance: "neutral",
        debateFrame: {
          version: "v1",
          level: "local",
          policyDomain: "education",
          jurisdiction: {
            actors: ["Kommune"],
            region: "Beispielstadt",
          },
          objective: "Finanzierungsfähigkeit und Terminsicherheit.",
          ...BASE_DEBATE_FRAME,
          options: [
            { id: "opt-f", label: "Phasenplanung mit Fördermittelkalender", type: "custom" },
            {
              id: "opt-g",
              label: "Vorab-Gutachtenpaket (Statik/Schadstoffe/Brandschutz)",
              type: "custom",
            },
          ],
        },
      },
      {
        id: "stmt-8",
        title: "Interkommunale Kooperation als Alternative oder Ergänzung",
        text:
          "Kooperationen mit Nachbarkommunen (z. B. gemeinsame Nutzung, abgestimmte Einzugsbereiche) können Investitions- und Betriebskosten beeinflussen.",
        responsibility: "Kommune",
        importance: 2,
        topic: "Schulentwicklung",
        domain: "verwaltung",
        domains: ["verwaltung", "infrastruktur"],
        stance: "neutral",
        debateFrame: {
          version: "v1",
          level: "local",
          policyDomain: "education",
          jurisdiction: {
            actors: ["Kommune"],
            region: "Beispielstadt",
          },
          objective: "Robuste Kapazitäts- und Kostenplanung über Gemeindegrenzen hinweg.",
          ...BASE_DEBATE_FRAME,
          options: [
            { id: "opt-e", label: "Standortkooperation mit Nachbargemeinde", type: "custom" },
          ],
        },
      },
      {
        id: "stmt-9",
        title: "Bauablauf und Interimslösungen als Akzeptanz- und Qualitätsfaktor",
        text:
          "Bauablaufplanung, Interimslösungen und Verkehrssicherheit rund um den Standort wirken auf Schulbetrieb, Nachbarschaft und Projektakzeptanz.",
        responsibility: "Kommune",
        importance: 3,
        topic: "Schulentwicklung",
        domain: "infrastruktur",
        domains: ["infrastruktur", "sicherheit"],
        stance: "neutral",
        debateFrame: {
          version: "v1",
          level: "local",
          policyDomain: "education",
          jurisdiction: {
            actors: ["Kommune"],
            region: "Beispielstadt",
          },
          objective: "Stabiler Schulbetrieb und sichere Baustellenlogistik.",
          ...BASE_DEBATE_FRAME,
          options: [
            { id: "opt-f", label: "Phasenplanung mit Ausweichflächen", type: "custom" },
            { id: "opt-d", label: "Modulbau als Übergangslösung", type: "pilot" },
          ],
        },
      },
    ],
    notes: [
      {
        id: "note-1",
        text: "Referenzdossier für Demo- und PR-Zwecke. Neutral modelliert.",
        kind: "context",
      },
      {
        id: "note-presentation-inputs",
        kind: "presentation",
        text: JSON.stringify({
          topic: { id: "t1", label: "Schulentwicklung", municipality: "Beispielstadt" },
          inputs: { streams: 3, "beiträge": 12, zeitfenster: "90 Tage", quellen: 2 },
          statementStats: { total: 9, pro: 1, neutral: 7, contra: 1 },
          clusters: [
            { label: "Kosten/Haushalt", count: 3 },
            { label: "Pädagogik/Raumkonzept", count: 3 },
            { label: "Klima/Energie", count: 2 },
            { label: "Bauzeit/Übergang", count: 1 },
          ],
        }),
      },
      {
        id: "note-presentation-options",
        kind: "presentation",
        text: JSON.stringify({
          options: [
            {
              id: "opt-a",
              label: "Vollständige Bestandssanierung",
              type: "reform_strong",
              touchesStatements: ["stmt-1", "stmt-5"],
            },
            {
              id: "opt-b",
              label: "Kompletter Neubau",
              type: "reform_strong",
              touchesStatements: ["stmt-2", "stmt-5", "stmt-6"],
            },
            {
              id: "opt-c",
              label: "Hybridlösung (Teilneubau + Bestand)",
              type: "reform_moderate",
              touchesStatements: ["stmt-1", "stmt-2", "stmt-4", "stmt-6"],
            },
            {
              id: "opt-d",
              label: "Modulbau als Übergangslösung",
              type: "pilot",
              touchesStatements: ["stmt-3", "stmt-9"],
            },
            {
              id: "opt-e",
              label: "Standortkooperation mit Nachbargemeinde",
              type: "custom",
              touchesStatements: ["stmt-8"],
            },
            {
              id: "opt-f",
              label: "Phasenplanung mit Ausweichflächen & Fördermittelkalender",
              type: "custom",
              touchesStatements: ["stmt-3", "stmt-7", "stmt-9"],
            },
            {
              id: "opt-g",
              label: "Vorab-Gutachtenpaket (Statik/Schadstoffe/Brandschutz)",
              type: "custom",
              touchesStatements: ["stmt-4", "stmt-7"],
            },
          ],
        }),
      },
      {
        id: "note-inputs",
        kind: "presentation",
        text: JSON.stringify({
          topic: { label: "Schulentwicklung", kommune: "Beispielstadt", zeitfensterTage: 90 },
          hero: {
            impactLevel: "Hoch",
            relevance: "10–20 Jahre",
            budgetRange: "30–50 Mio €",
            participation: "Bürgerbeteiligung (Civic, 5 Optionen)",
          },
          inputs: {
            streams: [
              {
                id: "st-001",
                titel: "Ausschuss: Grundsatzdebatte Schulstandort",
                datum: "2026-01-18",
              },
              {
                id: "st-002",
                titel: "Bürgerforum: Raumprogramm & Ganztag",
                datum: "2026-02-02",
              },
              {
                id: "st-003",
                titel: "Haushaltshearing: Investitionsrahmen 2026–2030",
                datum: "2026-02-10",
              },
            ],
            beitraege: [
              {
                id: "cb-101",
                titel: "Elternvertretung: Anforderungen Ganztag",
                datum: "2026-02-03",
                streamId: "st-002",
              },
              {
                id: "cb-102",
                titel: "Schulleitung: Raumkonzept & Barrierefreiheit",
                datum: "2026-02-03",
                streamId: "st-002",
              },
              {
                id: "cb-103",
                titel: "Bauamt: Risikobericht Bestand",
                datum: "2026-01-25",
                streamId: "st-001",
              },
              {
                id: "cb-104",
                titel: "Kämmerei: Investitions- und Betriebskosten",
                datum: "2026-02-11",
                streamId: "st-003",
              },
            ],
          },
          vote: {
            options: [
              { id: "opt-a", label: "Vollständige Bestandssanierung", type: "reform_strong" },
              { id: "opt-b", label: "Kompletter Neubau", type: "reform_strong" },
              { id: "opt-c", label: "Hybridlösung (Teilneubau + Bestand)", type: "reform_moderate" },
              { id: "opt-d", label: "Modulbau als Übergangslösung", type: "pilot" },
              {
                id: "opt-f",
                label: "Phasenplanung + Ausweichflächen + Fördermittelkalender",
                type: "custom",
              },
            ],
            majorityDemo: [
              { id: "opt-a", pct: 22 },
              { id: "opt-b", pct: 28 },
              { id: "opt-c", pct: 31 },
              { id: "opt-d", pct: 9 },
              { id: "opt-f", pct: 10 },
            ],
          },
          traceability: {
            streamsToStatements: {
              "st-001": ["stmt-1", "stmt-4"],
              "st-002": ["stmt-6", "stmt-7"],
              "st-003": ["stmt-5", "stmt-3"],
            },
            contributionsToStatements: {
              "cb-101": ["stmt-7"],
              "cb-102": ["stmt-6"],
              "cb-103": ["stmt-4"],
              "cb-104": ["stmt-5"],
            },
          },
        }),
      },
    ],
    questions: [
      {
        id: "q1",
        text: "Wie entwickeln sich die Schülerzahlen in den kommenden 10 Jahren?",
        dimension: "demografie",
      },
      {
        id: "q2",
        text: "Welche Förderprogramme laufen innerhalb der nächsten 24 Monate aus?",
        dimension: "fördermittel",
      },
      {
        id: "q3",
        text: "Welche baulichen Risiken bestehen im Bestand (Statik, Schadstoffe, Brandschutz)?",
        dimension: "bauzustand",
      },
    ],
    missingPerspectives: [
      {
        id: "mp1",
        text: "Perspektive der Schulleitung und Elternvertretung",
        dimension: "nutzung",
      },
    ],
    knots: [
      {
        id: "k1",
        label: "Investitionslast vs. Betriebsdauer",
        description:
          "Abwägung zwischen kurzfristiger Haushaltsbelastung und langfristiger Nutzungsdauer.",
      },
    ],
    consequences: {
      consequences: [
        {
          id: "cons-1",
          scope: "local_long",
          statementIndex: 0,
          text: "Energetische Sanierung kann Betriebskosten mittel- bis langfristig reduzieren.",
          confidence: 0.6,
        },
        {
          id: "cons-2",
          scope: "local_long",
          statementIndex: 1,
          text: "Neubau erlaubt vollständige Barrierefreiheit und flexible Raumkonzepte.",
          confidence: 0.6,
        },
        {
          id: "cons-3",
          scope: "local_short",
          statementIndex: 0,
          text: "Bauzeit kann zu Ausweichunterricht und Zwischenlösungen führen.",
          confidence: 0.5,
        },
        {
          id: "cons-4",
          scope: "local_short",
          statementIndex: 1,
          text: "Neubau bindet kurzfristig höhere Investitionsmittel.",
          confidence: 0.7,
        },
      ],
      responsibilities: [
        {
          id: "resp-1",
          level: "municipality",
          actor: "Gemeinderat",
          text: "Beschluss über Investitionsrahmen und Priorisierung.",
          relevance: 0.9,
        },
        {
          id: "resp-2",
          level: "municipality",
          actor: "Bauamt",
          text: "Planung, Vergabe und Projektsteuerung.",
          relevance: 0.8,
        },
        {
          id: "resp-3",
          level: "state",
          actor: "Landesbildungsbehörde",
          text: "Fachaufsicht und Genehmigungen für Schulbau.",
          relevance: 0.6,
        },
        {
          id: "resp-4",
          level: "federal",
          actor: "Bund",
          text: "Förderprogramme für Sanierung und Klimaschutz.",
          relevance: 0.4,
        },
      ],
    },
    responsibilityPaths: [
      {
        id: "path-1",
        statementId: "stmt-1",
        locale: "de",
        nodes: [
          {
            level: "municipality",
            actorKey: "council",
            displayName: "Gemeinderat",
            description: "Politischer Grundsatzbeschluss und Haushaltsfreigabe.",
            processHint: "Haushalts- und Investitionsbeschluss",
            relevance: 0.9,
          },
          {
            level: "municipality",
            actorKey: "building_office",
            displayName: "Bauamt",
            description: "Planung, Vergabe und Bauleitung.",
            processHint: "Vergabeverfahren nach VgV/UVgO",
            relevance: 0.8,
          },
          {
            level: "state",
            actorKey: "education_state",
            displayName: "Landesbildungsbehörde",
            description: "Schulfachliche Genehmigungen und Aufsicht.",
            relevance: 0.6,
          },
        ],
        createdAt: CREATED_AT,
      },
      {
        id: "path-2",
        statementId: "stmt-2",
        locale: "de",
        nodes: [
          {
            level: "municipality",
            actorKey: "council",
            displayName: "Gemeinderat",
            description: "Grundsatzentscheidung für Neubauvariante.",
            processHint: "Standort- und Finanzierungsbeschluss",
            relevance: 0.9,
          },
          {
            level: "state",
            actorKey: "education_state",
            displayName: "Landesbildungsbehörde",
            description: "Prüfung schulfachlicher Anforderungen.",
            relevance: 0.6,
          },
          {
            level: "federal",
            actorKey: "federal_funding",
            displayName: "Bundesförderung",
            description: "Programme für Klimaschutz und Infrastruktur.",
            relevance: 0.4,
          },
        ],
        createdAt: CREATED_AT,
      },
    ],
    eventualities: [
      {
        id: "ev-1",
        statementId: "stmt-1",
        label: "Sanierung mit Etappenplan",
        narrative: "Modernisierung in Bauabschnitten bei laufendem Betrieb.",
        stance: "pro",
        likelihood: 0.6,
        impact: 0.5,
        consequences: [
          {
            id: "cons-5",
            scope: "local_short",
            statementIndex: 0,
            text: "Teilweise Nutzungseinschränkungen über 24-36 Monate.",
            confidence: 0.5,
          },
        ],
        responsibilities: [
          {
            id: "resp-5",
            level: "municipality",
            actor: "Schulträger",
            text: "Koordination der Bauabschnitte mit Schulleitung.",
            relevance: 0.7,
          },
        ],
        children: [],
      },
    ],
    decisionTrees: [
      {
        id: "dt-1",
        rootStatementId: "stmt-1",
        locale: "de",
        createdAt: CREATED_AT,
        options: {
          pro: {
            id: "dt-1-pro",
            statementId: "stmt-1",
            label: "Sanierung",
            narrative: "Sanierung mit energetischer Ertüchtigung und Brandschutz.",
            stance: "pro",
            likelihood: 0.5,
            impact: 0.5,
            consequences: [],
            responsibilities: [],
            children: [],
          },
          contra: {
            id: "dt-1-contra",
            statementId: "stmt-2",
            label: "Neubau",
            narrative: "Neubau mit neuem Raumprogramm und moderner Infrastruktur.",
            stance: "contra",
            likelihood: 0.5,
            impact: 0.6,
            consequences: [],
            responsibilities: [],
            children: [],
          },
        },
      },
    ],
    impactAndResponsibility: {
      impacts: [
        {
          type: "haushalt",
          description: "Investitionsvolumen über 5-10 Jahre.",
          confidence: 0.7,
        },
        {
          type: "klima",
          description: "CO₂- und Energieeffizienz im Betrieb.",
          confidence: 0.6,
        },
        {
          type: "pädagogik",
          description: "Nutzungsqualität und Raumkonzept.",
          confidence: 0.6,
        },
      ],
      responsibleActors: [
        { level: "municipality", hint: "Gemeinderat und Schulträger", confidence: 0.8 },
        { level: "state", hint: "Schulaufsicht und Landesprogramme", confidence: 0.6 },
      ],
    },
    participationCandidates: [
      {
        id: "pc-1",
        text: "Schüler- und Elternvertretungen",
        rationale: "Nutzerperspektive im Schulalltag.",
      },
      {
        id: "pc-2",
        text: "Lehrkräftevertretung",
        rationale: "Arbeitsbedingungen und pädagogische Anforderungen.",
      },
      {
        id: "pc-3",
        text: "Bau- und Umweltbehörde",
        rationale: "Genehmigungen, Klima- und Sicherheitsstandards.",
      },
    ],
    report: {
      summary:
        "Das Dossier modelliert zwei gleichwertige Kernoptionen mit klaren Bewertungsdimensionen und Entscheidungswegen.",
      keyConflicts: [
        "Kurzfristige Haushaltsbelastung vs. langfristige Betriebskosten",
        "Bauzeitliche Einschränkungen vs. Qualität des Raumprogramms",
      ],
      facts: {
        local: [
          "Sanierungskosten ca. 28 Mio. € (Vormerkung im Haushaltsentwurf).",
          "Neubaukosten ca. 50 Mio. € (Planungsstand Vorprojekt).",
        ],
        international: [],
      },
      openQuestions: [
        "Demografische Entwicklung bis 2036",
        "Fördermittelzusagen für Klimasanierung",
        "Bestandsrisiken bei Statik und Schadstoffen",
      ],
      takeaways: [
        "Beide Optionen sind technisch umsetzbar, unterscheiden sich aber im Investitionsprofil.",
        "Die Entscheidung hängt wesentlich von Fördermitteln und Raumprogramm ab.",
      ],
    },
    evidenceGraph: {
      nodes: [
        { id: "stmt-1", type: "claim", label: "Bestandssanierung" },
        { id: "stmt-2", type: "claim", label: "Neubau" },
        {
          id: "stmt-3",
          type: "claim",
          label: "Übergangslösung: Modulbau zur Reduktion von Unterrichtsausfällen",
        },
        {
          id: "stmt-4",
          type: "claim",
          label: "Risikolage im Bestand: Statik, Schadstoffe und Brandschutz",
        },
        {
          id: "stmt-5",
          type: "claim",
          label: "Energieeffizienz und Betriebskosten als Entscheidungsdimension",
        },
        {
          id: "stmt-6",
          type: "claim",
          label: "Raumprogramm und pädagogische Nutzbarkeit",
        },
        {
          id: "stmt-7",
          type: "claim",
          label: "Fördermittel- und Zeitfenster beeinflussen die Variantenwahl",
        },
        {
          id: "stmt-8",
          type: "claim",
          label: "Interkommunale Kooperation als Alternative oder Ergänzung",
        },
        {
          id: "stmt-9",
          type: "claim",
          label: "Bauablauf und Interimslösungen als Akzeptanz- und Qualitätsfaktor",
        },
        {
          id: "src-1",
          type: "evidence",
          label: "Kommunaler Haushaltsentwurf 2026",
          url: "https://example.org/haushalt-2026",
          publisher: "Beispielstadt",
          sourceClass: "gov",
          weight: 0.6,
        },
        {
          id: "src-2",
          type: "evidence",
          label: "Baukostenindex 2025",
          url: "https://example.org/baukostenindex-2025",
          publisher: "Statistikamt",
          sourceClass: "gov",
          weight: 0.5,
        },
      ],
      edges: [
        { from: "src-1", to: "stmt-1", kind: "supports", weight: 0.6 },
        { from: "src-2", to: "stmt-2", kind: "mentions", weight: 0.4 },
      ],
      summary: {
        claimCount: 9,
        evidenceCount: 2,
        linkedClaimCount: 2,
        unlinkedClaimCount: 7,
      },
    },
    runReceipt: {
      id: "rr-demo-school-2026",
      createdAt: CREATED_AT,
      pipelineVersion: "E150-demo-1",
      provider: "demo",
      model: "demo",
      promptVersion: "pr-0035",
      language: "de",
      inputHash: "ih_demo_school_2026",
      sourcesHash: "sh_demo_school_2026",
      outputHash: "oh_demo_school_2026",
      receiptHash: "rh_demo_school_2026",
      snapshotId: "snap_demo_school_2026",
      sourceSet: [
        {
          canonicalUrl: "https://example.org/haushalt-2026",
          host: "example.org",
          publisher: "Beispielstadt",
          sourceClass: "gov",
          fetchedAt: CREATED_AT,
          title: "Kommunaler Haushaltsentwurf 2026",
        },
        {
          canonicalUrl: "https://example.org/baukostenindex-2025",
          host: "example.org",
          publisher: "Statistikamt",
          sourceClass: "gov",
          fetchedAt: CREATED_AT,
          title: "Baukostenindex 2025",
        },
      ],
      contentPolicy: {
        maxSnippetChars: 240,
        storeFullText: false,
        storeSnippets: false,
        storeTitles: true,
      },
    },
  },
  sourceSet: [
    {
      canonicalUrl: "https://example.org/haushalt-2026",
      host: "example.org",
      publisher: "Beispielstadt",
      sourceClass: "gov",
      fetchedAt: CREATED_AT,
      title: "Kommunaler Haushaltsentwurf 2026",
    },
    {
      canonicalUrl: "https://example.org/baukostenindex-2025",
      host: "example.org",
      publisher: "Statistikamt",
      sourceClass: "gov",
      fetchedAt: CREATED_AT,
      title: "Baukostenindex 2025",
    },
  ],
  voteConfig: {
    enabled: true,
    policy: "civic",
    minOptions: 5,
    allowCommunityOptions: true,
  },
};

export default demoDossier;
