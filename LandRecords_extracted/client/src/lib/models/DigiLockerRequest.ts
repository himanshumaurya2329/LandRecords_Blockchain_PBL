import mongoose, { Schema, Document } from 'mongoose';

export interface IDigiLockerRequest extends Document {
  applicationId: string;
  requestedBy: string;
  requestedByDesignation: string;
  citizenUsername: string;
  citizenEmail: string;
  documentType: string;
  ipfsHash: string;
  docHash: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  respondedAt?: Date;
  citizenResponse?: string;
}

const DigiLockerRequestSchema = new Schema({
  applicationId: { type: String, required: true },
  requestedBy: { type: String, required: true },
  requestedByDesignation: { type: String, required: true },
  citizenUsername: { type: String, required: true },
  citizenEmail: { type: String, required: true },
  documentType: { type: String, required: true },
  ipfsHash: { type: String, required: false, default: '' },
  docHash: { type: String, required: false, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  requestedAt: { type: Date, default: Date.now },
  respondedAt: { type: Date },
  citizenResponse: { type: String },
}, { timestamps: true });

export default mongoose.models.DigiLockerRequest ||
  mongoose.model<IDigiLockerRequest>('DigiLockerRequest', DigiLockerRequestSchema);
