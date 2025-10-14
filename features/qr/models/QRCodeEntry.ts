import mongoose, { Schema, Document, Types } from "mongoose";

export type QRTargetType = "statement" | "contribution" | "stream" | "set" | "custom";

export interface QRCodeEntry extends Document {
  targetType: QRTargetType;
  targetIds: Types.ObjectId[]; // Kann mehrere IDs referenzieren (Set, Multiple Statements, etc.)
  ownerId: Types.ObjectId;     // Wer hat diesen QR-Code erzeugt
  title?: string;
  description?: string;
  isPremium?: boolean;
  fileUpload?: string;         // Pfad zur Originaldatei (optional)
  gptSummary?: string;         // Optionaler KI-Output
  expiresAt?: Date;
  eventRef?: string;
  createdAt: Date;
}

const QRCodeEntrySchema = new Schema<QRCodeEntry>(
  {
    targetType: { type: String, required: true, enum: ["statement", "contribution", "stream", "set", "custom"] },
    targetIds: [{ type: Schema.Types.ObjectId, required: true }],
    ownerId: { type: Schema.Types.ObjectId, ref: "UserProfile", required: true },
    title: String,
    description: String,
    isPremium: { type: Boolean, default: false },
    fileUpload: String,
    gptSummary: String,
    expiresAt: Date,
    eventRef: String,
  },
  { timestamps: true }
);

QRCodeEntrySchema.index({ ownerId: 1, targetType: 1, eventRef: 1 });

export default mongoose.models.QRCodeEntry ||
  mongoose.model<QRCodeEntry>("QRCodeEntry", QRCodeEntrySchema);
