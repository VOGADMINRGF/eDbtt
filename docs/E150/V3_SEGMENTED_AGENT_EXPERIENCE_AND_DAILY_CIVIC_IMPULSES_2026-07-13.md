# V3 Segmented Agent Experience and Daily Civic Impulses

Status: canonical product decision
Date: 2026-07-13
Scope: B2C, B2B and B2G experience on top of the shared seven-role agent architecture

## Product decision

All agent capabilities remain inside eDebatte and continue to use the existing V3 dossier, graph, claims, source, review, participation, organization, pricing and handoff structures.

The underlying six specialist agents remain shared across segments. Their public presentation differs by user need:

- B2C may receive Personal Voxy as a consented dialogue and relevance companion.
- B2B receives a team and topic workbench with optional assisted guidance or a named human contact.
- B2G receives a jurisdiction, Debattenstand and response cockpit with optional assisted guidance or a named human contact.

B2B and B2G must not be forced into a conversational companion experience.

## B2C entry and ongoing mode

On first consented use, Personal Voxy may research or retrieve current regional civic topics, public participation opportunities, citizen initiatives and related eDebatte spaces.

The user selects one operating mode:

1. passive: no proactive suggestions;
2. relevant only: suggestions only for high regional or explicitly selected relevance;
3. periodic overview: daily or weekly digest;
4. active companion: topic, connection and participation suggestions;
5. topic watch: updates only for explicitly followed topics.

Premium improves depth, continuity, research, graph exploration, notifications and personal assistance. It must never increase vote weight, suppress counterarguments or buy political visibility.

## Daily civic impulses

The former working title `Meckerbox` is not the canonical product framing.

Canonical purpose:

> Offer up to three lightweight daily opportunities to understand what occupies the user, how the user reasons around a topic, which causes and consequences matter, and which participation form may be appropriate.

The function must not reward negativity. Inputs may be critical, positive or neutral.

Recommended public framing:

- `Was bewegt dich heute?`
- `Drei kurze Impulse`
- `Heute aufgefallen`

The three opportunities are not required to be three complaints. They may cover:

1. perception: what was noticed or considered relevant;
2. interpretation: possible cause, affected group, uncertainty or underlying question;
3. desired effect: what should change, which option should be examined or how the user wishes to participate.

Supported inputs may include text, voice, link, photo, screenshot and optional location.

## Screenshot and observation intake

A screenshot, photo or short statement is evidence of an observation, not proof of its cause.

The agent must separate:

- visible observation;
- user interpretation;
- possible background hypotheses;
- source-backed facts;
- affected-group candidates;
- jurisdiction candidates;
- possible individual actions.

The agent may say `Mögliche Hintergründe sind ...` but must not present an inferred cause as established fact.

The user must be able to confirm, correct, reject or decline storage before an inference becomes part of the Personal Voxy profile or canonical civic graph.

## Argument understanding

Personal Voxy may learn, with consent, topic-specific reasoning preferences and recurring priorities such as:

- causes;
- consequences;
- responsibility;
- fairness;
- safety;
- transparency;
- feasibility;
- cost;
- participation;
- sustainability;
- reliability.

These are contextual reasoning signals, not permanent political identity labels.

An inferred statement must remain topic-specific, confidence-scored, explainable and editable.

Example:

`Bei diesem Thema scheint dir eine verlässliche frühzeitige Information wichtiger zu sein als die konkrete Maßnahme selbst.`

Not allowed:

`Du bist grundsätzlich gegen Verwaltung oder einer politischen Richtung zuzuordnen.`

## Connection to the Dossier and graph

Daily inputs may create reviewable candidates for the existing graph:

- observation;
- occasion;
- open question;
- possible cause;
- affected group;
- desired effect;
- preferred option;
- participation preference;
- individual action.

They must not create a parallel Personal Voxy graph.

The Dossier & Briefing Agent may use confirmed candidates to build simple causal branches:

`Beobachtung → möglicher Hintergrund → belegte Ursache → Betroffene → Optionen → Voraussetzungen → Zuständigkeit → Beteiligung → Wirkung`

Complexity must be progressively disclosed. The first view shows the simple path; evidence, uncertainty, international comparison and transfer requirements open on demand.

## B2B experience

B2B receives a team-oriented workbench focused on:

- member and stakeholder topics;
- recurring concerns and proposals;
- participation opportunities;
- team roles and review;
- dossiers, outcomes and reports;
- optional assisted guidance;
- optional named human contact.

No Personal Voxy memory is created for an organization unless an individual user explicitly enables a separate personal profile.

## B2G first login

After authority verification, the initial cockpit may show:

- public Debattenstände mapped to its jurisdiction;
- current public participations and votes;
- citizen initiatives and recurring topics;
- topics that may warrant a participation process;
- unconfirmed jurisdiction matches requiring review;
- trial adoption status.

Three categories should remain distinct:

1. already available;
2. recommended for internal adoption;
3. suggested as a possible future participation process.

Suggestions are not official findings and do not create an obligation to act.

A public authority may choose:

- self-service cockpit;
- guided digital assistance;
- named human contact;
- managed governance.

## Six specialist-agent improvements

### Intake & Format

Must classify input before creating a debate:

- observation;
- question;
- complaint;
- positive example;
- proposal;
- source;
- participation request;
- existing-topic contribution.

It recommends a dossier or vote only when the material is mature enough.

### Research & Source

Must distinguish current local opportunities from general topic research and preserve jurisdiction, date, organizer, participation deadline and transferability.

### Claims & Factcheck

Must separate personal interpretation, hypothesis, factual claim and normative preference. Only factual claims enter evidence review.

### Participation & Moderation

Must select a format based on the decision need, not only user preference. It must expose when a vote is premature or when prioritization, mapping, scenario comparison or open contribution is more suitable.

### Dossier & Briefing

Must build progressive causal, responsibility and transfer branches and show what is directly possible, what requires a pilot and what requires legal or institutional change.

### Governance & Compliance

Must enforce consent, segment boundaries, institutional verification, notification approval, non-representativeness labels and separation between public reading and paid professional workflow.

## Gamification

Gamification rewards understanding and civic progression, not outrage or submission volume.

Valid progression signals include:

- observation clarified;
- cause differentiated from hypothesis;
- affected perspective added;
- source contributed;
- connection confirmed;
- option compared;
- participation completed;
- jurisdiction identified;
- response received;
- outcome documented.

Recommended progression:

`Wahrgenommen → Eingeordnet → Begründet → Verbunden → Beteiligung ermöglicht → Rückmeldung erhalten → Wirkung sichtbar`

## Non-negotiable boundaries

- everything remains part of eDebatte;
- no hidden political profiling;
- no engagement optimization through outrage;
- no automatic creation of an official debate from every observation;
- no automatic authority notification;
- no agent voting for a user;
- no premium vote weighting or paid political preference;
- no suppression of strong counterarguments or source limitations;
- no parallel graph, dossier, review queue or profile store.
