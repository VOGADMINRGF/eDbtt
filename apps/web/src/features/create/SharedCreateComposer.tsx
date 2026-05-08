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
  contextAnchors,
  activeContextAnchorId,
  onContextAnchorSelect,
  activeContextAnchorLead,
  helperLinks,
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
}: SharedCreateComposerProps) {
  const [attachments, setAttachments] = React.useState<File[]>([]);
  const [attachmentsError, setAttachmentsError] = React.useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = React.useState(false);
  const [voiceActive, setVoiceActive] = React.useState(false);
  const [voiceError, setVoiceError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<React.ElementRef<"input"> | null>(null);
  const speechRef = React.useRef<SpeechRecognitionLike | null>(null);

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
            ? "mx-auto w-full max-w-6xl space-y-6 md:space-y-7"
            : "mx-auto w-full max-w-5xl space-y-6 md:space-y-7"
        }
      >
        <EntryHeroHeading
          badge={heroBadgeOverride ?? badge}
          headline={heroHeadlineOverride ?? texts.headline}
          subline={heroSublineOverride ?? subline}
          tone={heroTone}
          topMeta={topMeta}
          headingTag="h2"
        />

        <div className="space-y-3">
          {collapseModeSelector ? (
            <details className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3">
              <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                Arbeitsweg wählen (optional)
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">
                Ohne Auswahl startet eDebatte mit dem Standardfluss für Beiträge. Du kannst jederzeit zu Prüfen oder Entwerfen wechseln.
              </p>
              <div aria-label={texts.modeSwitchAriaLabel} className="mt-3 grid gap-2 md:grid-cols-3">
                {modeOrder.map((modeOption) => {
                  const modeConfig = modeDefinitions[modeOption];
                  const isActive = modeOption === activeMode;
                  return (
                    <button
                      key={modeOption}
                      type="button"
                      onClick={() => onModeChange(modeOption)}
                      className={`rounded-2xl border px-3 py-2 text-left transition ${
                        isActive
                          ? "border-[rgb(var(--grad-from))]/45 bg-[rgb(var(--card))] text-[rgb(var(--fg))] shadow-sm"
                          : "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))] hover:border-[rgb(var(--grad-from))]/35"
                      }`}
                      aria-pressed={isActive}
                      aria-selected={isActive}
                    >
                      <span className="block text-sm font-semibold">{modeConfig.label}</span>
                      <span
                        className={`mt-1 block text-xs leading-relaxed ${
                          isActive ? "text-[rgb(var(--fg))]" : "text-[rgb(var(--muted))]"
                        }`}
                      >
                        {modeConfig.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </details>
          ) : (
            <div aria-label={texts.modeSwitchAriaLabel} className="grid gap-2 md:grid-cols-3">
              {modeOrder.map((modeOption) => {
                const modeConfig = modeDefinitions[modeOption];
                const isActive = modeOption === activeMode;
                return (
                  <button
                    key={modeOption}
                    type="button"
                    onClick={() => onModeChange(modeOption)}
                    className={`rounded-2xl border px-3 py-2 text-left transition ${
                      isActive
                        ? "border-[rgb(var(--grad-from))]/45 bg-[rgb(var(--card))] text-[rgb(var(--fg))] shadow-sm"
                        : "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))] hover:border-[rgb(var(--grad-from))]/35"
                    }`}
                    aria-pressed={isActive}
                    aria-selected={isActive}
                  >
                    <span className="block text-sm font-semibold">{modeConfig.label}</span>
                    <span
                      className={`mt-1 block text-xs leading-relaxed ${
                        isActive ? "text-[rgb(var(--fg))]" : "text-[rgb(var(--muted))]"
                      }`}
                    >
                      {modeConfig.description}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          <p className="max-w-2xl text-sm leading-relaxed text-[rgb(var(--muted))]">{helperText}</p>
        </div>

        {contextBanner}

        <div className="space-y-4">
          <div className="rounded-2xl bg-[linear-gradient(135deg,rgba(26,140,255,0.36),rgba(139,92,246,0.24),rgba(24,207,200,0.34))] p-[1px] shadow-[0_14px_30px_rgba(2,6,23,0.13)]">
            <div className="rounded-2xl bg-[color-mix(in_oklab,rgb(var(--card))_94%,rgb(var(--bg))_6%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
              <label className="sr-only" htmlFor={inputId}>
                {inputLabel ?? texts.inputLabel}
              </label>
              <textarea
                id={inputId}
                value={inputValue}
                onChange={(event) => onInputChange(event.target.value)}
                rows={minRows}
                className="w-full min-h-[170px] resize-y border-0 bg-transparent px-4 py-4 text-base leading-relaxed text-[rgb(var(--fg))] outline-none shadow-none placeholder:text-[rgb(var(--muted))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--grad-from))] sm:min-h-[220px] sm:px-5 sm:py-5"
                placeholder={inputPlaceholder}
              />

              <div className="flex flex-col gap-3 px-4 pb-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:pb-5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-medium text-[rgb(var(--muted))] shadow-sm transition hover:bg-[color-mix(in_oklab,rgb(var(--card))_85%,rgb(var(--bg))_15%)] hover:text-[rgb(var(--fg))]"
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

                <div className="flex flex-wrap items-center gap-3.5">
                  <button
                    type="button"
                    onClick={onStart}
                    className="btn-primary"
                    disabled={startBusy || startDisabled}
                    aria-busy={startBusy}
                  >
                    {startBusy ? startBusyLabel ?? startLabel : startLabel}
                  </button>
                  <Link
                    href={secondaryAction.href}
                    className="text-sm text-[rgb(var(--muted))] underline underline-offset-4"
                  >
                    {secondaryAction.label}
                  </Link>
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
            <p className="text-xs text-[rgb(var(--muted))]">
              {texts.attachmentsSelected(attachments)}
            </p>
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

          {contextAnchors.length > 0 ? (
            <details className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3">
              <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                {texts.contextEntryTitle}
              </summary>
              <div className="mt-2 flex flex-wrap gap-2">
                {contextAnchors.map((anchor) => {
                  const isActive = activeContextAnchorId === anchor.id;
                  return (
                    <button
                      key={anchor.id}
                      type="button"
                      className={`rounded-full border px-3 py-1.5 text-xs transition ${
                        isActive
                          ? "border-[rgb(var(--grad-from))] bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
                          : "border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:border-[rgb(var(--grad-from))]/45 hover:text-[rgb(var(--fg))]"
                      }`}
                      onClick={() => onContextAnchorSelect(anchor.id)}
                      aria-pressed={isActive}
                    >
                      {anchor.label}
                    </button>
                  );
                })}
              </div>
              {activeContextAnchorLead ? (
                <p className="mt-2 text-xs leading-relaxed text-[rgb(var(--muted))]">{activeContextAnchorLead}</p>
              ) : null}
            </details>
          ) : null}

          {helperLinks.length > 0 ? (
            <details className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3">
              <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                {texts.orientationTitle}
              </summary>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[rgb(var(--muted))]">
                {helperLinks.map((helperLink) => (
                  <Link
                    key={helperLink.href}
                    href={helperLink.href}
                    className="underline decoration-dotted underline-offset-4 hover:text-[rgb(var(--fg))]"
                  >
                    {helperLink.label}
                  </Link>
                ))}
              </div>
            </details>
          ) : null}

          {error ? <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}
