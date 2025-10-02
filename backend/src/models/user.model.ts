import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'clinician' | 'admin' | 'patient';

export interface UserDoc extends Document {
  username: string;            // email or phone-based username
  passwordHash: string;
  role: UserRole;
  linkedPatientId?: string;    // set when role === 'patient'
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDoc>({
  username:        { type: String, required: true, unique: true, index: true },
  passwordHash:    { type: String, required: true },
  role:            { type: String, enum: ['clinician','admin','patient'], required: true, default: 'patient' },
  linkedPatientId: { type: String } // optional; add index if you plan lookups
}, { timestamps: true });

export const User: Model<UserDoc> =
  mongoose.models.User || mongoose.model<UserDoc>('User', UserSchema);
