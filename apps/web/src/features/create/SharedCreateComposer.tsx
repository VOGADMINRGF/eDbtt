"use client";

import * as React from "react";
import Link from "next/link";
import type { CreateProductMode } from "@/features/create/createProductModes";
import type { CreateIntent } from "@/features/create/intents";
import type {
  CreateComposerTexts,
  CreateComposerHeadlineText,
  CreateContextAnchorDefinition,
  CreateHelperLinkDefinition,
  CreateSurfaceModeDefinition,
} from "@/features/create/createSurfaceConfig";
import EntryHeroHeading from "@/components/surfaces/EntryHeroHeading";

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((ev: unknown) => void) | null;
  onerror: ((ev: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

type SpeechWindow = typeof globalThis & {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
};

const MAX_FILES = 5;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_BYTES = 20 * 1024 * 1024;
const FILE_ACCEPT =
  ".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp,.heic,.mp3,.m4a,.wav,.mp4,.mov";

function IconPaperclip() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
      <path
        d="M21.44 11.05 12.95 19.54a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 1 1 5.66 5.66l-9.19 9.19a2 2 0 1 1-2.83-2.83l8.49-8.49"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMic() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
      <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z" strokeWidth="2" strokeLinecap="round" />
      <path d="M19 11a7 7 0 0 1-14 0" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 18v3" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 21h8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconCompose() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
      <path
        d="M4 20h4l10-10a2 2 0 0 0-4-4L4 16v4Z"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13.5 6.5 17.5 10.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const CREATE_COMPOSER_STAGES = [
  {
    title: "Eingabe",
    lead: "Du beschreibst den Kern.",
  },
  {
    title: "Einordnung",
    lead: "eDebatte erkennt Signale.",
  },
  {
    title: "Vorschlag",
    lead: "Ein Arbeitsstand wird gezeigt.",
  },
  {
    title: "Bestätigung",
    lead: "Du entscheidest den nächsten Schritt.",
  },
] as const;

function CreateComposerSceneRail() {
  return (
    <div className="rounded-[26px] border border-[rgb(var(--border))] bg-[linear-gradient(180deg,rgba(11,21,42,0.96),rgba(13,24,46,0.92))] px-4 py-4 shadow-[0_18px_36px_rgba(2,6,23,0.18)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200/75">Geführter Ablauf</p>
          <p className="mt-1 text-sm font-semibold text-white">Vom ersten Signal bis zur nächsten Aktion</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-slate-300">
          Dialogisch geführt
        </span>
      </div>
      <div className="mt-4 overflow-x-auto pb-1">
        <div className="flex min-w-max items-center gap-3">
          {CREATE_COMPOSER_STAGES.map((stage, index) => (
            <React.Fragment key={stage.title}>
              <div className="flex min-w-[9rem] items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2.5 transition-all duration-300 ease-out">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-cyan-300/35 text-[11px] font-semibold text-cyan-200">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{stage.title}</p>
                  <p className="text-[11px] leading-relaxed text-slate-400">{stage.lead}</p>
                </div>
              </div>
              {index < CREATE_COMPOSER_STAGES.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="h-px w-8 shrink-0 bg-gradient-to-r from-cyan-400/40 to-emerald-300/25"
                />
              ) : null}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

export type SharedCreateComposerProps = {
  badge: string;
  subline: string;
  texts: CreateComposerTexts;
  topMeta?: React.ReactNode;
  modeOrder: readonly CreateProductMode[];
  modeDefinitions: Record<CreateProductMode, CreateSurfaceModeDefinition>;
  activeMode: CreateProductMode;
  onModeChange: (mode: CreateProductMode) => void;
  helperText: string;
  inputId: string;
  inputLabel?: string;
  inputValue: string;
  inputPlaceholder: string;
  onInputChange: (value: string) => void;
  onStart: () => void;
  startLabel: string;
  startDisabled?: boolean;
  startBusy?: boolean;
  startBusyLabel?: string;
  secondaryAction: {
    href: string;
    label: string;
  };
  contextAnchors: readonly CreateContextAnchorDefinition[];
  activeContextAnchorId: CreateIntent | null;
  onContextAnchorSelect: (id: CreateIntent) => void;
  activeContextAnchorLead?: string | null;
  helperLinks: readonly CreateHelperLinkDefinition[];
  error?: string | null;
  contextBanner?: React.ReactNode;
  allowVoice?: boolean;
  onAttachmentsChange?: (files: File[]) => void;
  minRows?: number;
  heroTone?: "calm" | "lively";
  heroHeadlineOverride?: CreateComposerHeadlineText;
  heroSublineOverride?: string;
  heroBadgeOverride?: string;
  collapseModeSelector?: boolean;
  embeddedWorkspace?: boolean;
  experienceVariant?: "standard" | "create_minimal";
  minimalHeading?: string;
  minimalLead?: string;
};

export default function SharedCreateComposer({
  badge,
  subline,
  texts,
  topMeta,
  modeOrder,
  modeDefinitions,
  activeMode,
  onModeChange,
  helperText,
  inputId,
  inputLabel,
  inputValue,
  inputPlaceholder,
  onInputChange,
  onStart,
  startLabel,
  startDisabled = false,
  startBusy = false,
  startBusyLabel,
  secondaryAction,
  error,
  contextBanner,
  allowVoice = true,
  onAttachmentsChange,
  minRows = 9,
  heroTone = "calm",
  heroHeadlineOverride,
  heroSublineOverride,
  heroBadgeOverride,
  collapseModeSelector = false,
  embeddedWorkspace = false,
  experienceVariant = "standard",
  minimalHeading,
  minimalLead,
}: SharedCreateComposerProps) {
  const [attachments, setAttachments] = React.useState<File[]>([]);
  const [attachmentsError, setAttachmentsError] = React.useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = React.useState(false);
  const [voiceActive, setVoiceActive] = React.useState(false);
  const [voiceError, setVoiceError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<React.ElementRef<"input"> | null>(null);
  const speechRef = React.useRef<SpeechRecognitionLike | null>(null);
  const compactMetaMode = embeddedWorkspace && collapseModeSelector;
  const isMinimalCreate = experienceVariant === "create_minimal";
  const isEnglishMinimal = isMinimalCreate && (minimalHeading?.toLowerCase().includes("what would you like") ?? false);
  const resolvedPlaceholder = isMinimalCreate
    ? isEnglishMinimal
      ? "Describe your topic, idea, or proposed solution..."
      : "Beschreibe dein Thema, deine Idee oder deinen Lösungsansatz..."
    : inputPlaceholder;
  const characterCount = inputValue.trim().length;

  React.useEffect(() => {
    if (!allowVoice) {
      setSpeechSupported(false);
      return;
    }
    try {
      const speechWindow = window as SpeechWindow;
      setSpeechSupported(Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition));
    } catch {
      setSpeechSupported(false);
    }
  }, [allowVoice]);

  const setAttachmentState = React.useCallback(
    (nextFiles: File[], nextError: string | null) => {
      setAttachments(nextFiles);
      setAttachmentsError(nextError);
      onAttachmentsChange?.(nextFiles);
    },
    [onAttachmentsChange],
  );

  const handleFilesChange = React.useCallback(
    (event: React.ChangeEvent<React.ElementRef<"input">>) => {
      const nextFiles = Array.from(event.target.files ?? []);

      if (nextFiles.length > MAX_FILES) {
        setAttachmentState([], texts.attachmentsTooMany(MAX_FILES));
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const totalBytes = nextFiles.reduce((sum, file) => sum + file.size, 0);
      if (totalBytes > MAX_TOTAL_BYTES) {
        setAttachmentState([], texts.attachmentsTooLarge);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const tooLarge = nextFiles.find((file) => file.size > MAX_FILE_BYTES);
      if (tooLarge) {
        setAttachmentState([], texts.attachmentFileTooLarge(tooLarge.name));
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setAttachmentState(nextFiles, null);
    },
    [
      setAttachmentState,
      texts.attachmentFileTooLarge,
      texts.attachmentsTooLarge,
      texts.attachmentsTooMany,
    ],
  );

  const stopVoice = React.useCallback(() => {
    try {
      speechRef.current?.stop();
    } catch {
      // ignore stop errors
    }
    speechRef.current = null;
    setVoiceActive(false);
  }, []);

  const toggleVoice = React.useCallback(() => {
    if (!speechSupported) {
      setVoiceError(texts.voiceUnsupported);
      return;
    }

    if (voiceActive) {
      stopVoice();
      return;
    }

    const speechWindow = window as SpeechWindow;
    const Ctor = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Ctor) {
      setVoiceError(texts.voiceUnsupported);
      return;
    }

    setVoiceError(null);
    const recognizer = new Ctor();
    recognizer.lang = "de-DE";
    recognizer.interimResults = true;
    recognizer.continuous = false;

    recognizer.onresult = (event: unknown) => {
      try {
        const results = (
          event as {
            results?: ArrayLike<{ isFinal?: boolean; 0?: { transcript?: string } }>;
          }
        )?.results;
        if (!results) return;
        let transcript = "";
        for (let idx = 0; idx < results.length; idx += 1) {
          const result = results[idx];
          if (result?.isFinal && result?.[0]?.transcript) {
            transcript += String(result[0].transcript);
          }
        }
        const normalized = transcript.trim();
        if (!normalized) return;
        const base = inputValue.trim();
        onInputChange(base ? `${base} ${normalized}` : normalized);
      } catch {
        // ignore transcription parsing errors
      }
    };

    recognizer.onerror = () => {
      setVoiceError(texts.voiceFailed);
      setVoiceActive(false);
      speechRef.current = null;
    };

    recognizer.onend = () => {
      setVoiceActive(false);
      speechRef.current = null;
    };

    try {
      speechRef.current = recognizer;
      setVoiceActive(true);
      recognizer.start();
    } catch {
      setVoiceError(texts.voiceFailed);
      setVoiceActive(false);
      speechRef.current = null;
    }
  }, [inputValue, onInputChange, speechSupported, stopVoice, texts.voiceFailed, texts.voiceUnsupported, voiceActive]);

  React.useEffect(() => {
    return () => {
      stopVoice();
    };
  }, [stopVoice]);

  const renderModeChip = React.useCallback(
    (modeOption: CreateProductMode) => {
      const modeConfig = modeDefinitions[modeOption];
      const isActive = modeOption === activeMode;
      return (
        <button
          key={modeOption}
          type="button"
          onClick={() => onModeChange(modeOption)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
            isActive
              ? "border-[rgb(var(--grad-from))]/45 bg-[rgb(var(--card))] text-[rgb(var(--fg))] shadow-sm"
              : "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--muted))] hover:border-[rgb(var(--grad-from))]/35 hover:text-[rgb(var(--fg))]"
          }`}
          aria-pressed={isActive}
          aria-selected={isActive}
          title={modeConfig.description}
        >
          {modeConfig.label}
        </button>
      );
    },
    [activeMode, modeDefinitions, onModeChange],
  );

  return (
    <section
      className={
        embeddedWorkspace
          ? "rounded-2xl bg-transparent p-0"
          : "rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-[0_24px_64px_rgba(2,6,23,0.18)] sm:p-6 md:p-9 lg:p-10"
      }
    >
      <div
        className={
          embeddedWorkspace
            ? `mx-auto w-full ${isMinimalCreate ? "max-w-[430px] md:max-w-4xl xl:max-w-[58rem]" : "max-w-5xl"} ${compactMetaMode ? "space-y-4 md:space-y-6" : "space-y-6 md:space-y-7"}`
            : "mx-auto w-full max-w-5xl space-y-6 md:space-y-7"
        }
      >
        {isMinimalCreate ? (
          <div className="space-y-2">
            {topMeta}
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
              {badge}
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-[rgb(var(--fg))] sm:text-xl">
              {minimalHeading ?? "Was möchtest du einbringen?"}
            </h2>
            {minimalLead ? (
              <p className="max-w-2xl text-sm leading-relaxed text-[rgb(var(--muted))]">{minimalLead}</p>
            ) : null}
          </div>
        ) : (
          <>
            <EntryHeroHeading
              badge={heroBadgeOverride ?? badge}
              headline={heroHeadlineOverride ?? texts.headline}
              subline={heroSublineOverride ?? subline}
              tone={heroTone}
              topMeta={topMeta}
              headingTag="h2"
            />

            <CreateComposerSceneRail />

            <div className={`space-y-3 rounded-2xl border border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%)] px-4 py-4`}>
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                  {collapseModeSelector ? "Arbeitsweg optional" : texts.modeSwitchAriaLabel}
                </p>
                <p className={`max-w-3xl leading-relaxed text-[rgb(var(--muted))] ${compactMetaMode ? "text-xs sm:text-sm" : "text-sm"}`}>{helperText}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2" aria-label={texts.modeSwitchAriaLabel}>
                {modeOrder.map(renderModeChip)}
              </div>
            </div>
          </>
        )}

        {contextBanner}

        <div className={`space-y-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] ${isMinimalCreate ? "overflow-x-hidden" : ""}`}>
          <div className={`${isMinimalCreate ? "rounded-[30px] bg-[linear-gradient(135deg,rgba(34,211,238,0.34),rgba(59,130,246,0.22),rgba(148,163,184,0.12))] p-[1px] shadow-[0_24px_56px_rgba(2,6,23,0.22)]" : "rounded-2xl bg-[linear-gradient(135deg,rgba(26,140,255,0.36),rgba(139,92,246,0.24),rgba(24,207,200,0.34))] p-[1px] shadow-[0_14px_30px_rgba(2,6,23,0.13)]"}`}>
            <div className={`${isMinimalCreate ? "rounded-[30px] bg-[linear-gradient(180deg,rgba(9,20,42,0.98),rgba(12,26,48,0.95))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" : "rounded-2xl bg-[color-mix(in_oklab,rgb(var(--card))_94%,rgb(var(--bg))_6%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"}`}>
              <div className={`flex items-start justify-between gap-3 ${isMinimalCreate ? "border-b border-white/10 px-4 py-4 sm:px-5" : "border-b border-[rgb(var(--border))] px-4 py-3 sm:px-5"}`}>
                {isMinimalCreate ? (
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/35 bg-cyan-500/[0.12] text-cyan-100 shadow-[0_10px_30px_rgba(34,211,238,0.16)]">
                      <IconCompose />
                    </span>
                    <div className="min-w-0">
                      <p className="text-lg font-semibold text-white sm:text-[1.4rem]">
                        {isEnglishMinimal ? "Write your contribution" : "Deinen Beitrag verfassen"}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-300">
                        {isEnglishMinimal ? "Structured. Clear. Effective." : "Strukturiert. Verständlich. Wirkungsvoll."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                      Dein Arbeitsraum
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">
                      Beschreibe, was geklärt werden soll
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className={`hidden rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline-flex ${isMinimalCreate ? "border border-white/10 bg-white/[0.03] text-slate-300" : "border border-[rgb(var(--border))] text-[rgb(var(--muted))]"}`}>
                    {isEnglishMinimal ? "Not published yet" : "Noch nicht veröffentlicht"}
                  </span>
                  {isMinimalCreate ? (
                    <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-1 h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M7 4.5 13 10l-6 5.5" />
                    </svg>
                  ) : null}
                </div>
              </div>
              <label className="sr-only" htmlFor={inputId}>
                {inputLabel ?? texts.inputLabel}
              </label>
              {isMinimalCreate ? (
                <div className="px-4 pt-4 sm:px-5">
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <textarea
                      id={inputId}
                      value={inputValue}
                      onChange={(event) => onInputChange(event.target.value)}
                      rows={minRows}
                      className="min-h-[210px] w-full resize-y border-0 bg-transparent px-4 py-4 text-base leading-relaxed text-white outline-none shadow-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-cyan-300 sm:min-h-[250px] sm:px-5 sm:py-5"
                      placeholder={resolvedPlaceholder}
                    />
                    <div className="border-t border-white/8 px-4 py-2 text-xs text-slate-400 sm:px-5">
                      {characterCount} / 2.000
                    </div>
                  </div>
                </div>
              ) : (
                <textarea
                  id={inputId}
                  value={inputValue}
                  onChange={(event) => onInputChange(event.target.value)}
                  rows={minRows}
                  className={`w-full resize-y border-0 bg-transparent px-4 py-4 text-base leading-relaxed text-[rgb(var(--fg))] outline-none shadow-none placeholder:text-[rgb(var(--muted))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--grad-from))] sm:px-5 sm:py-5 ${compactMetaMode ? "min-h-[148px] sm:min-h-[190px]" : "min-h-[170px] sm:min-h-[220px]"}`}
                  placeholder={resolvedPlaceholder}
                />
              )}

              <div className={`flex flex-col px-4 pb-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:pb-5 ${compactMetaMode ? "gap-2.5" : "gap-3"} ${isMinimalCreate ? "pt-4" : ""}`}>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    className={`inline-flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-sm font-medium shadow-sm transition ${isMinimalCreate ? "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06] hover:text-white" : "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--muted))] hover:bg-[color-mix(in_oklab,rgb(var(--card))_85%,rgb(var(--bg))_15%)] hover:text-[rgb(var(--fg))]"}`}
                    onClick={() => fileInputRef.current?.click()}
                    aria-label={texts.attachAria}
                    title={texts.attachAria}
                  >
                    <IconPaperclip />
                    <span className="hidden sm:inline">{texts.attachLabel}</span>
                  </button>

                  <button
                    type="button"
                    className={[
                      "inline-flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-sm font-medium shadow-sm transition",
                      voiceActive
                        ? "border-[rgb(var(--grad-from))] bg-[color-mix(in_oklab,rgb(var(--grad-from))_18%,transparent)] text-[rgb(var(--grad-from))]"
                        : isMinimalCreate
                          ? "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06] hover:text-white"
                          : "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--muted))] hover:bg-[color-mix(in_oklab,rgb(var(--card))_85%,rgb(var(--bg))_15%)] hover:text-[rgb(var(--fg))]",
                      !speechSupported ? "opacity-50" : "",
                    ].join(" ")}
                    onClick={toggleVoice}
                    aria-pressed={voiceActive}
                    aria-label={voiceActive ? texts.voiceStopAria : texts.voiceStartAria}
                    title={voiceActive ? texts.voiceStopAria : texts.voiceStartAria}
                    disabled={!speechSupported}
                  >
                    <IconMic />
                    <span className="hidden sm:inline">
                      {voiceActive ? texts.voiceStopLabel : texts.voiceStartLabel}
                    </span>
                  </button>
                </div>

                <div className={`flex flex-wrap items-center ${isMinimalCreate ? "gap-2 pt-1 sm:justify-end" : "gap-3.5"}`}>
                  <button
                    type="button"
                    onClick={onStart}
                    className={`btn-primary ${isMinimalCreate ? "min-h-[50px] w-full px-4 text-sm shadow-[0_16px_36px_rgba(34,211,238,0.18)] sm:w-auto" : ""}`}
                    disabled={startBusy || startDisabled}
                    aria-busy={startBusy}
                  >
                    {startBusy ? startBusyLabel ?? startLabel : startLabel}
                  </button>
                  {secondaryAction.label ? (
                    <Link
                      href={secondaryAction.href}
                      className="text-sm text-[rgb(var(--muted))] underline underline-offset-4"
                    >
                      {secondaryAction.label}
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={FILE_ACCEPT}
            className="sr-only"
            onChange={handleFilesChange}
          />

          {attachments.length > 0 ? (
            <details className="rounded-2xl border border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%)] px-4 py-3">
              <summary className="cursor-pointer text-sm font-medium text-[rgb(var(--fg))]">
                {texts.attachmentsDisclosureLabel(attachments.length)}
              </summary>
              <p className="mt-2 text-xs text-[rgb(var(--muted))]">{texts.attachmentsSelected(attachments)}</p>
              <div className="mt-3 overflow-x-auto pb-1">
                <ul className="flex min-w-max gap-2 sm:min-w-0 sm:flex-wrap">
                  {attachments.map((file) => (
                    <li
                      key={`${file.name}-${file.size}`}
                      className={`max-w-[15rem] shrink-0 rounded-xl border px-3 py-2 sm:max-w-full ${isMinimalCreate ? "border-white/10 bg-white/[0.03]" : "border-[rgb(var(--border))] bg-[rgb(var(--card))]"}`}
                    >
                      <p className={`break-all text-xs ${isMinimalCreate ? "text-slate-200" : "text-[rgb(var(--fg))]"}`}>{file.name}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          ) : null}

          {isMinimalCreate ? (
            <details
              data-create-alternate-mode-disclosure
              className="hidden rounded-2xl border border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%)] px-4 py-3 md:block"
            >
              <summary className="cursor-pointer text-sm font-medium text-[rgb(var(--fg))]">
                {texts.alternateModeLabel}
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">{texts.alternateModeLead}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2" aria-label={texts.modeSwitchAriaLabel}>
                {modeOrder.map(renderModeChip)}
              </div>
            </details>
          ) : null}

          {attachmentsError ? (
            <p className="text-xs text-rose-700 dark:text-rose-300" role="alert">
              {attachmentsError}
            </p>
          ) : null}

          {voiceError ? (
            <p className="text-xs text-rose-700 dark:text-rose-300" role="alert">
              {voiceError}
            </p>
          ) : null}

          {error ? <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}
