"use client";

import * as React from "react";
import { VoxyAvatar } from "@/components/voxy/VoxyGuide";
import type { CreateAnalysisState } from "@/features/create/intelligentFollowupContract";

export type CreateWorkspaceStageId =
  | "input"
  | "understanding"
  | "topics"
  | "sources"
  | "draft";

export type CreateWorkspaceShellPhase =
  | "initial"
  | "loading"
  | "result"
  | "continuation";

type CreateWorkspaceShellProps = {
  locale: "de" | "en";
  activeStage: CreateWorkspaceStageId;
  stages?: CreateWorkspaceStage[];
  phase?: CreateWorkspaceShellPhase;
  isBusy?: boolean;
  notice?: React.ReactNode;
  chatThread: React.ReactNode;
  composer: React.ReactNode;
  footer?: React.ReactNode;
  renderSidecar?: (density: "compact" | "expanded") => React.ReactNode;
  renderMobileSidecarSummary?: (onOpen: () => void) => React.ReactNode;
  structureOverview?: {
    prioritiesCount: number;
    clustersCount: number;
    questionsCount: number;
    nextStepsCount: number;
    nextStepLabel?: string;
  };
};

export type CreateWorkspaceStageStatus = "done" | "active" | "planned" | "error" | "locked";

export type CreateWorkspaceStage = {
  id: CreateWorkspaceStageId;
  title: string;
  lead: string;
  status: CreateWorkspaceStageStatus;
};

export function buildCreateWorkspaceStages(params: {
  activeStage: CreateWorkspaceStageId;
  isBusy: boolean;
  analysisState?: CreateAnalysisState | null;
  hasValidatedTopics?: boolean;
}): CreateWorkspaceStage[] {
  const stageOrder: CreateWorkspaceStageId[] = [
    "input",
    "understanding",
    "topics",
    "sources",
    "draft",
  ];
  const analysisFailed =
    params.analysisState === "ai_failed" || params.analysisState === "fetch_failed";
  if (analysisFailed) {
    return [
      {
        id: "input",
        title: "1 · Beitrag aufgenommen",
        lead: "Text liegt im Workspace.",
        status: "done",
      },
      {
        id: "understanding",
        title: "2 · Analyse blockiert",
        lead: "Es liegen noch keine validierten Themen vor.",
        status: "error",
      },
      {
        id: "topics",
        title: "3 · Entscheidung offen",
        lead: "Wird nach erfolgreicher Analyse freigeschaltet.",
        status: "locked",
      },
      {
        id: "sources",
        title: "4 · Quellen optional",
        lead: "Bleibt bis zur validierten Analyse gesperrt.",
        status: "locked",
      },
      {
        id: "draft",
        title: "5 · Entwurf",
        lead: "Wird erst nach erfolgreicher Analyse freigeschaltet.",
        status: "locked",
      },
    ];
  }
  const labels: Record<CreateWorkspaceStageId, { title: string; lead: string }> = {
    input: {
      title: "1 · Beitrag aufgenommen",
      lead: "Text liegt im Workspace.",
    },
    understanding: {
      title: params.hasValidatedTopics ? "2 · Themen erkannt" : "2 · Analyse läuft",
      lead: params.hasValidatedTopics
        ? "Erste Themen sind sichtbar."
        : params.isBusy
          ? "Einordnung läuft."
          : "Die Einordnung wird vorbereitet.",
    },
    topics: {
      title: "3 · Entscheidung offen",
      lead: "Du wählst Fokus oder Themenstruktur.",
    },
    sources: {
      title: "4 · Quellen optional",
      lead: "Quellenmodus bleibt bewusst optional.",
    },
    draft: {
      title: "5 · Entwurf",
      lead: "Danach schärfen, speichern oder weiterführen.",
    },
  };

  const activeIndex = stageOrder.indexOf(params.activeStage);
  return stageOrder.map((stageId, index) => ({
    id: stageId,
    title: labels[stageId].title,
    lead: labels[stageId].lead,
    status: index < activeIndex ? "done" : index === activeIndex ? "active" : "planned",
  }));
}

