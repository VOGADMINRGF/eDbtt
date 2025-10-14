# scripts/e150_seed.sh
cat > scripts/e150_seed.sh <<'SH'
#!/usr/bin/env bash
set -euo pipefail

# ENV aus apps/web/.env.local lesen, falls MONGODB_URI/CORE_MONGODB_URI nicht gesetzt
ENV_FILE="apps/web/.env.local"
if [ -f "$ENV_FILE" ]; then
  export $(grep -E '^(CORE_MONGODB_URI|CORE_DB_NAME|MONGODB_URI)=' "$ENV_FILE" | xargs -I{} echo {})
fi

URI="${CORE_MONGODB_URI:-${MONGODB_URI:-}}"
DB="${CORE_DB_NAME:-}"
if [ -z "${URI}" ]; then
  echo "❌ Keine CORE_MONGODB_URI/MONGODB_URI gefunden (env oder $ENV_FILE)."
  exit 1
fi

# Seed-Skript (Node ESM)
cat > apps/web/scripts/core.seed.mjs <<'JS'
import mongoose from "mongoose";

const uri = process.env.CORE_MONGODB_URI || process.env.MONGODB_URI;
const dbName = process.env.CORE_DB_NAME;

const ContributionSchema = new mongoose.Schema({
  title: String, text: String, authorId: String, tags: [String], status: { type: String, default: "published" }
}, { timestamps: true });

const ReportSchema = new mongoose.Schema({
  title: String, summary: String, data: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const StatementSchema = new mongoose.Schema({
  id: String, title: String, text: String, status: { type: String, default: "active" }, votingRule: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const Contribution = mongoose.models.Contribution || mongoose.model("Contribution", ContributionSchema);
const Report       = mongoose.models.Report       || mongoose.model("Report", ReportSchema);
const Statement    = mongoose.models.Statement    || mongoose.model("Statement", StatementSchema, "statements");

function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function makeContrib(i){
  const topics = ["Klima", "Verkehr", "Digital", "Bildung", "Gesundheit", "Sicherheit"];
  const actions = ["fördern", "reformieren", "modernisieren", "priorisieren", "entbürokratisieren"];
  const t = `${pick(topics)} ${pick(actions)}`;
  return {
    title: `${t} – Vorschlag ${i+1}`,
    text: `Vorschlag ${i+1}: Wir sollten ${t.toLowerCase()} und die Mittel effizient einsetzen.`,
    authorId: `user_${1 + (i%5)}`,
    tags: [pick(topics).toLowerCase()],
    status: "published",
  };
}

function makeReport(i){
  return {
    title: `Monatsreport ${i+1}`,
    summary: `Kurzbericht ${i+1} mit Kennzahlen (Demo).`,
    data: { kpis: { users: 100+i*3, votes: 42+i*7 } }
  };
}

function makeStatement(i){
  return {
    id: `stmt_${i+1}`,
    title: `These ${i+1}`,
    text: `Dies ist These/Statement Nummer ${i+1}.`,
    status: "active",
    votingRule: { type: "simple-majority" }
  };
}

const N_CONTRIB = Number(process.env.SEED_CONTRIB || 15);
const N_REPORTS = Number(process.env.SEED_REPORT || 6);
const N_STMTS   = Number(process.env.SEED_STMTS || 10);

(async ()=>{
  await mongoose.connect(uri, { dbName: dbName || undefined });

  // kleine Speicher, um Listen sichtbar zu machen
  const contribs = Array.from({length: N_CONTRIB}, (_,i)=>makeContrib(i));
  const reports  = Array.from({length: N_REPORTS}, (_,i)=>makeReport(i));
  const stmts    = Array.from({length: N_STMTS},   (_,i)=>makeStatement(i));

  await Contribution.insertMany(contribs, { ordered: false }).catch(()=>{});
  await Report.insertMany(reports, { ordered: false }).catch(()=>{});
  await Statement.insertMany(stmts, { ordered: false }).catch(()=>{});

  console.log(`✓ seeded: ${contribs.length} contributions, ${reports.length} reports, ${stmts.length} statements`);
  await mongoose.disconnect();
  process.exit(0);
})().catch(e=>{ console.error(e); process.exit(1); });
JS

echo "Seeding DB …"
SEED_CONTRIB="${1:-20}" SEED_REPORT="${2:-8}" SEED_STMTS="${3:-12}" CORE_MONGODB_URI="$URI" CORE_DB_NAME="$DB" node apps/web/scripts/core.seed.mjs
echo "✓ Done."
SH

chmod +x scripts/e150_seed.sh

# ausführen
echo "— Bootstrap fertig. Jetzt seeden:"
echo "   bash scripts/e150_seed.sh             # standard 20/8/12"
echo "   bash scripts/e150_seed.sh 30 10 15    # (optional) eigene Mengen"
SH

# Run bootstrap now
bash scripts/e150_bootstrap_content.sh
