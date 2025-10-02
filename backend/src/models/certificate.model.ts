import mongoose, { Schema, Document, Model } from 'mongoose';

export type CertStatus = 'DRAFT' | 'SIGNED' | 'REVOKED';

export interface CertificateDoc extends Document {
  certificateId: string;
  patientId: string;
  type: 'DrivingLicenceMedical' | 'ImmigrationMedical';
  status: CertStatus;
  issuedAt?: Date;
  revokedAt?: Date;
  hash?: string;
  url?: string;

  // NEW
  verifyCode?: string;       // e.g., "ABCD-EFGH"
  qrPayload?: string;        // e.g., "https://<host>/verify?code=ABCD-EFGH"

  createdAt: Date;
  updatedAt: Date;
}

const CertificateSchema = new Schema<CertificateDoc>({
  certificateId: { type: String, required: true, unique: true, index: true },
  patientId:     { type: String, required: true, index: true },
  type:          { type: String, enum: ['DrivingLicenceMedical','ImmigrationMedical'], required: true },
  status:        { type: String, enum: ['DRAFT','SIGNED','REVOKED'], default: 'DRAFT' },
  issuedAt:      { type: Date },
  revokedAt:     { type: Date },
  hash:          { type: String },
  url:           { type: String },

  // NEW
  verifyCode:    { type: String, unique: true, sparse: true },
  qrPayload:     { type: String },
}, { timestamps: true });

export const Certificate: Model<CertificateDoc> =
  mongoose.models.Certificate || mongoose.model<CertificateDoc>('Certificate', CertificateSchema);
