import mongoose, { Schema, Document } from 'mongoose';
export interface IDigiLockerVault extends Document {
  citizenAadhar: string;
  citizenName: string;
  citizenEmail: string;
  documentType: 'aadhaar_card' | 'land_deed';
  fileData: string; // base64 PDF stored here
  fileName: string;
  uploadedBy: string;
  isVerified: boolean;
  verifiedAt: Date;
  ipfsHash?: string; // set only after citizen approves official request
  docHash?: string; // SHA-256 hash of the document content for on-chain security
}
const DigiLockerVaultSchema = new Schema({
  citizenAadhar: { type: String, required: true },
  citizenName: { type: String, required: true },
  citizenEmail: { type: String, required: true },
  documentType: { type: String, enum: ['aadhaar_card', 'land_deed'], required: true },
  fileData: { type: String, required: true }, // base64
  fileName: { type: String, required: true },
  uploadedBy: { type: String, required: true, default: 'government_authority' },
  isVerified: { type: Boolean, default: true },
  verifiedAt: { type: Date, default: Date.now },
  ipfsHash: { type: String }, // only set after approval
}, { timestamps: true });
export default mongoose.models.DigiLockerVault ||
  mongoose.model<IDigiLockerVault>('DigiLockerVault', DigiLockerVaultSchema);
