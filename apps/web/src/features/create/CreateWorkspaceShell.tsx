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
    "prioritiesCount" | "clustersCount" | "questionsCount" | "nextStepsCount"
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
      lead: "Dein Beitrag startet den Arbeitsstand.",
    },
    understanding: {
      title: "Verstehen",
      lead: params.isBusy ? "Ich ordne deinen Beitrag gerade …" : "Kern und Signal werden erkannt.",
    },
    topics: {
      title: "Themen ordnen",
      lead: "Themenzweige bleiben sichtbar und steuerbar.",
    },
    sources: {
      title: "Quellen prüfen",
      lead: "Hinweise und Referenzen bleiben review-first.",
    },
    draft: {
      title: "Entwurf vorbereiten",
      lead: "Speichern erst nach bewusster Entscheidung.",
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
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="mt-0.5">
            <div className="w-10">
              <VoxyAvatar appearance="inline" compact variant="miniAvatar" />
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-[rgb(var(--fg))] md:text-xl">Ein Workspace für deinen Beitrag</p>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-[rgb(var(--muted))]">
              Ich halte Eingabe, Themen, Fragen, Quellen und nächste Schritte zusammen.
            </p>
          </div>
        </div>
        <span className="rounded-full border border-cyan-300/35 bg-cyan-500/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-950 dark:border-cyan-300/25 dark:bg-cyan-500/[0.12] dark:text-cyan-100">
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
      className="overflow-x-auto rounded-[28px] border border-[rgb(var(--border))] bg-[linear-gradient(135deg,color-mix(in_oklab,rgb(var(--card))_96%,white_4%),color-mix(in_oklab,rgb(var(--card))_88%,rgb(var(--bg))_12%))] px-3 py-3 md:px-4 md:py-4"
    >
      <div className="flex min-w-max items-stretch gap-3">
        {props.stages.map((stage, index) => {
          const isActive = stage.status === "active";
          const isDone = stage.status === "done";
          return (
            <React.Fragment key={stage.id}>
              <article
                data-create-pipeline-stage={stage.id}
                data-create-pipeline-state={stage.status}
                className={`min-w-[12.5rem] rounded-[24px] border px-3 py-3 transition md:min-w-[13.75rem] md:px-4 ${
                  isActive
                    ? "border-cyan-300/55 bg-cyan-500/[0.1] shadow-[0_18px_36px_rgba(8,145,178,0.12)]"
                    : isDone
                      ? "border-emerald-300/45 bg-emerald-500/[0.08]"
                      : "border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--bg))_84%,white_16%)]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold ${
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
                    <p className="text-sm font-semibold text-[rgb(var(--fg))] md:text-[15px]">{stage.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[rgb(var(--muted))] md:text-[13px]">{stage.lead}</p>
                  </div>
                </div>
              </article>
              {index < props.stages.length - 1 ? (
                <span className="mt-7 text-base text-[rgb(var(--muted))]" aria-hidden="true">
                  →
                </span>
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
      className="mx-auto flex min-h-[75vh] w-full max-w-[80rem] flex-col rounded-[2.25rem] border border-[rgb(var(--border))] bg-[linear-gradient(180deg,color-mix(in_oklab,rgb(var(--card))_96%,white_4%),color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%))] px-3 py-3 shadow-[0_32px_80px_rgba(2,6,23,0.14)] sm:px-4 md:min-h-[76vh] md:px-5 md:py-5 xl:px-6"
    >
      <div className="flex flex-1 flex-col gap-4">
        <WorkspaceHeader notice={notice} />
        <ProgressPipeline stages={stages} />
        <div
          data-create-shell-structure-rail
          className="rounded-[28px] border border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--bg))_90%,white_10%)] px-3 py-3 md:px-4"
        >
          <CreateStructureOverview
            locale={locale}
            prioritiesCount={structureOverview.prioritiesCount}
            clustersCount={structureOverview.clustersCount}
            questionsCount={structureOverview.questionsCount}
            nextStepsCount={structureOverview.nextStepsCount}
            showOpenLabels
          />
        </div>
        <div className="flex flex-1 flex-col overflow-hidden rounded-[30px] border border-[rgb(var(--border))] bg-[rgb(var(--bg))]">
          <div
            data-create-shell-thread
            className="flex min-h-[30rem] flex-1 flex-col px-4 py-5 md:min-h-[36rem] md:px-6"
          >
            {chatThread}
          </div>
          <div
            data-create-shell-composer
            className="border-t border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--card))_66%,rgb(var(--bg))_34%)]"
          >
            {composer}
          </div>
          {footer ? (
            <div
              data-create-shell-footer
              className="border-t border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--card))_78%,rgb(var(--bg))_22%)] px-4 py-2.5 md:px-6"
            >
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
