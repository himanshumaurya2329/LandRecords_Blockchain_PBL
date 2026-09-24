import mongoose, { Schema, Document, Model } from 'mongoose';
import crypto from 'crypto';

export interface ILandRequest extends Document {
  txnId?: string;
  nature: 'electronic' | 'physical';
  createdBy: string; // User ID

  // Personal Details
  fullName: string;
  email: string;
  phoneNumber: string;
  aadharNumber: string;
  dob: Date;

  // Land Registration Details
  ownerName: string;
  surveyNumber: string;
  area: string;
  address: string;
  state: string;
  city: string;
  pincode: string;

  // Document Uploads
  documentUrl?: string;
  receiptUrl?: string;
  pattaUrl?: string;
  ipfsHash?: string;
  docHash?: string;

  // Receipt Number
  receiptNumber: string;

  // Workflow
  status: 'submitted' | 'with_clerk' | 'with_superintendent' | 'with_projectofficer' | 'with_vro' | 'with_surveyor' | 'with_revenueinspector' | 'with_mro' | 'with_revenuedeptofficer' | 'with_jointcollector' | 'with_districtcollector' | 'with_ministrywelfare' | 'approved' | 'completed' | 'rejected';
  currentlyWith?: string; // Official ID

  // Patta Certificate Fields
  pattaHash?: string; // IPFS hash of generated Patta
  pattaNumber?: string; // Patta certificate number
  certificateNumber?: string; // Full certificate number
  pattaGeneratedAt?: Date; // Date when Patta was generated
  pattaHtmlContent?: string; // Store HTML content directly (fallback for blocked IPFS)

  // Additional Fields for Patta Generation
  fatherName?: string;
  aadhaar?: string;
  district?: string;
  mandal?: string;
  village?: string;

  // Survey Data (added by Surveyor)
  surveyData?: {
    pointA?: { lat: number; long: number };
    pointB?: { lat: number; long: number };
    pointC?: { lat: number; long: number };
    pointD?: { lat: number; long: number };
    measuredArea?: string;
    boundaryMapHash?: string; // IPFS hash of boundary map
    surveyDate?: Date;
  };
  fieldPhotos?: string[]; // Array of IPFS hashes for field photos
  surveyRemarks?: string;

  // History/Timeline - Track all official actions
  actionHistory?: Array<{
    officialId: string;
    officialName: string;
    designation: string;
    action: 'approved' | 'rejected' | 'data_added' | 'forwarded';
    remarks?: string;
    timestamp: Date;
    data?: any; // Role-specific data added by the official
    blockNumber?: number;
  }>;

  // Additional Fields
  compNo?: string;
  fileNo?: string;
  subject?: string;
  sentTo?: string;
  dueOn?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const landRequestSchema = new Schema<ILandRequest>(
  {
    txnId: {
      type: String,
      sparse: true,
    },
    nature: {
      type: String,
      enum: ['electronic', 'physical'],
      default: 'electronic',
    },
    createdBy: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    aadharNumber: {
      type: String,
      required: true,
    },
    dob: {
      type: Date,
      required: true,
    },
    ownerName: {
      type: String,
      required: true,
    },
    surveyNumber: {
      type: String,
      required: true,
    },
    area: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    documentUrl: String,
    receiptUrl: String,
    pattaUrl: String,
    ipfsHash: String,
    docHash: String,
    receiptNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ['submitted', 'with_clerk', 'with_superintendent', 'with_projectofficer', 'with_vro', 'with_surveyor', 'with_revenueinspector', 'with_mro', 'with_revenuedeptofficer', 'with_jointcollector', 'with_districtcollector', 'with_ministrywelfare', 'approved', 'completed', 'rejected'],
      default: 'submitted',
    },
    currentlyWith: String,
    // Patta Certificate Fields
    pattaHash: String,
    pattaNumber: String,
    certificateNumber: String,
    pattaGeneratedAt: Date,
    pattaHtmlContent: String, // Store HTML content directly (fallback for blocked IPFS)
    // Additional Fields for Patta
    fatherName: String,
    aadhaar: String,
    district: String,
    mandal: String,
    village: String,
    // Survey Data
    surveyData: {
      pointA: {
        lat: Number,
        long: Number,
      },
      pointB: {
        lat: Number,
        long: Number,
      },
      pointC: {
        lat: Number,
        long: Number,
      },
      pointD: {
        lat: Number,
        long: Number,
      },
      measuredArea: String,
      boundaryMapHash: String,
      surveyDate: Date,
    },
    fieldPhotos: [String],
    surveyRemarks: String,
    // Action History with Transaction IDs
    actionHistory: [
      {
        transactionId: {
          type: String,
          required: true,
          unique: false, // Multiple actions can exist, but each has unique txId
          index: true,
        },
        blockNumber: Number,
        officialId: String,
        officialName: String,
        designation: String,
        action: {
          type: String,
          enum: ['approved', 'rejected', 'data_added', 'forwarded'],
        },
        remarks: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        data: Schema.Types.Mixed, // Can store any role-specific data
        documents: [{
          fileName: String,
          fileType: String, // 'pdf' | 'image' | 'document'
          ipfsHash: String,
          uploadedAt: { type: Date, default: Date.now },
          size: Number, // File size in bytes
        }], // Array of uploaded documents with IPFS links
      },
    ],
    compNo: String,
    fileNo: String,
    subject: String,
    sentTo: String,
    dueOn: Date,
  },
  {
    timestamps: true,
  }
);

// Generate receipt number before saving
landRequestSchema.pre('save', async function (next) {
  if (!this.receiptNumber) {
    this.receiptNumber = crypto.randomBytes(5).toString('hex').toUpperCase();
  }
  next();
});

let LandRequest: Model<ILandRequest>;

try {
  LandRequest = mongoose.model<ILandRequest>('LandRequest');
} catch (error) {
  LandRequest = mongoose.model<ILandRequest>('LandRequest', landRequestSchema);
}

export default LandRequest;
