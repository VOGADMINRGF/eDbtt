"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CONSENT_COOKIE_NAME,
  CONSENT_LOCALSTORAGE_KEY,
  LEGACY_CONSENT_COOKIE_NAME,
  PRIVACY_NOTICE_VERSION,
  buildConsentCookie,
  buildDefaultConsent,
  buildDefaultOptionalConsent,
  hasRequiredPrivacyAcknowledgement,
  normalizeConsent,
  parseConsentCookie,
  serializeConsent,
  type Consent,
  type PrivacyOptionalConsent,
} from "@/lib/privacy/consent";

type PrivacyGateContextValue = {
  consent: Consent | null;
  gateOpen: boolean;
  hasRequiredAcknowledgement: boolean;
  openGate: (mode?: "notice" | "options") => void;
  ensureActiveProcessingAllowed: (source?: string, mode?: "notice" | "options") => boolean;
};

const PrivacyGateContext = React.createContext<PrivacyGateContextValue | null>(null);

function readConsentFromBrowser(): Consent | null {
  if (typeof document === "undefined") return null;
  const entries = document.cookie.split("; ");
  const primaryRaw = entries.find((entry) => entry.startsWith(`${CONSENT_COOKIE_NAME}=`))?.split("=")[1];
  if (primaryRaw) return parseConsentCookie(primaryRaw);

  const legacyRaw = entries.find((entry) => entry.startsWith(`${LEGACY_CONSENT_COOKIE_NAME}=`))?.split("=")[1];
  if (legacyRaw) return parseConsentCookie(legacyRaw);

  if (typeof window !== "undefined") {
    const localRaw = window.localStorage.getItem(CONSENT_LOCALSTORAGE_KEY);
    return parseConsentCookie(localRaw);
  }

  return null;
}

function persistConsentLocally(consent: Consent) {
  if (typeof document !== "undefined") {
    document.cookie = buildConsentCookie(consent);
  }
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CONSENT_LOCALSTORAGE_KEY, serializeConsent(consent));
  }
}

async function persistConsentServer(consent: Consent) {
  try {
    await fetch("/api/account/consent", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(consent),
      keepalive: true,
    });
  } catch {
    // optional sync
  }
}

function buildConsentFromDraft(params: {
  previous: Consent | null;
  requiredNoticeAcknowledged: boolean;
  optional: PrivacyOptionalConsent;
  source: string;
}): Consent {
  return buildDefaultConsent({
    ...(params.previous ?? {}),
    privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
    requiredNoticeAcknowledged: params.requiredNoticeAcknowledged,
    optional: params.optional,
    timestamp: new Date().toISOString(),
    source: params.source,
  });
}

function DialogShield() {
  return (
    <>
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-[3px]" />
      <div className="absolute inset-0 bg-[radial-gradient(1200px_540px_at_50%_0%,rgba(6,182,212,0.18),transparent_62%)]" />
    </>
  );
}

const DIALOG_VIEWPORT_STYLE = {
  paddingTop: "max(env(safe-area-inset-top, 0px), 0.75rem)",
  paddingRight: "max(env(safe-area-inset-right, 0px), 0.75rem)",
  paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0.75rem)",
  paddingLeft: "max(env(safe-area-inset-left, 0px), 0.75rem)",
} satisfies React.CSSProperties;

const DIALOG_PANEL_STYLE = {
  maxHeight: "calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 1.5rem)",
} satisfies React.CSSProperties;

