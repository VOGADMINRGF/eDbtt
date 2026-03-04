import { MongoClient } from "mongodb";

const uri = process.env.CORE_MONGODB_URI || process.env.MONGODB_URI;
const dbName = process.env.CORE_DB_NAME || process.env.MONGODB_DB || "edebatte_core";

if (!uri) {
  console.error("Missing CORE_MONGODB_URI or MONGODB_URI.");
  process.exit(1);
}

const now = new Date().toISOString();
const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);

const statements = [
  {
    seedKey: "stmt_demo_1",
    title: "Soll es einen regionalen Mobilitaetsfonds geben?",
    text: "Ein regionaler Fonds koennte Kommunen bei Infrastrukturprojekten schneller handlungsfaehig machen.",
    status: "published",
    createdAt: now,
    updatedAt: now,
  },
  {
    seedKey: "stmt_demo_2",
    title: "Wie sichern wir bezahlbaren Wohnraum?",
    text: "Welche Instrumente sind kurzfristig wirksam und dauerhaft finanzierbar?",
    status: "published",
    createdAt: now,
    updatedAt: now,
  },
  {
    seedKey: "stmt_demo_3",
    title: "Soll die Stadt mehr in digitale Verwaltung investieren?",
    text: "Digitale Services koennen Prozesse beschleunigen, brauchen aber klare Prioritaeten.",
    status: "published",
    createdAt: now,
    updatedAt: now,
  },
];

const reports = [
  {
    seedKey: "report_demo_1",
    title: "Impact-Report (Demo)",
    summary: "Demo-Report mit Basiskennzahlen fuer Tests.",
    createdAt: now,
    updatedAt: now,
  },
  {
    seedKey: "report_demo_2",
    title: "Region-Report (Demo)",
    summary: "Regionale Zusammenfassung fuer Demo-Ansichten.",
    createdAt: now,
    updatedAt: now,
  },
];

const contributions = [
  {
    seedKey: "contrib_demo_1",
    title: "Beitrag: Schulwege sicherer machen",
    text: "Bitte pruefen, ob mehr Zebrastreifen und Temporeduzierung sinnvoll sind.",
    status: "draft",
    createdAt: now,
    updatedAt: now,
  },
  {
    seedKey: "contrib_demo_2",
    title: "Beitrag: Pflege entlasten",
    text: "Welche Programme koennen kurzfristig Entlastung bringen?",
    status: "draft",
    createdAt: now,
    updatedAt: now,
  },
];

async function upsertMany(col, items) {
  const collection = db.collection(col);
  for (const item of items) {
    await collection.updateOne({ seedKey: item.seedKey }, { $set: item }, { upsert: true });
  }
}

await upsertMany("statements", statements);
await upsertMany("reports", reports);
await upsertMany("contributions", contributions);

console.log("✓ Demo seeds upserted:", {
  statements: statements.length,
  reports: reports.length,
  contributions: contributions.length,
});

await client.close();
