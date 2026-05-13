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
    document.body.style.overflow = "hidden";
    window.setTimeout(() => {
      primaryCheckboxRef.current?.focus();
    }, 0);
    return () => {
      document.body.style.overflow = previousOverflow;
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

  const openGate = React.useCallback((mode: "notice" | "options" = "notice") => {
    setGateOpen(true);
    setOptionsOpen(mode === "options");
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
          <div className="absolute inset-0 flex items-end justify-center p-0 sm:items-center sm:p-4">
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="privacy-gate-title"
              aria-describedby="privacy-gate-description"
              className="relative w-full max-w-3xl overflow-hidden rounded-t-[2rem] border border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--card))_96%,rgb(var(--bg))_4%)] shadow-[0_28px_80px_rgba(2,6,23,0.48)] sm:rounded-[2rem]"
            >
              <div className="h-1.5 bg-[linear-gradient(90deg,rgba(34,211,238,0.86),rgba(16,185,129,0.78))]" />
              <div className="space-y-6 p-5 sm:p-7">
                <header className="space-y-3">
                  <div className="inline-flex items-center rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200 dark:text-cyan-100">
                    Datenschutz-Checkpoint
                  </div>
                  <div className="space-y-2">
                    <h2 id="privacy-gate-title" className="text-2xl font-semibold tracking-tight text-[rgb(var(--fg))] sm:text-[2rem]">
                      Bevor du startest: Datenschutz verständlich machen
                    </h2>
                    <p id="privacy-gate-description" className="max-w-2xl text-sm leading-relaxed text-[rgb(var(--muted))] sm:text-base">
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
                      <button
                        type="button"
                        className="btn btn-ghost text-sm"
                        onClick={() => {
                          setOptionsOpen((current) => !current);
                          setFormNotice(null);
                        }}
                      >
                        Optionen anpassen
                      </button>
                      <button type="button" className="btn btn-ghost text-sm" onClick={openPrivacyDossier}>
                        Datenschutz-Dossier öffnen
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
                            source: "privacy-gate",
                          });
                        }}
                      >
                        Notwendiges verstanden – weiter
                      </button>
                    </div>
                  </aside>
                </section>

                {optionsOpen ? (
                  <section className="space-y-4 rounded-[1.5rem] border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                        Optionen
                      </p>
                      <p className="text-sm text-[rgb(var(--muted))]">
                        Nichts davon ist nötig, um eDebatte zu nutzen.
                      </p>
                    </div>

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
                        onChange={(checked) => setOptionalDraft((current) => ({ ...current, externalMedia: checked }))}
                      />
                      <OptionalToggle
                        label="Produktverbesserung mit anonymisierten Signalen erlauben"
                        checked={optionalDraft.productImprovement}
                        onChange={(checked) =>
                          setOptionalDraft((current) => ({ ...current, productImprovement: checked }))
                        }
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
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
                        Nur Notwendiges nutzen
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost text-sm"
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
                  </section>
                ) : null}

                {formNotice ? (
                  <p className="rounded-2xl border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                    {formNotice}
                  </p>
                ) : null}
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
        <span className="h-6 w-11 rounded-full bg-[rgb(var(--border))] transition peer-checked:bg-[linear-gradient(90deg,rgba(34,211,238,0.86),rgba(16,185,129,0.78))]" />
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
