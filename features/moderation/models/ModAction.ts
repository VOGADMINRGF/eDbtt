// features/moderation/models/ModAction.ts

import mongoose, { Schema, Document } from "mongoose";

/**
 * ModAction-Model: Dokumentiert jede redaktionelle/moderative Aktion
 * - Zentrale Review-/Moderationshistorie
 * - Referenzierbar von Statement oder UserProfile
 */

export interface IModAction extends Document {
  targetId: string;                   // ID des Zielobjekts (Statement/User/Contribution)
  targetType: "statement" | "user" | "contribution";
  action: string;                     // z.B. "flagged", "approved", "hidden"
  by: string;                         // userId des Moderators
  date: Date;
  reason?: string;                    // Grund für die Aktion
  statusAfter?: string;               // Status nach Aktion
  notes?: string;                     // Zusatzinfos
  legalReference?: string;            // Rechtlicher Bezug (z.B. DSGVO)
  ipAddress?: string;
  deviceInfo?: string;
}

const ModActionSchema = new Schema<IModAction>(
  {
    targetId: { type: String, required: true },
    targetType: { type: String, enum: ["statement", "user", "contribution"], required: true },
    action: { type: String, required: true },
    by: { type: String, required: true },
    date: { type: Date, default: Date.now },
    reason: { type: String },
    statusAfter: { type: String },
    notes: { type: String },
    legalReference: { type: String },
    ipAddress: { type: String },
    deviceInfo: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.ModAction ||
  mongoose.model<IModAction>("ModAction", ModActionSchema);
