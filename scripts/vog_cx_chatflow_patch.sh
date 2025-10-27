#!/usr/bin/env bash
set -euo pipefail

WEB="apps/web"
SRC="$WEB/src"
PAGE="$SRC/app/contributions/new/page.tsx"
UI="$SRC/ui"

ts=$(date +%s)
mkdir -p "$UI" "$(dirname "$PAGE")"

# Backup
cp "$PAGE" "$PAGE.bak.$ts" 2>/dev/null || true

# --- ChatBubble --------------------------------------------------------------
cat > "$UI/ChatBubble.tsx" <<'TS'
"use client";
import React from "react";

export default function ChatBubble({
  role = "assistant",
  children,
}: { role?: "assistant" | "user"; children: React.ReactNode }) {
  const isUser = role === "user";
  return (
    <div className={"flex mb-2 " + (isUser ? "justify-end" : "justify-start")}>
      <div
        className={
          (isUser ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-800") +
          " rounded-2xl px-3 py-2 max-w-[680px] text-sm leading-relaxed"
        }
      >
        {children}
      </div>
    </div>
  );
}
TS

# --- ClarifyPanel ------------------------------------------------------------
cat > "$UI/ClarifyPanel.tsx" <<'TS'
"use client";
import React from "react";

export type ClarifySuggestions = {
  level?: "EU" | "Bund" | "Land" | "Kommune" | null;
  regionGuess?: string | null;
  period?: "aktuell" | "12m" | "5y" | "seit1990" | null;
};

export type ClarifyAnswers = {
  level?: string | null;
  region?: string | null;
  period?: string | null;
};

function Chip({
  active,
  children,
  onClick,
}: { active?: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "vog-chip " + (active ? "ring-2 ring-sky-400" : "")
      }
    >
      {children}
    </button>
  );
}