function WorkspaceHeader(props: { notice?: React.ReactNode; compact?: boolean }) {
  return (
    <div className={props.compact ? "space-y-2.5" : "space-y-3"}>
      <div className={`flex flex-wrap items-start justify-between ${props.compact ? "gap-2.5" : "gap-3"}`}>
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 overflow-hidden rounded-full">
            <div className="origin-top-left scale-[0.82]">
              <VoxyAvatar appearance="inline" compact variant="presenting" />
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-[1.22rem] font-semibold tracking-[-0.01em] text-[rgb(var(--fg))] md:text-[1.45rem]">
              Dein Beitrag im Workspace
            </p>
            <p className={`max-w-4xl text-[14px] leading-relaxed text-[rgb(var(--muted))] md:text-[15px] ${props.compact ? "mt-1" : "mt-1.5"}`}>
              Schreib los. Ich halte Themen, Entscheidungen und nächste Schritte kompakt zusammen.
            </p>
          </div>
        </div>
        <span className="rounded-full border border-cyan-300/35 bg-cyan-500/[0.08] px-3 py-1 text-[11px] font-semibold text-cyan-950 dark:border-cyan-300/25 dark:bg-cyan-500/[0.12] dark:text-cyan-100">
          Kein Auto-Publish
        </span>
      </div>
      {props.notice ? (
        <div className={`rounded-[1.25rem] border border-cyan-500/18 bg-cyan-500/[0.06] px-4 text-[15px] leading-relaxed text-cyan-950 dark:border-cyan-300/20 dark:bg-cyan-500/12 dark:text-cyan-100 ${props.compact ? "py-2.5" : "py-3"}`}>
          {props.notice}
        </div>
      ) : null}
    </div>
  );
}

