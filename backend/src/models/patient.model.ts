import mongoose, { Schema, Document, Model } from 'mongoose';

export interface PatientDoc extends Document {
  patientId: string;        // your own ID (not _id)
  name: string;
  phone?: string;
  dob?: Date;               // date of birth
  sex?: 'male' | 'female' | 'other';
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<PatientDoc>(
  {
    patientId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, index: true, unique: false },// set unique: true if you want hard uniqueness

    dob: { type: Date },
    sex: { type: String, enum: ['male', 'female', 'other'] }
  },
  { timestamps: true }
);

export const Patient: Model<PatientDoc> =
  mongoose.models.Patient || mongoose.model<PatientDoc>('Patient', PatientSchema);