export function PrivacyGateProvider(props: {
  initialConsent?: Consent | null;
  initiallyOpen?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [consent, setConsent] = React.useState<Consent | null>(props.initialConsent ?? null);
  const [gateOpen, setGateOpen] = React.useState(() => Boolean(props.initiallyOpen));
  const [optionsOpen, setOptionsOpen] = React.useState(false);
  const [pendingNavigationHref, setPendingNavigationHref] = React.useState<string | null>(null);
  const [requiredChecked, setRequiredChecked] = React.useState(
    () => props.initialConsent?.requiredNoticeAcknowledged ?? false,
  );
  const [optionalDraft, setOptionalDraft] = React.useState<PrivacyOptionalConsent>(
    () => props.initialConsent?.optional ?? buildDefaultOptionalConsent(),
  );
  const [formNotice, setFormNotice] = React.useState<string | null>(null);

  const shellRef = React.useRef<HTMLDivElement | null>(null);
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const primaryCheckboxRef = React.useRef<HTMLInputElement | null>(null);
  const restoreFocusRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const browserConsent = readConsentFromBrowser();
    if (!browserConsent) return;
    setConsent(browserConsent);
    setRequiredChecked(browserConsent.requiredNoticeAcknowledged);
    setOptionalDraft(browserConsent.optional);
  }, []);

  React.useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    if (gateOpen) {
      shell.setAttribute("aria-hidden", "true");
      shell.setAttribute("inert", "");
    } else {
      shell.removeAttribute("aria-hidden");
      shell.removeAttribute("inert");
    }
  }, [gateOpen]);

  React.useEffect(() => {
    if (!gateOpen) return;
    const previousOverflow = document.body.style.overflow;
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => {
      primaryCheckboxRef.current?.focus();
    }, 0);
    return () => {
      document.body.style.overflow = previousOverflow;
      if (restoreFocusRef.current?.isConnected) {
        restoreFocusRef.current.focus();
      }
    };
  }, [gateOpen]);

  React.useEffect(() => {
    if (!gateOpen) return;
    if (pathname !== "/datenschutz-dossier" && pathname !== "/datenschutz") return;
    setGateOpen(false);
    setOptionsOpen(false);
    setPendingNavigationHref(null);
    setFormNotice(null);
  }, [gateOpen, pathname]);

  React.useEffect(() => {
    if (!gateOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (optionsOpen) setOptionsOpen(false);
        return;
      }

      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute("hidden"));
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [gateOpen, optionsOpen]);

  const openGate = React.useCallback((_mode: "notice" | "options" = "notice") => {
    setGateOpen(true);
    setOptionsOpen(false);
  }, []);

  React.useEffect(() => {
    const onClickCapture = (event: MouseEvent) => {
      if (hasRequiredPrivacyAcknowledgement(consent)) return;
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a[data-requires-privacy-gate='true']") as HTMLAnchorElement | null;
      if (!anchor?.href) return;
      event.preventDefault();
      event.stopPropagation();
      setPendingNavigationHref(anchor.href);
      openGate("notice");
    };

    document.addEventListener("click", onClickCapture, true);
    return () => document.removeEventListener("click", onClickCapture, true);
  }, [consent, openGate]);

  const commitConsent = React.useCallback(
    async (params: { requiredNoticeAcknowledged: boolean; optional: PrivacyOptionalConsent; source: string }) => {
      const next = buildConsentFromDraft({
        previous: consent,
        requiredNoticeAcknowledged: params.requiredNoticeAcknowledged,
        optional: params.optional,
        source: params.source,
      });
      persistConsentLocally(next);
      setConsent(next);
      setRequiredChecked(next.requiredNoticeAcknowledged);
      setOptionalDraft(next.optional);
      setGateOpen(!hasRequiredPrivacyAcknowledgement(next));
      setFormNotice(null);
      await persistConsentServer(next);
      if (hasRequiredPrivacyAcknowledgement(next) && pendingNavigationHref) {
        const href = pendingNavigationHref;
        setPendingNavigationHref(null);
        router.push(href as Parameters<typeof router.push>[0]);
      }
    },
    [consent, pendingNavigationHref, router],
  );

  const ensureActiveProcessingAllowed = React.useCallback(
    (_source = "interactive-action", mode: "notice" | "options" = "notice") => {
      if (hasRequiredPrivacyAcknowledgement(consent)) return true;
      setFormNotice(null);
      openGate(mode);
      return false;
    },
    [consent, openGate],
  );

  const value = React.useMemo<PrivacyGateContextValue>(
    () => ({
      consent,
      gateOpen,
      hasRequiredAcknowledgement: hasRequiredPrivacyAcknowledgement(consent),
      openGate,
      ensureActiveProcessingAllowed,
    }),
    [consent, ensureActiveProcessingAllowed, gateOpen, openGate],
  );

  const canContinue = requiredChecked;
  const openPrivacyDossier = React.useCallback(() => {
    setGateOpen(false);
    setOptionsOpen(false);
    setPendingNavigationHref(null);
    setFormNotice(null);
    router.push("/datenschutz-dossier");
  }, [router]);

  return (
    <PrivacyGateContext.Provider value={value}>
      <div ref={shellRef}>{props.children}</div>

      {gateOpen ? (
        <div className="fixed inset-0 z-[120]">
          <DialogShield />
          <div
            className="absolute inset-0 flex items-end justify-center sm:items-center"
            style={DIALOG_VIEWPORT_STYLE}
          >
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="privacy-gate-title"
              aria-describedby="privacy-gate-description"
              style={DIALOG_PANEL_STYLE}
              className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--card))_96%,rgb(var(--bg))_4%)] shadow-[0_28px_80px_rgba(2,6,23,0.48)]"
            >
              <div className="h-1.5 bg-[linear-gradient(90deg,rgba(34,211,238,0.86),rgba(16,185,129,0.78))]" />
              <div data-nosnippet="true" className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  <div className="space-y-6 p-5 pb-28 sm:p-7 sm:pb-32">
                    <header className="space-y-3">
                  <div className="inline-flex items-center rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200 dark:text-cyan-100">
                    Datenschutz-Checkpoint
                  </div>
                  <div className="space-y-2">
                    <h2
                      id="privacy-gate-title"
                      className="text-2xl font-semibold tracking-tight text-[rgb(var(--fg))] sm:text-[2rem]"
                    >
                      Bevor du startest: Datenschutz verständlich erklärt
                    </h2>
                    <p
                      id="privacy-gate-description"
                      className="max-w-2xl text-sm leading-relaxed text-[rgb(var(--muted))] sm:text-base"
                    >
                      eDebatte verarbeitet deine Eingabe, damit daraus Themen, Fragen, Quellenhinweise, mögliche Argumente oder Beteiligungsoptionen entstehen können. Dafür sind einige technische und sicherheitsbezogene Daten notwendig. Alles Weitere bleibt freiwillig.
                    </p>
                    <p className="max-w-2xl text-sm leading-relaxed text-[rgb(var(--muted))]">
                      Wir nutzen keinen Datenschutz-Dialog, der dich zu unnötiger Zustimmung drängt. Du kannst eDebatte mit den notwendigen Funktionen nutzen und optionale Dinge getrennt entscheiden.
                    </p>
                  </div>
                    </header>

                    <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                      <div className="space-y-4 rounded-[1.5rem] border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                            Notwendige Verarbeitung
                          </p>
                          <ul className="space-y-2 text-sm text-[rgb(var(--fg))]">
                            <li>Eingabe verarbeiten und in den gewünschten Arbeitsfluss überführen</li>
                            <li>Analyse, Dossier-, Faktencheck- oder Beteiligungsschritte technisch ausführen</li>
                            <li>Sitzung, Missbrauchsschutz und Sicherheitsereignisse verwalten</li>
                            <li>Arbeitsstände speichern, wenn du das ausdrücklich auslöst</li>
                          </ul>
                        </div>

                        <label className="flex items-start gap-3 rounded-[1.25rem] border border-cyan-300/25 bg-cyan-500/8 px-4 py-3">
                          <input
                            ref={primaryCheckboxRef}
                            type="checkbox"
                            checked={requiredChecked}
                            onChange={(event) => setRequiredChecked(event.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-[rgb(var(--border))] bg-[rgb(var(--card))] text-cyan-500 focus:ring-cyan-300"
                          />
                          <span className="text-sm leading-relaxed text-[rgb(var(--fg))]">
                            Ich habe verstanden, wie eDebatte meine Eingabe für den gewünschten Dienst verarbeitet.
                          </span>
                        </label>

                        <p className="text-xs text-[rgb(var(--muted))]">
                          Mehr dazu im Datenschutz-Dossier: Wie eDebatte mit Eingaben, KI und Beteiligung umgeht.
                        </p>
                      </div>

                      <aside className="space-y-4 rounded-[1.5rem] border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                            Optionale Verarbeitung
                          </p>
                          <p className="text-sm text-[rgb(var(--muted))]">
                            Komfort, Statistik, externe Medien und Produktverbesserung bleiben freiwillig und sind standardmäßig deaktiviert.
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button type="button" className="btn btn-ghost text-sm" onClick={openPrivacyDossier}>
                            Datenschutz-Dossier öffnen
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost text-sm"
                            onClick={() => {
                              setOptionsOpen((current) => !current);
                              setFormNotice(null);
                            }}
                          >
                            {optionsOpen ? "Optionen ausblenden" : "Freiwillige Optionen"}
                          </button>
                        </div>
                      </aside>
                    </section>

                    <section className="space-y-4 rounded-[1.5rem] border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                          Freiwillige Optionen
                        </p>
                        <p className="text-sm text-[rgb(var(--muted))]">
                          Nichts davon ist nötig, um eDebatte zu nutzen.
                        </p>
                      </div>

                      {optionsOpen ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <OptionalToggle
                            label="Komfortfunktionen erlauben"
                            checked={optionalDraft.comfort}
                            onChange={(checked) => setOptionalDraft((current) => ({ ...current, comfort: checked }))}
                          />
                          <OptionalToggle
                            label="Anonyme Nutzungsstatistik erlauben"
                            checked={optionalDraft.analytics}
                            onChange={(checked) => setOptionalDraft((current) => ({ ...current, analytics: checked }))}
                          />
                          <OptionalToggle
                            label="Externe Medien erst nach Freigabe laden"
                            checked={optionalDraft.externalMedia}
                            onChange={(checked) =>
                              setOptionalDraft((current) => ({ ...current, externalMedia: checked }))
                            }
                          />
                          <OptionalToggle
                            label="Produktverbesserung mit anonymisierten Signalen erlauben"
                            checked={optionalDraft.productImprovement}
                            onChange={(checked) =>
                              setOptionalDraft((current) => ({ ...current, productImprovement: checked }))
                            }
                          />
                        </div>
                      ) : (
                        <p className="rounded-[1.15rem] border border-dashed border-[rgb(var(--border))] px-4 py-3 text-sm text-[rgb(var(--muted))]">
                          Optionales bleibt ausgeschaltet, bis du es hier bewusst aktivierst.
                        </p>
                      )}
                    </section>

                    {formNotice ? (
                      <p className="rounded-2xl border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                        {formNotice}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="sticky bottom-0 shrink-0 border-t border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--card))_96%,rgb(var(--bg))_4%)] px-5 py-4 shadow-[0_-16px_32px_rgba(2,6,23,0.18)] backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_oklab,rgb(var(--card))_88%,transparent)] sm:px-7">
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <button
                        type="button"
                        className="btn btn-ghost text-sm"
                        onClick={() => {
                          const nextOptional = buildDefaultOptionalConsent();
                          setOptionalDraft(nextOptional);
                          if (!canContinue) {
                            setFormNotice("Bitte bestätige zuerst die notwendige Datenschutz-Kenntnisnahme.");
                            return;
                          }
                          void commitConsent({
                            requiredNoticeAcknowledged: true,
                            optional: nextOptional,
                            source: "privacy-gate-necessary-only",
                          });
                        }}
                      >
                        Nur notwendige Funktionen
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary text-sm"
                        onClick={() => {
                          if (!canContinue) {
                            setFormNotice("Bitte bestätige zuerst die notwendige Datenschutz-Kenntnisnahme.");
                            return;
                          }
                          void commitConsent({
                            requiredNoticeAcknowledged: true,
                            optional: optionalDraft,
                            source: "privacy-gate-custom",
                          });
                        }}
                      >
                        Auswahl speichern
                      </button>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost text-sm"
                      onClick={() => {
                        const nextOptional = {
                          comfort: true,
                          analytics: true,
                          externalMedia: true,
                          productImprovement: true,
                        } satisfies PrivacyOptionalConsent;
                        setOptionalDraft(nextOptional);
                        if (!canContinue) {
                          setFormNotice("Bitte bestätige zuerst die notwendige Datenschutz-Kenntnisnahme.");
                          return;
                        }
                        void commitConsent({
                          requiredNoticeAcknowledged: true,
                          optional: nextOptional,
                          source: "privacy-gate-all-optional",
                        });
                      }}
                    >
                      Optionale Funktionen erlauben
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </PrivacyGateContext.Provider>
  );
}

function OptionalToggle(props: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-[1.15rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
      <span className="text-sm leading-relaxed text-[rgb(var(--fg))]">{props.label}</span>
      <span className="relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center">
        <input
          type="checkbox"
          checked={props.checked}
          onChange={(event) => props.onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span className="h-6 w-11 rounded-full bg-[rgb(var(--border))] transition peer-focus-visible:ring-2 peer-focus-visible:ring-sky-200 peer-checked:bg-[linear-gradient(90deg,rgba(34,211,238,0.86),rgba(16,185,129,0.78))]" />
        <span className="pointer-events-none absolute left-1 top-1 h-4 w-4 rounded-full bg-[rgb(var(--card))] shadow-sm transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export function usePrivacyGate() {
  const context = React.useContext(PrivacyGateContext);
  if (!context) {
    return {
      consent: null,
      gateOpen: false,
      hasRequiredAcknowledgement: false,
      openGate: () => {},
      ensureActiveProcessingAllowed: () => true,
    } satisfies PrivacyGateContextValue;
  }
  return context;
}
