"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CompanionMode = "passive" | "relevant_only" | "periodic_overview" | "active_companion";

type SavedCompanionProfile = {
  mode: CompanionMode;
  region: string;
  interests: string[];
  savedAt: string;
};

const STORAGE_KEY = "edebatte.personal-voxy.first-login.v1";

const MODES: Array<{ id: CompanionMode; title: string; description: string }> = [
  {
    id: "passive",
    title: "Nur auf Anfrage",
    description: "Voxy bleibt im Hintergrund und reagiert nur, wenn du ihn öffnest.",
  },
  {
    id: "relevant_only",
    title: "Relevante Hinweise",
    description: "Nur Hinweise mit klarem Bezug zu deiner Region oder deinen Themen.",
  },
  {
    id: "periodic_overview",
    title: "Regelmäßiger Überblick",
    description: "Ein ruhiger Überblick über neue Themen und Beteiligungsmöglichkeiten.",
  },
  {
    id: "active_companion",
    title: "Aktiv begleiten",
    description: "Voxy schlägt Zusammenhänge, Beteiligungen und nächste Schritte vor.",
  },
];

const INTERESTS = [
  "Nachbarschaft",
  "Mobilität",
  "Bildung",
  "Gesundheit",
  "Stadtentwicklung",
  "Klima & Umwelt",
  "Soziales",
  "Digitalisierung",
];

const DAILY_IMPULSES = [
  "Was ist dir heute im gesellschaftlichen Miteinander aufgefallen?",
  "Was könnte aus deiner Sicht dahinterstecken?",
  "Welche Veränderung oder Wirkung wäre dir dabei wichtig?",
];