export default function ClarifyPanel({
  suggestions,
  value,
  onChange,
}: {
  suggestions: ClarifySuggestions | null;
  value: ClarifyAnswers;
  onChange: (v: ClarifyAnswers) => void;
}) {
  const [showOtherRegion, setShowOtherRegion] = React.useState(false);
  const [otherRegion, setOtherRegion] = React.useState("");
  const [showOtherPeriod, setShowOtherPeriod] = React.useState(false);
  const [otherPeriod, setOtherPeriod] = React.useState("");

  const set = (patch: Partial<ClarifyAnswers>) =>
    onChange({ ...value, ...patch });

  const lvl = value.level ?? suggestions?.level ?? null;
  const reg = value.region ?? suggestions?.regionGuess ?? "";
  const per = value.period ?? suggestions?.period ?? null;

  return (
    <div className="space-y-5">
      {/* Ebene / Zuständigkeit */}
      <div>
        <div className="text-xs text-slate-500 mb-1">EBENE/ZUSTÄNDIGKEIT</div>
        <div className="flex flex-wrap gap-2">
          {(["EU", "Bund", "Land", "Kommune"] as const).map((k) => (
            <Chip key={k} active={lvl === k} onClick={() => set({ level: k })}>
              {k}
            </Chip>
          ))}
          <Chip active={typeof lvl === "string" && !["EU","Bund","Land","Kommune"].includes(lvl!)}
                onClick={() => set({ level: (value.level ?? "Sonstiges") })}>
            Sonstiges…
          </Chip>
          <span className="text-xs text-slate-500 self-center">
            <button className="underline decoration-dotted"
              type="button" onClick={() => set({ level: null })}>
              Überspringen
            </button>
          </span>
        </div>
        {value.level && !["EU","Bund","Land","Kommune"].includes(value.level) && (
          <input
            className="mt-2 w-full border rounded-xl px-3 py-2"
            placeholder="Ebene präzisieren (z. B. Verband, Hochschulrat …)"
            value={value.level}
            onChange={(e) => set({ level: e.target.value })}
          />
        )}
      </div>

      {/* Ort / Region */}
      <div>
        <div className="text-xs text-slate-500 mb-1">ORT/REGION</div>
        <div className="flex flex-wrap gap-2">
          <Chip active={reg === "Bundesweit"} onClick={() => set({ region: "Bundesweit" })}>
            Bundesweit
          </Chip>
          {suggestions?.regionGuess && suggestions.regionGuess !== "Bundesweit" && (
            <Chip active={reg === suggestions.regionGuess}
                  onClick={() => set({ region: suggestions.regionGuess || "" })}>
              {suggestions.regionGuess}
            </Chip>
          )}
          <Chip active={showOtherRegion || (!!reg && reg !== "Bundesweit" && reg !== suggestions?.regionGuess)}
                onClick={() => setShowOtherRegion((v) => !v)}>
            Stadt/Region…
          </Chip>
          <span className="text-xs text-slate-500 self-center">
            <button className="underline decoration-dotted"
              type="button" onClick={() => { set({ region: null }); setShowOtherRegion(false); }}>
              Überspringen
            </button>
          </span>
        </div>
        {(showOtherRegion || (!!reg && reg !== "Bundesweit" && reg !== suggestions?.regionGuess)) && (
          <input
            className="mt-2 w-full border rounded-xl px-3 py-2"
            placeholder="z. B. Berlin, München, Kreis XY …"
            value={showOtherRegion ? otherRegion : reg || ""}
            onChange={(e) => showOtherRegion ? setOtherRegion(e.target.value) : set({ region: e.target.value })}
            onBlur={() => { if (showOtherRegion && otherRegion.trim()) set({ region: otherRegion.trim() }); }}
          />
        )}
      </div>

      {/* Zeitraum */}
      <div>
        <div className="text-xs text-slate-500 mb-1">ZEITRAUM</div>
        <div className="flex flex-wrap gap-2">
          <Chip active={per === "aktuell"} onClick={() => set({ period: "aktuell" })}>Aktuell</Chip>
          <Chip active={per === "12m"} onClick={() => set({ period: "12m" })}>Letzte 12 Monate</Chip>
          <Chip active={per === "5y"} onClick={() => set({ period: "5y" })}>Letzte 5 Jahre</Chip>
          <Chip active={per === "seit1990"} onClick={() => set({ period: "seit1990" })}>Seit 1990</Chip>
          <Chip active={showOtherPeriod || (!!per && !["aktuell","12m","5y","seit1990"].includes(per! as string))}
                onClick={() => setShowOtherPeriod((v) => !v)}>
            Sonstiges…
          </Chip>
          <span className="text-xs text-slate-500 self-center">
            <button className="underline decoration-dotted"
              type="button" onClick={() => { set({ period: null }); setShowOtherPeriod(false); }}>
              Überspringen
            </button>
          </span>
        </div>
        {(showOtherPeriod || (!!per && !["aktuell","12m","5y","seit1990"].includes(per! as string))) && (
          <input
            className="mt-2 w-full border rounded-xl px-3 py-2"
            placeholder="z. B. 2015–2018, nach 2020 …"
            value={showOtherPeriod ? otherPeriod : (per as string) || ""}
            onChange={(e) => showOtherPeriod ? setOtherPeriod(e.target.value) : set({ period: e.target.value })}
            onBlur={() => { if (showOtherPeriod && otherPeriod.trim()) set({ period: otherPeriod.trim() }); }}
          />
        )}
      </div>
    </div>
  );
}
TS

# --- Page.tsx (Chat-Flow, ohne News/QuickEssenz/Pro&Contra Listen) ----------
cat > "$PAGE" <<'TS'
"use client";

import React from "react";
import StanceSpectrum from "@/components/analyze/StanceSpectrum";
import ObjectionCollector from "@/components/analyze/ObjectionCollector";
import ClaimPanelsGate from "@/ui/ClaimPanelsGate";
import InPlaceHUD from "@/ui/InPlaceHUD";
import ChatBubble from "@/ui/ChatBubble";
import ClarifyPanel, { ClarifyAnswers, ClarifySuggestions } from "@/ui/ClarifyPanel";

type Claim = { text: string; confidence?: number; meta?: any };

