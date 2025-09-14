import mongoose, { Schema, Document, Model } from 'mongoose';

export type RecordType =
  | 'vitals'
  | 'visitNote'
  | 'diagnosis'
  | 'labResult'
  | 'medication'
  | 'immunization'
  | 'allergy'
  | 'attachment'; // file meta

export interface RecordDoc extends Document {
  recordId: string;             // human-readable/short id like R-00001
  patientId: string;            // link to Patient.patientId
  type: RecordType;
  payload: any;                 // validated by Zod per type
  createdBy: { userId: string; username: string; role: 'clinician'|'admin' };
  tags?: string[];
  effectiveAt?: Date;           // when the observation happened
  fhirRef?: { resourceType: string; id: string }; // optional, future FHIR link
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;      // soft delete
  revision: number;             // increment on update
}

const RecordSchema = new Schema<RecordDoc>({
  recordId:  { type: String, required: true, unique: true, index: true },
  patientId: { type: String, required: true, index: true },
  type:      { type: String, required: true,
               enum: ['vitals','visitNote','diagnosis','labResult','medication','immunization','allergy','attachment'] },
  payload:   { type: Schema.Types.Mixed, required: true },
  createdBy: {
    userId:   { type: String, required: true },
    username: { type: String, required: true },
    role:     { type: String, enum: ['clinician','admin'], required: true },
  },
  tags:       [{ type: String }],
  effectiveAt:{ type: Date },
  fhirRef:    { resourceType: String, id: String },
  deletedAt:  { type: Date, default: null },
  revision:   { type: Number, default: 1 },
}, { timestamps: true });

export const Record: Model<RecordDoc> =
  mongoose.models.Record || mongoose.model<RecordDoc>('Record', RecordSchema);
