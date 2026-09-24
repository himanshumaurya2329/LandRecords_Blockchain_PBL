import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISession extends Document {
  userId?: string;
  officialId?: string;
  adminId?: string;
  userType: 'user' | 'official' | 'admin';
  sessionToken: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: String,
      sparse: true,
    },
    officialId: {
      type: String,
      sparse: true,
    },
    adminId: {
      type: String,
      sparse: true,
    },
    userType: {
      type: String,
      enum: ['user', 'official', 'admin'],
      required: true,
    },
    sessionToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
      expires: 0, // MongoDB will automatically delete expired documents
    },
  },
  {
    timestamps: true,
  }
);

// Delete the cached model to force recreation with new schema
if (mongoose.models.Session) {
  delete mongoose.models.Session;
}

const Session: Model<ISession> = mongoose.model<ISession>('Session', sessionSchema);

export default Session;