export default function ContributionNewPage() {
  // —— Step state ------------------------------------------------------------
  type Step = "draft" | "clarify" | "review" | "panels";
  const [step, setStep] = React.useState<Step>("draft");

  // —— Input / Results -------------------------------------------------------
  const [text, setText] = React.useState<string>(
    typeof window !== "undefined"
      ? (new URLSearchParams(window.location.search).get("text") ?? "")
      : ""
  );
  const [claims, setClaims] = React.useState<Claim[]>([]);
  const [activeClaimIdx, setActiveClaimIdx] = React.useState<number>(0);

  // —— UX / HUD --------------------------------------------------------------
  const [analyzing, setAnalyzing] = React.useState<boolean>(false);
  const [hud, setHud] = React.useState<string[]>([]);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // —— Clarify ---------------------------------------------------------------
  const [clarifySuggestions, setClarifySuggestions] = React.useState<ClarifySuggestions | null>(null);
  const [clarify, setClarify] = React.useState<ClarifyAnswers>({});

  // guards
  const activeClaim = (claims && claims[activeClaimIdx]) ?? null;
  const canShowPanels = step === "panels" && !!activeClaim?.text && !analyzing;

  React.useEffect(() => {
    if (activeClaimIdx > claims.length - 1) {
      setActiveClaimIdx(Math.max(0, claims.length - 1));
    }
  }, [claims.length, activeClaimIdx]);

  function pushHud(line: string) {
    setHud((h) => [...h.slice(-6), line]); // max 7 Zeilen
  }

  async function fetchClarify(txt: string) {
    try {
      const r = await fetch("/api/quality/clarify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: txt }),
      });
      const j = await r.json().catch(() => ({}));
      // sehr defensiv mappen
      const s: ClarifySuggestions = {
        level: j?.level ?? null,
        regionGuess: j?.region ?? j?.city ?? j?.state ?? null,
        period: j?.period ?? null,
      };
      setClarifySuggestions(s);
    } catch {
      setClarifySuggestions(null);
    }
  }

  async function runAnalysis() {
    const t0 = Date.now();
    setAnalyzing(true);
    setErrorMsg(null);
    setClaims([]);
    setActiveClaimIdx(0);
    setHud([]);

    try {
      pushHud("Vorprüfung: Text säubern & Parameter setzen …");
      const payload = { text: String(text || "").slice(0, 8000), maxClaims: 4 };

      pushHud("Analyse: Modelle orchestrieren & Claim(s) extrahieren …");
      const res = await fetch("/api/contributions/analyze?mode=multi&clarify=1", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({} as any));

      const apiClaims: Claim[] = Array.isArray(j?.claims) ? j.claims : [];
      const cleaned = apiClaims
        .map((c) => ({
          text: String((c as any)?.text ?? "").trim(),
          confidence: (c as any)?.confidence,
          meta: (c as any)?.meta,
        }))
        .filter((c) => c.text.length > 0);

      if (cleaned.length === 0) {
        if (text.trim()) {
          cleaned.push({ text: text.trim() });
          pushHud("Hinweis: Kein strukturierter Claim gefunden – Fallback verwendet.");
        } else {
          pushHud("Hinweis: Kein Inhalt – bitte Text eingeben.");
        }
      }

      setClaims(cleaned);
      setActiveClaimIdx(0);

      const took = ((Date.now() - t0) / 1000).toFixed(1);
      pushHud(`Fertig: ${cleaned.length} Claim(s) erkannt · ${took}s`);

      // → nächster Schritt: Klärfragen vorschlagen
      setStep("clarify");
      fetchClarify(payload.text);
    } catch (e: any) {
      const msg = String(e?.message || e);
      setErrorMsg(msg);
      pushHud("Fehler: " + msg);
    } finally {
      setAnalyzing(false);
    }
  }

  function goNextFromClarify() {
    setStep("review");
  }

  function goPanels() {
    if (activeClaim?.text) setStep("panels");
  }

  function goQuick() {
    const claimText = (activeClaim?.text || text || "").slice(0, 500);
    const u = new URL("/statements/new", window.location.origin);
    if (claimText) u.searchParams.set("text", claimText);
    if (clarify.level) u.searchParams.set("level", String(clarify.level));
    if (clarify.region) u.searchParams.set("region", String(clarify.region));
    if (clarify.period) u.searchParams.set("period", String(clarify.period));
    window.location.href = u.toString();
  }

  return (
    <div className="container-vog">
      <h1 className="vog-head mb-4">Beitrag erstellen &amp; analysieren</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* linke Spalte: alles im Chat-Bereich */}
        <div className="lg:col-span-2 space-y-4">
          <div className="vog-card p-4 space-y-3">
            <textarea
              className="w-full min-h-[200px] rounded-2xl border p-3"
              placeholder="Schreibe deinen Beitrag/These…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            {/* Inline-Fortschritt */}
            <InPlaceHUD log={hud} analyzing={analyzing} />

            <div className="flex gap-2 items-center">
              <button
                className="vog-btn-pri"
                onClick={runAnalysis}
                disabled={!text || analyzing}
              >
                {analyzing ? "Analysiere…" : "Analyse starten"}
              </button>
              <button
                className="vog-btn"
                onClick={goQuick}
                disabled={!text}
                title="Direkt mit dem ersten Claim weiter"
              >
                Schnell-Flow
              </button>
            </div>

            {errorMsg && <div className="text-sm text-red-600">{errorMsg}</div>}

            {/* ——— Step 2: Klarifizieren ——— */}
            {step !== "draft" && (
              <>
                <ChatBubble role="assistant">
                  Ich habe erste Einordnungen vorgeschlagen. Du kannst sie übernehmen,
                  präzisieren oder einfach <span className="font-medium">überspringen</span>.
                </ChatBubble>

                <ClarifyPanel
                  suggestions={clarifySuggestions}
                  value={clarify}
                  onChange={setClarify}
                />

                <div className="flex gap-2 pt-2">
                  <button className="vog-btn-pri" onClick={goNextFromClarify}>
                    Weiter
                  </button>
                  <button className="vog-btn" onClick={() => { setClarify({}); setClarifySuggestions(null); }}>
                    Zurücksetzen
                  </button>
                </div>
              </>
            )}

            {/* ——— Step 3: Claim auswählen ——— */}
            {step !== "draft" && claims.length > 0 && (
              <div className="pt-3">
                <div className="text-xs text-slate-500 mb-1">Gefundene Claims</div>
                <div className="flex flex-wrap gap-2">
                  {claims.map((c, i) => (
                    <button
                      key={i}
                      className={
                        "vog-chip " + (i === activeClaimIdx ? "ring-2 ring-sky-400" : "")
                      }
                      onClick={() => setActiveClaimIdx(i)}
                      title={c.text}
                    >
                      Claim {i + 1}
                    </button>
                  ))}
                </div>

                {step === "review" && (
                  <div className="pt-3">
                    <button
                      className="vog-btn"
                      onClick={goPanels}
                      disabled={!activeClaim?.text}
                    >
                      Weiter: Alternativen & Einwände anzeigen
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ——— Step 4: Panels (gated) ——— */}
          <ClaimPanelsGate show={canShowPanels}>
            <>
              {activeClaim?.text && (
                <>
                  <StanceSpectrum claimText={activeClaim.text} />
                  <ObjectionCollector />
                </>
              )}
            </>
          </ClaimPanelsGate>
        </div>

        {/* rechte Spalte: aktuell leer (Recherche/Essenz bewusst entfernt) */}
        <div className="space-y-3">
          <div className="vog-card p-4 text-sm">
            <div className="font-semibold mb-1">Hinweis</div>
            Du kannst jederzeit abbrechen – <b>eDebatte</b> übernimmt auf Wunsch
            Redaktion &amp; Belege. Die Detail-Recherche wird später hier eingeblendet.
          </div>
        </div>
      </div>
    </div>
  );
}
TS

echo "✓ Chat-Flow Patch installiert."
echo "   Backup: $PAGE.bak.$ts"
