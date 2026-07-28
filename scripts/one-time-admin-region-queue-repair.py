from pathlib import Path

OPEN_TASKS = Path("docs/E150/OpenTasks.md")
HISTORY_MARKER = "## Historischer Katalog und Evidenz"
SECTION_TITLE = "### Admin Region Operating Workspace – nächster Slice"
PARENT_TASK_ID = "ADMIN-BOARD-INFORMATION-ARCHITECTURE-03"
REGION_TASK_ID = "ADMIN-REGION-OPERATING-WORKSPACE-01"

PARENT_ROW = (
    "| ADMIN-BOARD-INFORMATION-ARCHITECTURE-03 | in_progress | P1 | "
    "Nutzerabnahme `/admin/marketing`; Issue #459 | übrige Admin-Boards schrittweise auf die "
    "operator-taugliche Informationsarchitektur der Marketing-Referenz prüfen | technische "
    "Statussammlungen in verständliche, entscheidungsorientierte Arbeitsräume überführen | je Board "
    "eigener kollisionsgeprüfter Slice; reale Workflows; keine zweite Runtime; keine globalen Layout- "
    "oder Governanceänderungen | nein | Issue #459; erster Slice Issue #495 |"
)

REGION_ROW = (
    "| ADMIN-REGION-OPERATING-WORKSPACE-01 | codex_ready | P0 | "
    "ADMIN-BOARD-INFORMATION-ARCHITECTURE-03; Issue #495 | `/admin/region`, "
    "`RegionSourceConnectionsPanel`, fokussierte Region-Tests und Evidence-Doku | ausgewählte Region "
    "als durchgängigen Arbeitsraum von Lagebild, Quellen und Recherche über Claims/Dossier und "
    "interne/externe Beiträge bis zur regionalen Kampagnenübergabe nutzbar machen | erster Bereich "
    "zeigt Relevanz, Quellenlage und nächste Aktion; Arbeitsbereiche Lagebild, Quellen & Feeds, "
    "Recherche, Claims & Dossiers, Beiträge & Veröffentlichung, regionale Kampagnen sowie "
    "nachgeordnete Einstellungen; reale Handoffs ohne Dead Clicks; kein Auto-Research, Auto-Publish "
    "oder neue Persistenz; Mobile/Desktop; Tests, Typecheck, Lint und `git diff --check` grün | nein | "
    "Issue #495; Nutzerentscheidung und Videoabnahme 2026-07-28 |"
)


def replace_first_available(text: str, candidates: tuple[str, ...], replacement: str) -> str:
    for candidate in candidates:
        if candidate in text:
            return text.replace(candidate, replacement, 1)
    return text


def main() -> None:
    text = OPEN_TASKS.read_text(encoding="utf-8")
    if HISTORY_MARKER not in text:
        raise SystemExit("history marker missing")

    head, history = text.split(HISTORY_MARKER, 1)
    if SECTION_TITLE in head:
        head = head.split(SECTION_TITLE, 1)[0].rstrip() + "\n\n"

    task_prefixes = (f"| {PARENT_TASK_ID} |", f"| {REGION_TASK_ID} |")
    head = "\n".join(
        line for line in head.splitlines() if not line.startswith(task_prefixes)
    ).rstrip() + "\n\n"

    head = head.replace(
        "# E150 Open Tasks — Operativer Kopf 2026-07-27",
        "# E150 Open Tasks — Operativer Kopf 2026-07-28",
        1,
    )
    head = head.replace("- Stand: `2026-07-27`", "- Stand: `2026-07-28`", 1)

    head = replace_first_available(
        head,
        (
            "- Letzter gezielter Kopf-Sync: Marketing Assistant UX Fix nach PR `#493`; nicht berührte operative Zeilen behalten ihren zuletzt verifizierten Status.",
            "- Letzter gezielter Kopf-Sync: Admin-Region-Arbeitsraum nach Nutzerabnahme der Marketing-Referenz und Issue `#495`; nicht berührte operative Zeilen behalten ihren zuletzt verifizierten Status.",
        ),
        "- Letzter gezielter Kopf-Sync: Admin-Region-Arbeitsraum nach Nutzerabnahme der Marketing-Referenz und Issue `#495`; nicht berührte operative Zeilen behalten ihren zuletzt verifizierten Status.",
    )
    head = replace_first_available(
        head,
        (
            "- Issue `#459` hält die spätere Vereinfachung der übrigen Admin-Boards fest und bleibt bis zur Produktabnahme von `/admin/marketing` blockiert.",
            "- Issue `#459` ist nach der Nutzerabnahme der Marketing-Referenz `in_progress`; Issue `#495` / `ADMIN-REGION-OPERATING-WORKSPACE-01` ist der erste freigegebene Folge-Slice für `/admin/region`.",
        ),
        "- Issue `#459` ist nach der Nutzerabnahme der Marketing-Referenz `in_progress`; Issue `#495` / `ADMIN-REGION-OPERATING-WORKSPACE-01` ist der erste freigegebene Folge-Slice für `/admin/region`.",
    )

    block = (
        f"{SECTION_TITLE}\n\n"
        "| ID | Status | Priority | Depends on | Scope | Goal | Acceptance Criteria | Decision open | Evidence / Notes |\n"
        "|---|---|---|---|---|---|---|---|---|\n"
        f"{PARENT_ROW}\n"
        f"{REGION_ROW}\n\n"
    )
    OPEN_TASKS.write_text(head + block + HISTORY_MARKER + history, encoding="utf-8")


if __name__ == "__main__":
    main()
