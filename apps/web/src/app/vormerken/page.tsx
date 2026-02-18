"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  PACKAGE_AUDIENCE_LABELS,
  PACKAGE_STATUS_LABELS,
  B2B_PACKAGE_IDS,
  B2G_PACKAGE_IDS,
  getPackagesByIds,
  normalizePackageId,
  PRIVATE_PACKAGE_IDS,
  type EDebattePackageId,
  type PackageStatus,
} from "@features/pricing";

const CURRENCY = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

const STATUS_CLASS: Record<PackageStatus, string> = {
  verfuegbar: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pilot: "bg-sky-50 text-sky-700 ring-sky-200",
  vormerkung: "bg-amber-50 text-amber-700 ring-amber-200",
  bald: "bg-[rgb(var(--bg))] text-[rgb(var(--muted))] ring-[rgb(var(--border))]",
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function sanitizeNext(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  if (trimmed.includes("://")) return null;
  return trimmed;
}

function withPreorderFlag(nextUrl: string) {
  if (!nextUrl.startsWith("/account")) return nextUrl;
  try {
    const url = new URL(nextUrl, "http://local");
    url.searchParams.set("preorder", "thanks");
    return `${url.pathname}${url.search}`;
  } catch {
    return nextUrl;
  }
}

function priceLabel(pkg: { preisMonat?: number; preisJahr?: number }) {
  if (pkg.preisMonat === 0) return "Kostenfrei";
  if (typeof pkg.preisMonat === "number") return `${CURRENCY.format(pkg.preisMonat)} / Monat`;
  if (typeof pkg.preisJahr === "number") return `${CURRENCY.format(pkg.preisJahr)} / Jahr`;
  return "Preis folgt";
}

/** Optionale Module (erstmal “Interesse vormerken”, nicht kaufen) */
type ModuleId = "faktencheck" | "dossier" | "textanalyse" | "streams";

const MODULES: Array<{
  id: ModuleId;
  titel: string;
  kurz: string;
  status: PackageStatus;
}> = [
  {
    id: "faktencheck",
    titel: "Faktencheck",
    kurz: "Quellenprüfung, Belege, Gegenbelege, offene Punkte – nachvollziehbar dokumentiert.",
    status: "vormerkung",
  },
  {
    id: "dossier",
    titel: "Dossier-Erstellung",
    kurz: "Thema bündeln: Behauptungen, Quellen, Fragen, Optionen, Auswirkungen – als Dossier-Ansicht.",
    status: "vormerkung",
  },
  {
    id: "textanalyse",
    titel: "Textanalyse",
    kurz: "Eingaben/Artikel strukturieren: Kernaussagen, Kategorien, Konflikte, Fragen, Lücken.",
    status: "vormerkung",
  },
  {
    id: "streams",
    titel: "Streams",
    kurz: "Einbindung von Livestreams/Protokollen: markierbar, zitierfähig, später wieder auffindbar.",
    status: "bald",
  },
];

function modulesToNoteLine(selected: ModuleId[]) {
  if (!selected.length) return null;
  const labels = selected.map((id) => MODULES.find((m) => m.id === id)?.titel ?? id);
  return `Module: ${labels.join(", ")}`;
}

function InfoCard(props: { eyebrow: string; title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{props.eyebrow}</p>
      {props.title ? <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">{props.title}</p> : null}
      <div className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">{props.children}</div>
    </div>
  );
}

function PackageGrid(props: {
  label: string;
  description: string;
  packages: any[];
  selectedId: EDebattePackageId;
  onSelect: (id: EDebattePackageId) => void;
}) {
  const { label, description, packages, selectedId, onSelect } = props;

  if (!packages.length) return null;

  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 text-sm text-[rgb(var(--muted))]">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{label}</p>
        <p className="mt-1">{description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {packages.map((pkg) => {
          const isSelected = pkg.id === selectedId;

          return (
            <div
              key={pkg.id}
              className={cx(
                "rounded-3xl p-[1px] shadow-sm",
                isSelected
                  ? "bg-[linear-gradient(135deg,rgba(14,165,233,0.8),rgba(16,185,129,0.8))]"
                  : "bg-[linear-gradient(135deg,rgba(14,165,233,0.40),rgba(16,185,129,0.40))]",
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(pkg.id)}
                className={cx(
                  "group relative w-full rounded-[22px] bg-[rgb(var(--card))] p-5 text-left transition",
                  isSelected ? "ring-2 ring-sky-100" : "hover:shadow",
                )}
                aria-pressed={isSelected}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                      {PACKAGE_AUDIENCE_LABELS[pkg.typ]}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-[rgb(var(--fg))]">{pkg.titel}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {pkg.hervorgehoben ? (
                      <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-700 ring-1 ring-sky-200">
                        Empfohlen
                      </span>
                    ) : null}
                    <span
                      className={cx(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ring-1",
                        STATUS_CLASS[pkg.status],
                      )}
                    >
                      {PACKAGE_STATUS_LABELS[pkg.status]}
                    </span>
                  </div>
                </div>

                <p className="mt-3 text-sm text-[rgb(var(--muted))]">{pkg.beschreibungKurz}</p>

                <p className="mt-4 text-base font-semibold text-[rgb(var(--fg))]">{priceLabel(pkg)}</p>

                <ul className="mt-3 space-y-1 text-sm text-[rgb(var(--muted))]">
                  {(pkg.leistungen ?? []).slice(0, 3).map((item: string) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex items-center justify-between text-xs text-[rgb(var(--muted))]">
                  <span>{isSelected ? "Ausgewählt" : "Auswählen"}</span>
                  <span
                    className={cx(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full border text-sm font-bold",
                      isSelected ? "border-sky-300 bg-sky-50 text-sky-700" : "border-[rgb(var(--border))] text-[rgb(var(--muted))]",
                    )}
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function VormerkenPage() {
  const searchParams = useSearchParams();
  const nextParam = useMemo(() => sanitizeNext(searchParams.get("next")), [searchParams]);

  const privatePackages = useMemo(() => getPackagesByIds(PRIVATE_PACKAGE_IDS), []);
  const b2bPackages = useMemo(() => getPackagesByIds(B2B_PACKAGE_IDS), []);
  const b2gPackages = useMemo(() => getPackagesByIds(B2G_PACKAGE_IDS), []);

  const allPackages = useMemo(
    () => [...privatePackages, ...b2bPackages, ...b2gPackages],
    [privatePackages, b2bPackages, b2gPackages],
  );

  const initialPackage = useMemo(() => {
    const raw = searchParams.get("paket");
    const normalized = normalizePackageId(raw);
    const wanted = normalized ?? raw;
    const found = allPackages.find((pkg) => pkg.id === wanted);
    if (found) return found.id;
    return (privatePackages[0]?.id ?? "basis") as EDebattePackageId;
  }, [searchParams, allPackages, privatePackages]);

  const [selectedPackageId, setSelectedPackageId] = useState<EDebattePackageId>(initialPackage);

  const [selectedModules, setSelectedModules] = useState<ModuleId[]>([]);
  const [email, setEmail] = useState("");
  const [plz, setPlz] = useState("");
  const [note, setNote] = useState("");

  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ planLabel: string } | null>(null);

  const selectedPackage = useMemo(
    () => allPackages.find((pkg) => pkg.id === selectedPackageId) ?? allPackages[0] ?? null,
    [selectedPackageId, allPackages],
  );

  const targetAfterSuccess = nextParam ? withPreorderFlag(nextParam) : "/pricing";

  function toggleModule(id: ModuleId) {
    setSelectedModules((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPackage) return;

    setErrMsg(null);
    setBusy(true);

    const moduleLine = modulesToNoteLine(selectedModules);
    const cleanedNote = note.trim();
    const mergedNote =
      cleanedNote && moduleLine ? `${cleanedNote}\n\n${moduleLine}` : cleanedNote ? cleanedNote : moduleLine ?? "";

    try {
      const res = await fetch("/api/edebatte/preorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          package: selectedPackage.id,
          email: email.trim() || undefined,
          plz: plz.trim() || undefined,
          note: mergedNote.trim() || undefined,
          type: selectedPackage.typ,
          source: "vormerken",
          // Optional später als echtes Feld:
          // modules: selectedModules,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.message || body?.error || "Vormerkung fehlgeschlagen");
      }

      setSuccess({ planLabel: selectedPackage.titel });
      setEmail("");
      setPlz("");
      setNote("");
      setSelectedModules([]);
    } catch (err: any) {
      setErrMsg(err?.message ?? "Vormerkung fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[rgb(var(--bg))] pb-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute left-0 top-1/3 h-80 w-80 rounded-full bg-emerald-100/45 blur-3xl" />
      </div>

      <section className="relative mx-auto max-w-6xl px-4 py-12 lg:py-16">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Vormerkung</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-[rgb(var(--fg))]">
            Paket &amp; Module vormerken
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[rgb(var(--muted))]">
            Unverbindlich, ohne Zahlung. Du gibst uns nur ein Signal, was du brauchst – damit wir Starttermine und
            Onboarding sauber priorisieren können. Später kannst du alles im Konto ändern.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3 text-xs text-[rgb(var(--muted))]">
              <p className="font-semibold text-[rgb(var(--fg))]">Privat</p>
              <p className="mt-1">Für Bürger:innen, Initiativen, lokale Gruppen.</p>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3 text-xs text-[rgb(var(--muted))]">
              <p className="font-semibold text-[rgb(var(--fg))]">Organisation/Verwaltung</p>
              <p className="mt-1">B2B/B2G: Basis &amp; Pro + optionale Module (Setup nach Freigabe).</p>
            </div>
          </div>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="space-y-6">
            <InfoCard eyebrow="1) Paket auswählen">
              Wähle das Paket, das am besten passt. „Empfohlen“ ist nur ein Vorschlag – kein Druck.
            </InfoCard>

            <PackageGrid
              label="Privat"
              description="Basis, Start & Pro – für Bürger:innen und Initiativen."
              packages={privatePackages}
              selectedId={selectedPackageId}
              onSelect={setSelectedPackageId}
            />

            <PackageGrid
              label="B2B (Organisationen)"
              description="Für Vereine, Verbände, Redaktionen, Unternehmen – mit Setup & Rollenlogik."
              packages={b2bPackages}
              selectedId={selectedPackageId}
              onSelect={setSelectedPackageId}
            />

            <PackageGrid
              label="B2G (Verwaltung)"
              description="Für Kommunen/Träger – mit Admin-Steuerung und Projektlogik."
              packages={b2gPackages}
              selectedId={selectedPackageId}
              onSelect={setSelectedPackageId}
            />

            <InfoCard eyebrow="2) Module (optional)" title="Zusatzfunktionen, die du voraussichtlich buchen willst">
              <p>
                Das ist noch kein Kauf – nur eine Vormerkung. Damit sehen wir, was fuer Rollout &amp; Ausbau am wichtigsten
                ist.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {MODULES.map((m) => {
                  const checked = selectedModules.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleModule(m.id)}
                      className={cx(
                        "rounded-2xl border p-4 text-left transition",
                        checked ? "border-sky-300 bg-sky-50/60" : "border-[rgb(var(--border))] bg-[rgb(var(--card))] hover:bg-[rgb(var(--bg))]",
                      )}
                      aria-pressed={checked}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[rgb(var(--fg))]">{m.titel}</p>
                          <p className="mt-1 text-xs leading-relaxed text-[rgb(var(--muted))]">{m.kurz}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={cx(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ring-1",
                              STATUS_CLASS[m.status],
                            )}
                          >
                            {PACKAGE_STATUS_LABELS[m.status]}
                          </span>
                          <span
                            className={cx(
                              "inline-flex h-6 w-6 items-center justify-center rounded-full border text-sm font-bold",
                              checked ? "border-sky-300 bg-[rgb(var(--card))] text-sky-700" : "border-[rgb(var(--border))] text-[rgb(var(--muted))]",
                            )}
                            aria-hidden="true"
                          >
                            ✓
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </InfoCard>

            <InfoCard eyebrow="3) Kontakt (optional)">
              Wenn du deine E-Mail angibst, bestätigen wir die Vormerkung per Mail. Ohne E-Mail wird die Vormerkung
              trotzdem gespeichert (wenn du eingeloggt bist).
            </InfoCard>
          </div>

          <aside className="lg:sticky lg:top-24">
            {success ? (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-6 py-5 text-sm text-emerald-900 shadow-sm">
                <h2 className="text-lg font-semibold">Vormerkung gespeichert</h2>
                <p className="mt-1">
                  Danke! Du bist für <strong>{success.planLabel}</strong> vorgemerkt.
                </p>
                <p className="mt-2 text-emerald-800/80">Wir melden uns, sobald der Starttermin feststeht.</p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={targetAfterSuccess}
                    className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                  >
                    Weiter
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-[rgb(var(--card))] px-5 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
                  >
                    Zurück zu den Paketen
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
                {selectedPackage ? (
                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Ausgewählt</p>
                        <p className="mt-1 text-lg font-semibold text-[rgb(var(--fg))]">{selectedPackage.titel}</p>
                        <p className="mt-1 text-sm text-[rgb(var(--muted))]">{PACKAGE_AUDIENCE_LABELS[selectedPackage.typ]}</p>
                      </div>
                      <span
                        className={cx(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ring-1",
                          STATUS_CLASS[selectedPackage.status],
                        )}
                      >
                        {PACKAGE_STATUS_LABELS[selectedPackage.status]}
                      </span>
                    </div>

                    <p className="mt-3 text-sm font-semibold text-[rgb(var(--fg))]">{priceLabel(selectedPackage)}</p>

                    {selectedModules.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedModules.map((id) => (
                          <span
                            key={id}
                            className="inline-flex items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-0.5 text-[11px] font-semibold text-[rgb(var(--muted))]"
                          >
                            {MODULES.find((m) => m.id === id)?.titel ?? id}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                  <div className="space-y-1">
                    <label htmlFor="email" className="text-xs font-semibold text-[rgb(var(--muted))]">
                      E-Mail (optional)
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))] outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                      placeholder="name@example.org"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="plz" className="text-xs font-semibold text-[rgb(var(--muted))]">
                      PLZ (optional)
                    </label>
                    <input
                      id="plz"
                      type="text"
                      value={plz}
                      onChange={(event) => setPlz(event.target.value)}
                      className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))] outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                      placeholder="10115"
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-1">
                  <label htmlFor="note" className="text-xs font-semibold text-[rgb(var(--muted))]">
                    Hinweis (optional)
                  </label>
                  <textarea
                    id="note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    className="min-h-[110px] w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))] outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    placeholder="Worauf sollen wir achten, wenn wir dich kontaktieren?"
                  />
                  <p className="text-xs text-[rgb(var(--muted))]">
                    Hinweis: Ausgewählte Module werden automatisch in der Vormerkung notiert.
                  </p>
                </div>

                {errMsg ? <p className="mt-3 text-sm text-rose-600">{errMsg}</p> : null}

                <button
                  type="submit"
                  className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#0ea5e9,#22c55e)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(14,165,233,0.28)] hover:opacity-90 disabled:opacity-60"
                  disabled={busy}
                >
                  {busy ? "Sende …" : "Vormerkung senden"}
                </button>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]"
                  >
                    Zurück zu den Paketen
                  </Link>

                  {selectedPackage?.sekundarCtaHref ? (
                    selectedPackage.sekundarCtaHref.startsWith("http") ? (
                      <a
                        href={selectedPackage.sekundarCtaHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]"
                      >
                        {selectedPackage.sekundarCtaText ?? "Aufbau unterstuetzen"}
                      </a>
                    ) : (
                      <Link
                        href={selectedPackage.sekundarCtaHref}
                        className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]"
                      >
                        {selectedPackage.sekundarCtaText ?? "Aufbau unterstuetzen"}
                      </Link>
                    )
                  ) : null}
                </div>

                <p className="mt-4 text-xs leading-relaxed text-[rgb(var(--muted))]">
                  Unverbindlich: keine Zahlung, kein Abo. Wir nutzen die Angaben nur, um dich zum Start zu informieren und
                  Onboarding sinnvoll zu planen.
                </p>
              </form>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
