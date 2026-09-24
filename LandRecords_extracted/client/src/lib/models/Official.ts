import mongoose, { Schema, Document, Model } from 'mongoose';

import { DESIGNATIONS } from '@/lib/constants';

export interface IOfficial extends Document {
  firstName: string;
  lastName: string;
  designation: string;
  department: string;
  email: string;
  phone: string;
  officeId: string;
  username: string;
  password: string;
  isVerified: boolean;
  verificationToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const officialSchema = new Schema<IOfficial>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    designation: {
      type: String,
      enum: DESIGNATIONS,
      required: [true, 'Designation is required'],
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^\d{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    officeId: {
      type: String,
      required: [true, 'Office ID is required'],
      unique: true,
      trim: true,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

let Official: Model<IOfficial>;

try {
  Official = mongoose.model<IOfficial>('Official');
} catch (error) {
  Official = mongoose.model<IOfficial>('Official', officialSchema);
}

export default Official;