function readSavedProfile(): SavedCompanionProfile | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedCompanionProfile>;
    if (!parsed.mode || !Array.isArray(parsed.interests)) return null;
    return {
      mode: parsed.mode,
      region: typeof parsed.region === "string" ? parsed.region : "",
      interests: parsed.interests.filter((value): value is string => typeof value === "string"),
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function PersonalVoxyFirstLoginCompanion({ welcomeNotice = false }: { welcomeNotice?: boolean }) {
  const [mode, setMode] = useState<CompanionMode>("relevant_only");
  const [region, setRegion] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(welcomeNotice);

  useEffect(() => {
    const stored = readSavedProfile();
    if (!stored) return;
    setMode(stored.mode);
    setRegion(stored.region);
    setInterests(stored.interests);
    setConsent(true);
    setSaved(true);
  }, []);

  const selectedMode = useMemo(() => MODES.find((item) => item.id === mode) ?? MODES[1], [mode]);

  function toggleInterest(interest: string) {
    setSaved(false);
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
  }

  function saveProfile() {
    if (!consent) return;
    const profile: SavedCompanionProfile = {
      mode,
      region: region.trim(),
      interests,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    setSaved(true);
  }

  function resetProfile() {
    window.localStorage.removeItem(STORAGE_KEY);
    setMode("relevant_only");
    setRegion("");
    setInterests([]);
    setConsent(false);
    setSaved(false);
  }

  return (
    <section
      aria-labelledby="personal-voxy-heading"
      className="overflow-hidden rounded-[28px] border border-sky-400/20 bg-gradient-to-br from-slate-950 via-slate-950 to-sky-950/50 shadow-[0_24px_80px_rgba(2,132,199,0.12)]"
    >
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
        <div className="space-y-5 p-5 md:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-sky-300/30 bg-sky-400/10 text-xl font-black text-sky-300 shadow-inner">
              V
            </div>
            <div className="min-w-0 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-400">
                Dein persönlicher Voxy
              </p>
              <h2 id="personal-voxy-heading" className="text-xl font-semibold text-white md:text-2xl">
                Schön, dass du da bist.
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-300">
                Ich begleite dich durch eDebatte, erkläre Zusammenhänge und zeige dir passende
                Beteiligungsmöglichkeiten. Du entscheidest, wie aktiv ich sein darf und was ich mir merke.
              </p>
            </div>
          </div>

          {!expanded ? (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="rounded-full bg-sky-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
              >
                Voxy einrichten
              </button>
              <Link
                href="/create"
                className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-sky-300/50 hover:bg-white/5"
              >
                Direkt etwas einbringen
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-white">Wie soll Voxy dich begleiten?</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {MODES.map((item) => {
                    const active = item.id === mode;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setMode(item.id);
                          setSaved(false);
                        }}
                        aria-pressed={active}
                        className={`rounded-2xl border p-3 text-left transition ${
                          active
                            ? "border-sky-300/70 bg-sky-400/10"
                            : "border-white/10 bg-white/[0.03] hover:border-white/20"
                        }`}
                      >
                        <span className="block text-sm font-semibold text-white">{item.title}</span>
                        <span className="mt-1 block text-xs leading-5 text-slate-400">{item.description}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-white">Deine Region</span>
                  <input
                    value={region}
                    onChange={(event) => {
                      setRegion(event.target.value);
                      setSaved(false);
                    }}
                    placeholder="z. B. Rahnsdorf, Berlin"
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-sky-300/70"
                  />
                </label>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-white">Themen, die dich interessieren</p>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((interest) => {
                      const active = interests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          aria-pressed={active}
                          className={`rounded-full border px-3 py-1.5 text-xs transition ${
                            active
                              ? "border-sky-300/60 bg-sky-400/15 text-sky-100"
                              : "border-white/10 text-slate-300 hover:border-white/25"
                          }`}
                        >
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/15 p-3 text-xs leading-5 text-slate-300">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => {
                    setConsent(event.target.checked);
                    setSaved(false);
                  }}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent"
                />
                <span>
                  Voxy darf diese Auswahl ausschließlich in diesem Browser speichern. Du kannst sie jederzeit
                  ändern oder vollständig zurücksetzen. Es entsteht keine automatische Veröffentlichung und keine
                  politische Einstufung.
                </span>
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!consent}
                  onClick={saveProfile}
                  className="rounded-full bg-sky-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition enabled:hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Begleitung speichern
                </button>
                <button
                  type="button"
                  onClick={resetProfile}
                  className="rounded-full border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:border-white/25 hover:text-white"
                >
                  Zurücksetzen
                </button>
                <span className="text-xs text-slate-400" aria-live="polite">
                  {saved ? `Gespeichert · ${selectedMode.title}` : "Noch nicht gespeichert"}
                </span>
              </div>
            </div>
          )}
        </div>

        <aside className="border-t border-white/10 bg-black/20 p-5 lg:border-l lg:border-t-0 md:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-400">
            Was bewegt dich heute?
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">Drei kurze Impulse</h3>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Nicht um dich einzuordnen, sondern damit Voxy dein Thema und deine Argumentation besser versteht.
          </p>
          <ol className="mt-5 space-y-3">
            {DAILY_IMPULSES.map((impulse, index) => (
              <li key={impulse} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-400/10 text-xs font-bold text-sky-300">
                  {index + 1}
                </span>
                <span className="text-sm leading-5 text-slate-200">{impulse}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5 grid gap-2">
            <Link
              href="/create?entryIntent=observation&entryMode=guided"
              className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-sky-100"
            >
              Einen Gedanken teilen
            </Link>
            <Link
              href="/themen"
              className="rounded-2xl border border-white/10 px-4 py-3 text-center text-sm font-semibold text-white transition hover:border-sky-300/50 hover:bg-white/5"
            >
              Aktuelle Themen ansehen
            </Link>
          </div>
          <p className="mt-4 text-[11px] leading-5 text-slate-500">
            Regionale Live-Recherche und automatische Themenwache werden erst nach ausdrücklicher Freigabe als
            eigener Runtime-Schritt aktiviert. Bis dahin bleibt Voxy transparent und review-first.
          </p>
        </aside>
      </div>
    </section>
  );
}
