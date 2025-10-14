// apps/web/src/models/Vote.ts
import { Schema, model, models, Types } from "mongoose";
import { votesConn } from "@lib/db/votes";

export type VoteChoice = "agree" | "neutral" | "disagree";

export interface IVote {
  // Pseudonym statt PII: stabiler Hash (z. B. HMAC(userId, server-side PEPPER))
  userHash: string;

  // Statement-Ref als ObjectId (Strings funktionieren auch; OID ist effizienter)
  statementId: Types.ObjectId;

  choice: VoteChoice;

  // Strukturierte Region (für EU/NUTS/AGS kannst du erweitern)
  region?: {
    country?: string; // ISO-3166-1 alpha-2 (DE, FR, …)
    state?: string; // z. B. "BY", "BE-BRU", NUTS2
    city?: string; // frei
  };

  device?: "mobile" | "desktop" | "api";
  source?: "web" | "app" | "api";
  voteGroup?: string; // A/B, Experimente
  graphEdgeId?: string; // Verknüpfung in GraphDB

  // Timeseries-Bucket (UTC 00:00), wird automatisch gesetzt
  day: Date;

  deletedAt?: Date; // Soft-Delete
  createdAt: Date;
  updatedAt: Date;
}

const VoteSchema = new Schema<IVote>(
  {
    userHash: { type: String, required: true, index: true, trim: true },
    statementId: { type: Schema.Types.ObjectId, required: true, index: true },
    choice: {
      type: String,
      enum: ["agree", "neutral", "disagree"],
      required: true,
    },

    region: {
      country: {
        type: String,
        trim: true,
        uppercase: true,
        minlength: 2,
        maxlength: 2,
      },
      state: { type: String, trim: true, maxlength: 64 },
      city: { type: String, trim: true, maxlength: 96 },
    },

    device: {
      type: String,
      enum: ["mobile", "desktop", "api"],
      required: false,
    },
    source: { type: String, enum: ["web", "app", "api"], required: false },
    voteGroup: { type: String, trim: true, maxlength: 64 },
    graphEdgeId: { type: String, trim: true, maxlength: 96 },

    // UTC-Tag, default über pre-save Hook
    day: { type: Date, required: true, index: true },

    deletedAt: { type: Date },
  },
  {
    timestamps: true, // createdAt / updatedAt
    minimize: true,
    versionKey: false,
  },
);

/** Ein Vote pro (statementId,userHash) – nur für nicht-gelöschte Dokumente */
VoteSchema.index(
  { statementId: 1, userHash: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: { $exists: false } },
  },
);

// Analytics-freundliche Indizes (Timeseries/Aggregationen)
VoteSchema.index({ statementId: 1, day: 1 });
VoteSchema.index({
  "region.country": 1,
  "region.state": 1,
  "region.city": 1,
  day: 1,
});
VoteSchema.index({ voteGroup: 1, day: 1 });

/** day (UTC Mitternacht) automatisch setzen */
VoteSchema.pre("validate", function (next) {
  if (!this.day) {
    const d = new Date();
    // zu UTC 00:00 normalisieren
    d.setUTCHours(0, 0, 0, 0);
    this.day = d;
  }
  next();
});

/** Soft-Delete Helper */
VoteSchema.methods.softDelete = async function () {
  if (!this.deletedAt) {
    this.deletedAt = new Date();
    await this.save();
  }
};

/** Upsert-Helfer: setzt/ändert die Wahl eines Users zu einem Statement */
VoteSchema.statics.upsertUserVote = async function (args: {
  statementId: Types.ObjectId | string;
  userHash: string;
  choice: VoteChoice;
  meta?: Partial<
    Pick<IVote, "region" | "device" | "source" | "voteGroup" | "graphEdgeId">
  >;
}) {
  const { statementId, userHash, choice, meta } = args;
  const sid =
    typeof statementId === "string"
      ? new Types.ObjectId(statementId)
      : statementId;

  // Day (UTC Mitternacht)
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);

  return this.findOneAndUpdate(
    { statementId: sid, userHash, deletedAt: { $exists: false } },
    {
      $set: {
        choice,
        day: d,
        ...(meta || {}),
      },
      $setOnInsert: {
        statementId: sid,
        userHash,
      },
      $unset: { deletedAt: "" },
    },
    { new: true, upsert: true },
  ).lean();
};

export type VoteDoc = IVote & { _id: Types.ObjectId };

export function VoteModel() {
  // Wichtig: *votes*-Cluster nutzen (keine PII in diesem DB!)
  const conn = votesConn();
  return (conn.models.Vote as any) || conn.model("Vote", VoteSchema, "votes");
}
