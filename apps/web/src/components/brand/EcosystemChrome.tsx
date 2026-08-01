"use client";

import { useEffect } from "react";

const ECOSYSTEM = [
  {
    name: "eDebatte",
    role: "Verstehen",
    description: "Offene Infrastruktur für nachvollziehbare Erkenntnis, Orientierung und Beteiligung.",
    href: "https://www.edebatte.org",
    current: true,
  },
  {
    name: "VoiceOpenGov",
    role: "Verbinden",
    description: "Internationale Mitgliederbewegung für nachvollziehbare Entscheidungen.",
    href: "https://www.voiceopengov.org",
  },
  {
    name: "Vote4Gov",
    role: "Weiterdenken",
    description: "Gesellschaftliche Denkwerkstatt für demokratische Mitbestimmung im digitalen Zeitalter.",
    href: "https://www.vote4gov.eu",
  },
  {
    name: "Voxy",
    role: "Orientieren",
    description: "Erklärt, strukturiert und verbindet. Entscheidet nicht.",
    href: "https://www.edebatte.org",
  },
];

export function EcosystemChrome({ footer = true }: { footer?: boolean }) {
  useEffect(() => {
    const brandLink = document.querySelector<HTMLAnchorElement>("header a[href='/']");
    if (!brandLink || brandLink.dataset.ecosystemLogo === "true") return;

    brandLink.dataset.ecosystemLogo = "true";
    brandLink.setAttribute("aria-label", "eDebatte Startseite");
    brandLink.innerHTML = `
      <picture class="block h-11 w-[178px] sm:w-[220px]">
        <source media="(prefers-color-scheme: light)" srcset="/brand/edebatte-logo-light.svg" />
        <img src="/brand/edebatte-logo.svg" alt="eDebatte – Verstehen" class="h-full w-full object-contain object-left" width="420" height="96" />
      </picture>
    `;
  }, []);

  if (!footer) return null;

  return (
    <section
      aria-labelledby="ecosystem-heading"
      className="border-t border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-12 text-[rgb(var(--fg))]"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[rgb(var(--grad-from))]">Ein Ökosystem. Vier klare Rollen.</p>
          <h2 id="ecosystem-heading" className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Verstehen. Verbinden. Weiterdenken. Orientieren.
          </h2>
          <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">
            eDebatte ist das offene Angebot für alle. VoiceOpenGov nutzt es als Bewegung, besitzt es aber nicht.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ECOSYSTEM.map((item) => (
            <a
              key={item.name}
              href={item.href}
              aria-current={item.current ? "page" : undefined}
              className={`group rounded-2xl border p-4 transition ${
                item.current
                  ? "border-[rgb(var(--grad-from))]/65 bg-[color-mix(in_oklab,rgb(var(--card))_82%,rgb(var(--grad-from))_18%)] shadow-sm"
                  : "border-[rgb(var(--border))] bg-[rgb(var(--card))] hover:border-[rgb(var(--grad-from))]/45"
              }`}
            >
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-[rgb(var(--grad-from))]">{item.role}</span>
              <strong className="mt-2 block text-lg">{item.name}</strong>
              <span className="mt-2 block text-sm leading-5 text-[rgb(var(--muted))]">{item.description}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
