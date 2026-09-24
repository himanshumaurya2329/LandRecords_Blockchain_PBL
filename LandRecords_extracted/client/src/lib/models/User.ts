import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email: string;
  aadhar: string;
  address: string;
  username: string;
  password: string;
  did?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: [true, 'Gender is required'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^\d{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    aadhar: {
      type: String,
      required: [true, 'Aadhar number is required'],
      unique: true,
      match: [/^\d{12}$/, 'Please provide a valid 12-digit Aadhar number'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
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
    did: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

let User: Model<IUser>;

try {
  User = mongoose.model<IUser>('User');
} catch (error) {
  User = mongoose.model<IUser>('User', userSchema);
}

export default User;
