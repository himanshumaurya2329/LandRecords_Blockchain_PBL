import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILandRequestHistory extends Document {
  landRequestId: string;
  historyId: string;
  fromUser?: string;
  toUser?: string;
  fromDesignation?: string;
  toDesignation?: string;
  action: 'forwarded' | 'rejected' | 'approved' | 'sent_back';
  remarks?: string;
  timestamp: Date;
}

const landRequestHistorySchema = new Schema<ILandRequestHistory>(
  {
    landRequestId: {
      type: String,
      required: true,
      index: true,
    },
    historyId: {
      type: String,
      unique: true,
      required: true,
    },
    fromUser: String,
    toUser: String,
    fromDesignation: String,
    toDesignation: String,
    action: {
      type: String,
      enum: ['forwarded', 'rejected', 'approved', 'sent_back'],
      required: true,
    },
    remarks: String,
  },
  {
    timestamps: true,
  }
);

let LandRequestHistory: Model<ILandRequestHistory>;

try {
  LandRequestHistory = mongoose.model<ILandRequestHistory>('LandRequestHistory');
} catch (error) {
  LandRequestHistory = mongoose.model<ILandRequestHistory>('LandRequestHistory', landRequestHistorySchema);
}

export default LandRequestHistory;
