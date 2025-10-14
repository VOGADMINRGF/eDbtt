import mongoose, { Schema } from "mongoose";

const OrgSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["ngo", "party", "media"], required: true },
  verified: { type: Boolean, default: false },
  region: String,
  premium: { type: Boolean, default: false },
  members: [{ userId: String, subRole: String }], // UserID + Rolle in Org
  limits: {
    reportsPerMonth: { type: Number, default: 10 },
    teamSize: { type: Number, default: 5 }
  },
  auditTrail: [{
    date: Date,
    action: String,
    details: Schema.Types.Mixed
  }],
}, { timestamps: true });

export default mongoose.models.Organization || mongoose.model("Organization", OrgSchema);
