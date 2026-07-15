"use client";

import * as React from "react";
import { VoxyAvatar } from "@/components/voxy/VoxyGuide";
import {
  CreateStructureOverview,
  type CreateStructureOverviewProps,
} from "@/features/create/CreateVisualFollowup";

export type CreateWorkspaceStageId =
  | "input"
  | "understanding"
  | "topics"
  | "sources"
  | "draft";

type CreateWorkspaceShellProps = {
  locale: "de" | "en";
  activeStage: CreateWorkspaceStageId;
  isBusy?: boolean;
  notice?: React.ReactNode;
  chatThread: React.ReactNode;
  composer: React.ReactNode;
  footer?: React.ReactNode;
  structureOverview: Pick<
    CreateStructureOverviewProps,
    "prioritiesCount" | "clustersCount" | "questionsCount" | "nextStepsCount" | "nextStepLabel"
  >;
};

type WorkspaceStageStatus = "done" | "active" | "planned";

type WorkspaceStage = {
  id: CreateWorkspaceStageId;
  title: string;
  lead: string;
  status: WorkspaceStageStatus;
};

function buildWorkspaceStages(params: {
  activeStage: CreateWorkspaceStageId;
  isBusy: boolean;
}): WorkspaceStage[] {
  const stageOrder: CreateWorkspaceStageId[] = [
    "input",
    "understanding",
    "topics",
    "sources",
    "draft",
  ];
  const labels: Record<CreateWorkspaceStageId, { title: string; lead: string }> = {
    input: {
      title: "Eingabe",
      lead: "Dein Beitrag gibt den Startpunkt.",
    },
    understanding: {
      title: "Verstehen",
      lead: params.isBusy ? "Ich ordne gerade." : "Kern und Signal werden klar.",
    },
    topics: {
      title: "Themen ordnen",
      lead: "Themen bleiben sichtbar.",
    },
    sources: {
      title: "Quellen prüfen",
      lead: "Hinweise bleiben optional.",
    },
    draft: {
      title: "Entwurf",
      lead: "Nur nach bewusster Entscheidung.",
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

function WorkspaceHeader(props: { notice?: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div className="flex min-w-0 items-start gap-2">
          <div className="mt-0.5">
            <div className="w-8">
              <VoxyAvatar appearance="inline" compact variant="miniAvatar" />
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-[rgb(var(--fg))] md:text-xl">Ein Workspace für deinen Beitrag</p>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-[rgb(var(--muted))] md:text-[15px]">
              Ich halte Eingabe, Themen, Fragen, Quellen und nächste Schritte zusammen.
            </p>
          </div>
        </div>
        <span className="rounded-full border border-cyan-300/35 bg-cyan-500/[0.08] px-2.5 py-1 text-[10px] font-semibold text-cyan-950 dark:border-cyan-300/25 dark:bg-cyan-500/[0.12] dark:text-cyan-100">
          Kein Auto-Publish
        </span>
      </div>
      {props.notice ? (
        <div className="rounded-2xl border border-cyan-500/18 bg-cyan-500/[0.06] px-3 py-2 text-sm leading-relaxed text-cyan-950 dark:border-cyan-300/20 dark:bg-cyan-500/12 dark:text-cyan-100">
          {props.notice}
        </div>
      ) : null}
    </div>
  );
}

function ProgressPipeline(props: {
  stages: WorkspaceStage[];
}) {
  return (
    <div
      data-create-shell-pipeline
      data-create-pipeline-rail
      className="overflow-x-auto rounded-[32px] border border-[rgb(var(--border))] bg-[linear-gradient(135deg,color-mix(in_oklab,rgb(var(--card))_96%,white_4%),color-mix(in_oklab,rgb(var(--card))_88%,rgb(var(--bg))_12%))] px-4 py-4 md:px-5 md:py-4.5"
    >
      <div className="flex min-w-max items-center gap-3">
        {props.stages.map((stage, index) => {
          const isActive = stage.status === "active";
          const isDone = stage.status === "done";
          return (
            <React.Fragment key={stage.id}>
              <article
                data-create-pipeline-stage={stage.id}
                data-create-pipeline-state={stage.status}
                className={`min-w-[13.75rem] rounded-[26px] border px-4 py-3.5 transition md:min-w-[15rem] md:px-5 ${
                  isActive
                    ? "border-cyan-300/55 bg-cyan-500/[0.1] shadow-[0_18px_36px_rgba(8,145,178,0.12)]"
                    : isDone
                      ? "border-emerald-300/45 bg-emerald-500/[0.08]"
                      : "border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--bg))_84%,white_16%)]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${
                      isActive
                        ? "border-cyan-300/45 text-cyan-900 dark:text-cyan-100"
                        : isDone
                          ? "border-emerald-300/45 text-emerald-900 dark:text-emerald-100"
                          : "border-[rgb(var(--border))] text-[rgb(var(--muted))]"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-[rgb(var(--fg))] md:text-base">{stage.title}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-[rgb(var(--muted))]">{stage.lead}</p>
                  </div>
                </div>
              </article>
              {index < props.stages.length - 1 ? (
                <span
                  className="h-px w-6 shrink-0 bg-[linear-gradient(90deg,transparent,color-mix(in_oklab,rgb(var(--border))_72%,rgb(var(--muted))_28%),transparent)]"
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

export default function CreateWorkspaceShell({
  locale,
  activeStage,
  isBusy = false,
  notice,
  chatThread,
  composer,
  footer,
  structureOverview,
}: CreateWorkspaceShellProps) {
  const stages = React.useMemo(
    () => buildWorkspaceStages({ activeStage, isBusy }),
    [activeStage, isBusy],
  );

  return (
    <section
      data-create-workspace-shell
      data-create-shell-layout="wide"
      data-create-workspace-size="wide-screen"
      className="mx-auto flex min-h-[calc(100vh-7.5rem)] w-full max-w-[min(92vw,96rem)] flex-col rounded-[2.4rem] border border-[rgb(var(--border))] bg-[linear-gradient(180deg,color-mix(in_oklab,rgb(var(--card))_96%,white_4%),color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%))] px-3 py-3 shadow-[0_36px_96px_rgba(2,6,23,0.18)] sm:px-4 md:min-h-[calc(100vh-6rem)] md:px-5 md:py-5 xl:px-7"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <WorkspaceHeader notice={notice} />
        <ProgressPipeline stages={stages} />
        <div
          data-create-shell-structure-rail
          className="rounded-[30px] border border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--bg))_90%,white_10%)] px-4 py-4 md:px-5"
        >
          <CreateStructureOverview
            locale={locale}
            prioritiesCount={structureOverview.prioritiesCount}
            clustersCount={structureOverview.clustersCount}
            questionsCount={structureOverview.questionsCount}
            nextStepsCount={structureOverview.nextStepsCount}
            nextStepLabel={structureOverview.nextStepLabel}
          />
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[30px] border border-[rgb(var(--border))] bg-[rgb(var(--bg))]">
          <div
            data-create-shell-thread
            className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-5 md:min-h-[46rem] md:px-7 xl:px-8"
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
      </div>
    </section>
  );
}