function ProgressPipeline(props: {
  stages: CreateWorkspaceStage[];
}) {
  return (
    <div
      data-create-shell-pipeline
      data-create-pipeline-rail
      className="overflow-x-auto rounded-[1.6rem] border border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--card))_94%,rgb(var(--bg))_6%)] px-3 py-3 md:px-4"
    >
      <div className="flex min-w-max items-center gap-2.5">
        {props.stages.map((stage, index) => {
          const isActive = stage.status === "active";
          const isDone = stage.status === "done";
          const isError = stage.status === "error";
          const isLocked = stage.status === "locked";
          return (
            <React.Fragment key={stage.id}>
              <article
                data-create-pipeline-stage={stage.id}
                data-create-pipeline-state={stage.status}
                className={`min-w-[10rem] rounded-full border px-3 py-2.5 transition ${
                  isActive
                    ? "border-cyan-300/60 bg-cyan-500/[0.1]"
                    : isDone
                      ? "border-emerald-300/45 bg-emerald-500/[0.08]"
                      : isError
                        ? "border-rose-300/45 bg-rose-500/[0.08]"
                        : isLocked
                          ? "border-slate-200/80 bg-slate-100/70 dark:border-[rgb(var(--border))] dark:bg-slate-900/20"
                          : "border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold ${
                      isActive
                        ? "border-cyan-300/45 text-cyan-900 dark:text-cyan-100"
                        : isDone
                          ? "border-emerald-300/45 text-emerald-900 dark:text-emerald-100"
                          : isError
                            ? "border-rose-300/45 text-rose-900 dark:text-rose-100"
                            : "border-[rgb(var(--border))] text-[rgb(var(--muted))]"
                    }`}
                  >
                    {isDone ? "✓" : isError ? "!" : index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[rgb(var(--fg))]">{stage.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-[rgb(var(--muted))]">{stage.lead}</p>
                  </div>
                </div>
              </article>
              {index < props.stages.length - 1 ? (
                <span
                  className="h-px w-4 shrink-0 bg-[linear-gradient(90deg,transparent,color-mix(in_oklab,rgb(var(--border))_72%,rgb(var(--muted))_28%),transparent)]"
                  aria-hidden="true"
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

type DesktopSidecarMode = "collapsed" | "compact" | "expanded";
type MobileSidecarMode = "compact" | "expanded";

export default function CreateWorkspaceShell({
  activeStage,
  stages,
  phase = "initial",
  isBusy = false,
  notice,
  chatThread,
  composer,
  footer,
  renderSidecar,
  renderMobileSidecarSummary,
}: CreateWorkspaceShellProps) {
  const resolvedStages = React.useMemo(
    () => stages ?? buildCreateWorkspaceStages({ activeStage, isBusy }),
    [activeStage, isBusy, stages],
  );
  const [desktopSidecarMode, setDesktopSidecarMode] =
    React.useState<DesktopSidecarMode>("compact");
  const [mobileSidecarOpen, setMobileSidecarOpen] = React.useState(false);
  const [mobileSidecarMode, setMobileSidecarMode] =
    React.useState<MobileSidecarMode>("compact");
  const mobileDialogCloseRef = React.useRef<React.ElementRef<"button"> | null>(null);
  const mobileDialogRef = React.useRef<React.ElementRef<"div"> | null>(null);
  const mobileDialogTriggerRef = React.useRef<HTMLElement | null>(null);
  const workspaceContentRef = React.useRef<React.ElementRef<"div"> | null>(null);

  const openMobileSidecar = React.useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      mobileDialogTriggerRef.current = document.activeElement;
    }
    setMobileSidecarOpen(true);
  }, []);

  const closeMobileSidecar = React.useCallback(() => {
    setMobileSidecarOpen(false);
  }, []);
  const isInitialPhase = phase === "initial";
  const isLoadingPhase = phase === "loading";
  const threadClassName = isInitialPhase
    ? "flex min-h-[13rem] flex-none flex-col overflow-y-auto px-4 py-3.5 md:min-h-[15rem] md:px-6 md:py-4 xl:px-7"
    : isLoadingPhase
      ? "flex min-h-[24rem] flex-1 flex-col overflow-y-auto px-5 py-5 md:min-h-[32rem] md:px-7 xl:px-8"
      : "flex min-h-[26rem] flex-1 flex-col overflow-y-auto px-5 py-5 md:min-h-[40rem] md:px-7 xl:px-8";
  const showDesktopSidecar = Boolean(renderSidecar);

  React.useEffect(() => {
    if (!mobileSidecarOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const workspaceContent = workspaceContentRef.current;

    document.body.style.overflow = "hidden";
    workspaceContent?.setAttribute("inert", "");
    workspaceContent?.setAttribute("aria-hidden", "true");
    mobileDialogCloseRef.current?.focus();

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMobileSidecar();
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = mobileDialogRef.current;
      if (!dialog) return;

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(
        (element) =>
          element.getAttribute("aria-hidden") !== "true" &&
          !element.hasAttribute("disabled"),
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (!activeElement || !dialog.contains(activeElement)) {
        event.preventDefault();
        (event.shiftKey ? lastElement : firstElement).focus();
        return;
      }

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      workspaceContent?.removeAttribute("inert");
      workspaceContent?.removeAttribute("aria-hidden");
      mobileDialogTriggerRef.current?.focus();
    };
  }, [closeMobileSidecar, mobileSidecarOpen]);

  return (
    <section
      data-create-workspace-shell
      data-create-shell-layout="wide"
      data-create-workspace-size="wide-screen"
      data-create-workspace-phase={phase}
      className="mx-auto flex min-h-[calc(100vh-7.5rem)] w-full max-w-[min(92vw,96rem)] flex-col rounded-[2.4rem] border border-[rgb(var(--border))] bg-[linear-gradient(180deg,color-mix(in_oklab,rgb(var(--card))_96%,white_4%),color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%))] px-3 py-3 shadow-[0_36px_96px_rgba(2,6,23,0.18)] sm:px-4 md:min-h-[calc(100vh-6rem)] md:px-5 md:py-5 xl:px-7"
    >
      <div
        ref={workspaceContentRef}
        className={`flex min-h-0 flex-1 flex-col ${isInitialPhase ? "gap-3 md:gap-3.5" : "gap-4"}`}
      >
        <WorkspaceHeader notice={notice} compact={isInitialPhase} />
        {!isInitialPhase ? <ProgressPipeline stages={resolvedStages} /> : null}
        {renderMobileSidecarSummary
          ? renderMobileSidecarSummary(openMobileSidecar)
          : null}
        <div className={`flex min-h-0 flex-1 gap-4 ${showDesktopSidecar ? "xl:grid xl:grid-cols-[minmax(0,1fr)_clamp(18rem,24vw,24rem)]" : ""}`}>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[30px] border border-[rgb(var(--border))] bg-[rgb(var(--bg))]">
            <div
              data-create-shell-thread
              data-create-thread-phase={phase}
              className={threadClassName}
            >
              {chatThread}
            </div>
            <div
              data-create-shell-composer
              className="sticky bottom-0 z-10 border-t border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--card))_74%,rgb(var(--bg))_26%)] supports-[backdrop-filter]:backdrop-blur"
            >
              {composer}
            </div>
            {footer ? (
              <div
                data-create-shell-footer
                className="border-t border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--card))_78%,rgb(var(--bg))_22%)] px-4 py-2 md:px-6"
              >
                {footer}
              </div>
            ) : null}
          </div>
          {showDesktopSidecar ? (
            <aside
              data-create-shell-sidecar
              data-create-shell-sidecar-mode={desktopSidecarMode}
              className={`hidden min-h-0 overflow-hidden rounded-[30px] border border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%)] xl:flex xl:flex-col ${
                desktopSidecarMode === "collapsed" ? "xl:w-[4.5rem]" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-[rgb(var(--border))] px-4 py-3">
                <div className={`${desktopSidecarMode === "collapsed" ? "sr-only" : "min-w-0"}`}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                    Debattenstand
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">
                    Status & Themen
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {desktopSidecarMode !== "collapsed" ? (
                    <button
                      type="button"
                      className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[11px] font-medium text-[rgb(var(--muted))]"
                      onClick={() =>
                        setDesktopSidecarMode((current) =>
                          current === "compact" ? "expanded" : "compact",
                        )
                      }
                    >
                      {desktopSidecarMode === "compact" ? "Erweitern" : "Kompakt"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[11px] font-medium text-[rgb(var(--muted))]"
                    onClick={() =>
                      setDesktopSidecarMode((current) =>
                        current === "collapsed" ? "compact" : "collapsed",
                      )
                    }
                    aria-label={
                      desktopSidecarMode === "collapsed"
                        ? "Debattenstand öffnen"
                        : "Debattenstand einklappen"
                    }
                  >
                    {desktopSidecarMode === "collapsed" ? ">" : "<"}
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {desktopSidecarMode === "collapsed" ? (
                  <div className="flex h-full items-center justify-center">
                    <button
                      type="button"
                      className="rounded-full border border-[rgb(var(--border))] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]"
                      onClick={() => setDesktopSidecarMode("compact")}
                      aria-label="Debattenstand öffnen"
                    >
                      DS
                    </button>
                  </div>
                ) : (
                  renderSidecar?.(desktopSidecarMode === "expanded" ? "expanded" : "compact")
                )}
              </div>
            </aside>
          ) : null}
        </div>
      </div>
      {renderSidecar && mobileSidecarOpen ? (
        <div
          className="fixed inset-0 z-40 xl:hidden"
          aria-hidden={false}
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/35"
            aria-label="Debattenstand schließen"
            onClick={closeMobileSidecar}
          />
          <div
            ref={mobileDialogRef}
            id="create-debattenstand-sheet"
            role="dialog"
            tabIndex={-1}
            aria-modal="true"
            aria-labelledby="create-debattenstand-sheet-title"
            data-create-debattenstand-sheet
            data-create-debattenstand-sheet-mode={mobileSidecarMode}
            className="absolute inset-x-0 bottom-0 max-h-[78vh] overflow-hidden rounded-t-[1.9rem] border border-b-0 border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-[0_-18px_48px_rgba(15,23,42,0.22)]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[rgb(var(--border))] px-4 py-3">
              <div className="min-w-0">
                <p
                  id="create-debattenstand-sheet-title"
                  className="text-sm font-semibold text-[rgb(var(--fg))]"
                >
                  Debattenstand
                </p>
                <p className="text-[12px] text-[rgb(var(--muted))]">
                  Kompakte Statusleiste mit Details im Bottom Sheet
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-full border border-[rgb(var(--border))] px-3 py-1.5 text-[11px] font-medium text-[rgb(var(--muted))]"
                  onClick={() =>
                    setMobileSidecarMode((current) =>
                      current === "compact" ? "expanded" : "compact",
                    )
                  }
                >
                  {mobileSidecarMode === "compact" ? "Erweitern" : "Kompakt"}
                </button>
                <button
                  ref={mobileDialogCloseRef}
                  type="button"
                  className="rounded-full border border-[rgb(var(--border))] px-3 py-1.5 text-[11px] font-medium text-[rgb(var(--muted))]"
                  onClick={closeMobileSidecar}
                >
                  Schließen
                </button>
              </div>
            </div>
            <div className="max-h-[calc(78vh-4.25rem)] overflow-y-auto p-4">
              {renderSidecar(mobileSidecarMode)}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
