import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'clinician' | 'admin';

export interface UserDoc extends Document {
  username: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDoc>({
  username:   { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role:       { type: String, enum: ['clinician','admin'], default: 'clinician' }
}, { timestamps: true });

export const User: Model<UserDoc> =
  mongoose.models.User || mongoose.model<UserDoc>('User', UserSchema);
