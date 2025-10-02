import mongoose, { Schema, Document, Model } from 'mongoose';

export type CertStatus = 'DRAFT' | 'SIGNED' | 'REVOKED';

export interface CertificateDoc extends Document {
  certificateId: string;         // human-readable ID
  patientId: string;             // link to Patient.patientId
  type: 'DrivingLicenceMedical' | 'ImmigrationMedical';
  status: CertStatus;
  issuedAt?: Date;
  revokedAt?: Date;
  hash?: string;                 // PDF hash (for later)
  url?: string;                  // S3 link (for later)
  verifyCode?: string;           // e.g. “X7K9-3T”
  qrPayload?: string;            // e.g. https://yourdomain/verify?code=...
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

  // NEW ↓
  verifyCode:    { type: String, unique: true, sparse: true },   // e.g. “X7K9-3T”
  qrPayload:     { type: String }                                 // e.g. https://yourdomain/verify?code=...
}, { timestamps: true });


export const Certificate: Model<CertificateDoc> =
  mongoose.models.Certificate || mongoose.model<CertificateDoc>('Certificate', CertificateSchema);
