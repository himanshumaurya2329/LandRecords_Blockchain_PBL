import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILandApplication extends Document {
  applicationId: string;
  userId: string;
  userName: string;
  userEmail: string;
  surveyNumber: string;
  landArea: string;
  location: string;
  ipfsHash?: string;
  documents: Array<{
    type: string;
    url: string;
    uploadedAt: Date;
  }>;
  currentStage: 'clerk' | 'superintendent' | 'projectofficer' | 'vro' | 'surveyor' | 'revenueInspector' | 'mro' | 'revenueDeptOfficer' | 'jointCollector' | 'districtCollector' | 'ministryWelfare';
  stageHistory: Array<{
    stage: string;
    officialId: string;
    officialName: string;
    officialDesignation: string;
    status: 'pending' | 'approved' | 'rejected' | 'sent_back';
    comments: string;
    actionDate: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const landApplicationSchema = new Schema<ILandApplication>(
  {
    applicationId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    surveyNumber: {
      type: String,
      required: true,
    },
    landArea: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    ipfsHash: {
      type: String,
      default: null,
    },
    documents: [
      {
        type: String,
        url: String,
        uploadedAt: Date,
      },
    ],
    currentStage: {
      type: String,
      enum: ['clerk', 'superintendent', 'projectofficer', 'vro', 'surveyor', 'revenueInspector', 'mro', 'revenueDeptOfficer', 'jointCollector', 'districtCollector', 'ministryWelfare'],
      default: 'clerk',
    },
    stageHistory: [
      {
        stage: String,
        officialId: String,
        officialName: String,
        officialDesignation: String,
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected', 'sent_back'],
        },
        comments: String,
        actionDate: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

let LandApplication: Model<ILandApplication>;

try {
  LandApplication = mongoose.model<ILandApplication>('LandApplication');
} catch (error) {
  LandApplication = mongoose.model<ILandApplication>('LandApplication', landApplicationSchema);
}

export default LandApplication;
