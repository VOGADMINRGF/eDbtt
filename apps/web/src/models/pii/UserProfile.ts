// models/pii/UserProfile.ts  löschen
import crypto from "node:crypto";
import { Schema, Document } from "mongoose";
import { piiConn } from "@lib/db/pii";
import { modelOn } from "@lib/db/modelOn";

// -----------------------------
// Types
// -----------------------------
export interface RoleObject {
  role: "user" | "moderator" | "admin" | "b2b" | "ngo" | "politics";
  subRole?: string;
  orgId?: string;
  orgName?: string;
  region?: string;
  verification?: "none" | "verified" | "legitimized";
  premium?: boolean;
}

export interface IUserProfile extends Document {
  username: string;
  email?: string; // PII
  roles: RoleObject[];
  activeRole: number;
  trustScore: number;
  badges: string[];
  interests: string[];
  regions: string[];
  languages: string[];
  status: "active" | "banned" | "pending";
  region?: string;
  city?: string;
  premium: boolean;
  verification: "none" | "verified" | "legitimized";
  onboardingStatus: "incomplete" | "pendingDocs" | "complete";
  auditTrail: { date: Date; action: string; details: any }[];
  limits?: any;
  quickLogin?: boolean;
  eventRef?: string;
  questionRef?: string;

  // MFA
  mfaEnabled: boolean;
  mfaSecret?: string;
  mfaBackupCodes?: string[];
  lastMfaChallengeAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Internal (case-insensitive uniqueness)
  username_lc?: string;
}

// -----------------------------
// Subschema
// -----------------------------
// -----------------------------
// Main schema
// -----------------------------
const UserProfileSchema = new Schema<IUserProfile>(
  {
    // 👉 KEIN unique/index direkt am Feld – Indizes kommen gesammelt weiter unten
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 64,
    },

    // PII – standardmäßig nicht selektieren
    email: {
      type: String,
      default: null,
      select: false,
      lowercase: true,
      trim: true,
    },

    roles: { type: [RoleObjectSchema], default: [] },
    activeRole: { type: Number, default: 0, min: 0 },

    trustScore: { type: Number, default: 0, min: 0, max: 100 },

    badges: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    regions: { type: [String], default: [] },

    languages: { type: [String], default: ["de"] },

    status: {
      type: String,
      enum: ["active", "banned", "pending"],
      default: "active",
      index: true,
    },

    region: { type: String, default: null },
    city: { type: String, default: null },

    premium: { type: Boolean, default: false },
    verification: {
      type: String,
      enum: ["none", "verified", "legitimized"],
      default: "none",
    },

    onboardingStatus: {
      type: String,
      enum: ["incomplete", "pendingDocs", "complete"],
      default: "incomplete",
    },

    auditTrail: {
      type: [{ date: Date, action: String, details: Schema.Types.Mixed }],
      default: [],
    },

    limits: { type: Schema.Types.Mixed, default: {} },

    quickLogin: { type: Boolean, default: false },
    eventRef: { type: String, default: null },
    questionRef: { type: String, default: null },

    // MFA
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, default: null, select: false },
    mfaBackupCodes: { type: [String], default: [], select: false },
    lastMfaChallengeAt: { type: Date, default: null },

    // interne Lowercase-Spiegelung für case-insensitive Eindeutigkeit
    username_lc: { type: String, select: false },
  },
  { timestamps: true },
);

// -----------------------------
// ---- Normalisierung & Validierung ----
// -----------------------------
UserProfileSchema.path("region").validate({
  validator: (v: string | null) => !v || /^[A-Z0-9:-]+$/.test(v),
  message: "region must be a normalized code (e.g., ISO2:DE or ISO2-2:DE-BY)",
});

// Case-insensitive Eindeutigkeit für username
UserProfileSchema.pre("save", function (next) {
  // @ts-ignore `this` is the doc
  if (this.isModified("username") && typeof this.username === "string") {
    // @ts-ignore
    this.username_lc = this.username.toLowerCase();
  }
  next();
});

// (Optional, Security) — MFA-Backupcodes gehasht speichern
UserProfileSchema.pre("save", function (next) {
  // @ts-ignore
  if (this.isModified("mfaBackupCodes") && Array.isArray(this.mfaBackupCodes)) {
    // @ts-ignore
    this.mfaBackupCodes = this.mfaBackupCodes.map((c: string) =>
      crypto.createHash("sha256").update(c).digest("hex"),
    );
  }
  next();
});

// -----------------------------
// Indizes — zentral & eindeutig definiert
// -----------------------------
// Hinweis: Behalte den case-sensitiven Unique-Index auf `username`,
// und ergänze den case-insensitiven Schutz via `username_lc`.
UserProfileSchema.index({ username: 1 }, { unique: true }); // case-sensitive
UserProfileSchema.index(
  { username_lc: 1 },
  {
    unique: true,
    // erlaubt viele Docs ohne username_lc (Altbestand), schützt aber neue/aktualisierte
    partialFilterExpression: { username_lc: { $type: "string" } },
  },
);

UserProfileSchema.index(
  { email: 1 },
  { partialFilterExpression: { email: { $type: "string" } } },
);

UserProfileSchema.index({ status: 1, premium: 1 });
UserProfileSchema.index({ region: 1 });
UserProfileSchema.index({ "roles.role": 1 });

// -----------------------------
// Model
// -----------------------------
export default modelOn(conn, "UserProfile", UserProfileSchema, "user_profiles");
