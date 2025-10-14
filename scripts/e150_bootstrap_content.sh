#!/usr/bin/env bash
set -euo pipefail

APP="apps/web"
SRC="$APP/src"

mkdir -p "$SRC/lib" "$SRC/models" "$SRC/models/core" "$SRC/app/api"{/contributions,/reports,/swipeStatements}

# 1) lib/db.ts – kompatibel zu "import dbConnect from '@/lib/db'"
cat > "$SRC/lib/db.ts" <<'TS'
import mongoose from "mongoose";

type GlobalWithMongoose = typeof globalThis & { __MONGOOSE_CONN__?: Promise<typeof mongoose> };

const g = global as GlobalWithMongoose;

export default async function dbConnect() {
  if (!g.__MONGOOSE_CONN__) {
    const uri = process.env.CORE_MONGODB_URI || process.env.MONGODB_URI || "";
    if (!uri) throw new Error("No CORE_MONGODB_URI/MONGODB_URI set");
    g.__MONGOOSE_CONN__ = mongoose.connect(uri, { dbName: process.env.CORE_DB_NAME || undefined });
  }
  return g.__MONGOOSE_CONN__;
}

export async function getDb() {
  await dbConnect();
  return mongoose.connection.db;
}
TS

echo "✓ lib/db.ts"

# 2) Models nur anlegen, wenn noch nicht vorhanden
if [ ! -f "$SRC/models/Contribution.ts" ]; then
cat > "$SRC/models/Contribution.ts" <<'TS'
import mongoose, { Schema } from "mongoose";

const ContributionSchema = new Schema({
  title: { type: String },
  text: { type: String, required: true },
  authorId: { type: String },
  tags: [{ type: String }],
  status: { type: String, enum: ["draft","published"], default: "published" },
}, { timestamps: true });

export default mongoose.models.Contribution || mongoose.model("Contribution", ContributionSchema);
TS
echo "✓ models/Contribution.ts"
fi

if [ ! -f "$SRC/models/core/Report.ts" ]; then
cat > "$SRC/models/core/Report.ts" <<'TS'
import mongoose, { Schema } from "mongoose";

const ReportSchema = new Schema({
  title: { type: String, required: true },
  summary: { type: String },
  data: { type: Schema.Types.Mixed },
}, { timestamps: true });

export default mongoose.models.Report || mongoose.model("Report", ReportSchema);
TS
echo "✓ models/core/Report.ts"
fi

# Statement-Modell nur stubben, falls komplett fehlt
if [ ! -f "$SRC/models/core/Statement.ts" ]; then
cat > "$SRC/models/core/Statement.ts" <<'TS'
import mongoose, { Schema } from "mongoose";

const StatementSchema = new Schema({
  id: { type: String, index: true }, // einfache "id" Kompatibilität
  title: String,
  text: String,
  status: { type: String, default: "active" },
  votingRule: { type: Schema.Types.Mixed },
}, { timestamps: true });

export default mongoose.models.Statement || mongoose.model("Statement", StatementSchema, "statements");
TS
echo "✓ models/core/Statement.ts (stub)"
fi

# 3) API Routen
cat > "$SRC/app/api/contributions/route.ts" <<'TS'
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Contribution from "@/models/Contribution";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await dbConnect();
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") || 20), 100);
  const skip = Math.max(Number(url.searchParams.get("skip") || 0), 0);
  const sort = (url.searchParams.get("sort") || "-createdAt") as string;

  const items = await Contribution.find({})
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  const data = items.map((d: any) => ({ id: String(d._id), ...d }));
  return NextResponse.json(data);
}
TS
echo "✓ api/contributions/route.ts"

cat > "$SRC/app/api/reports/route.ts" <<'TS'
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Report from "src/models/core/Report";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await dbConnect();
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") || 20), 100);
  const skip = Math.max(Number(url.searchParams.get("skip") || 0), 0);
  const sort = (url.searchParams.get("sort") || "-updatedAt") as string;

  const items = await Report.find({})
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  const data = items.map((d: any) => ({ id: String(d._id), ...d }));
  return NextResponse.json(data);
}
TS
echo "✓ api/reports/route.ts"

cat > "$SRC/app/api/swipeStatements/route.ts" <<'TS'
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Statement from "@/models/core/Statement";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await dbConnect();
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") || 20), 100);
  const items = await Statement.find({ status: "active" })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const data = items.map((d: any) => ({
    id: d.id || String(d._id),
    title: d.title,
    text: d.text,
    createdAt: d.createdAt,
  }));
  return NextResponse.json(data);
}
TS
echo "✓ api/swipeStatements/route.ts"

# 4) tsconfig Pfad-Aliase ergänzen, damit @/lib/* und @lib/* funktionieren
node - <<'JS'
const fs = require("fs");
const p = "apps/web/tsconfig.json";
const j = JSON.parse(fs.readFileSync(p, "utf8"));
j.compilerOptions = j.compilerOptions || {};
j.compilerOptions.baseUrl = j.compilerOptions.baseUrl || ".";
j.compilerOptions.paths = j.compilerOptions.paths || {};
j.compilerOptions.paths["@/*"] = j.compilerOptions.paths["@/*"] || ["src/*"];
j.compilerOptions.paths["@@/*"] = j.compilerOptions.paths["@@/*"] || ["*"];
j.compilerOptions.paths["@/lib/*"] = j.compilerOptions.paths["@/lib/*"] || ["src/lib/*"];
j.compilerOptions.paths["@lib/*"] = j.compilerOptions.paths["@lib/*"] || ["src/lib/*"];
j.compilerOptions.paths["@/models/*"] = j.compilerOptions.paths["@/models/*"] || ["src/models/*"];
fs.writeFileSync(p, JSON.stringify(j, null, 2));
console.log("✓ tsconfig.json paths updated");
JS

echo "— Bootstrap done. Restart dev server after seeding."
