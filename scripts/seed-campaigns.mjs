#!/usr/bin/env node
/* eslint-disable no-console */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ADMIN_COOKIE = process.env.ADMIN_COOKIE;
const STATEMENT_LIMIT = Number(process.env.STATEMENT_LIMIT || 5);
const SESSION_CODE = process.env.SESSION_CODE || "QR-ALPHA-001";

if (!ADMIN_COOKIE) {
  console.error("Missing ADMIN_COOKIE. Example:");
  console.error("ADMIN_COOKIE='__Secure-next-auth.session-token=...' BASE_URL=http://localhost:3000 node scripts/seed-campaigns.mjs");
  process.exit(1);
}

async function fetchJson(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      cookie: ADMIN_COOKIE,
      ...(options.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.ok) {
    const msg = body?.error || res.statusText;
    throw new Error(`${path} failed: ${msg}`);
  }
  return body;
}

async function seedCampaign() {
  const stmtRes = await fetch(`${BASE_URL}/api/statements?limit=${STATEMENT_LIMIT}`, {
    headers: { accept: "application/json" },
  });
  const stmtBody = await stmtRes.json().catch(() => ({}));
  const statements = Array.isArray(stmtBody?.data) ? stmtBody.data : [];

  const today = new Date().toISOString().slice(0, 10);
  const title = `Aktuelle Debatten ${today}`;
  const slug = `debatten-${today.replace(/-/g, "")}`;

  const campaignRes = await fetchJson("/api/admin/campaigns/save", {
    method: "POST",
    body: JSON.stringify({
      title,
      slug,
      description: "Auswahl aktueller Statements fuer Schnell-Feedback.",
      status: "active",
      kind: "community",
      tags: ["qr", "live"],
    }),
  });

  const campaignId = campaignRes.campaign?.id;
  if (!campaignId) throw new Error("Campaign id missing.");

  const questions = statements.length
    ? statements.map((s, idx) => ({
        prompt: s.title || s.text || `Statement ${idx + 1}`,
        description: s.text && s.title ? s.text : "",
        type: "choice",
        options: ["Zustimme", "Neutral", "Lehne ab"],
        order: idx,
      }))
    : [
        {
          prompt: "Es braucht mehr Tempo bei der digitalen Verwaltung.",
          description: "",
          type: "choice",
          options: ["Zustimme", "Neutral", "Lehne ab"],
          order: 0,
        },
      ];

  for (const question of questions) {
    await fetchJson(`/api/admin/campaigns/${campaignId}/questions`, {
      method: "POST",
      body: JSON.stringify(question),
    });
  }

  return { campaignId, slug, title };
}

async function seedCommunityRooms() {
  const rooms = [
    {
      title: "Lokale Updates",
      slug: "lokale-updates",
      description: "Kurzupdates aus Stadt, Bezirk, Gemeinde.",
      status: "open",
      tags: ["lokal", "news"],
    },
    {
      title: "Themenradar",
      slug: "themenradar",
      description: "Neue Fragen und Themen aus der Community.",
      status: "open",
      tags: ["fragen", "ideen"],
    },
  ];

  for (const room of rooms) {
    await fetchJson("/api/community/rooms/create", {
      method: "POST",
      body: JSON.stringify(room),
    });
  }
}

async function main() {
  const { campaignId, slug, title } = await seedCampaign();
  await seedCommunityRooms();

  console.log("Seed completed.");
  console.log(`Campaign: ${title}`);
  console.log(`Campaign ID: ${campaignId}`);
  console.log(`QR URL: ${BASE_URL}/de/${slug}/${SESSION_CODE}`);
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
