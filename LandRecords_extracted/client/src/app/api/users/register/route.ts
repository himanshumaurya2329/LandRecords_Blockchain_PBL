import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/db/connect';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { sendOTPEmail } from '@/lib/utils/email';
import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 }
});
const OTPModel = mongoose.models.OTP || mongoose.model('OTP', otpSchema);

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateDID(aadhar: string, username: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(`${aadhar}:${username}:${Date.now()}`)
    .digest('hex')
    .slice(0, 32);
  return `did:hf:org1:${hash}`;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { action } = body;

    if (action === 'sendOTP') {
      const { email, firstName } = body;
      if (!email) return NextResponse.json({ message: 'Email required' }, { status: 400 });
      const otp = generateOTP();
      await OTPModel.deleteMany({ email });
      await OTPModel.create({ email, otp });
      const emailResult = await sendOTPEmail(email, otp, firstName || 'User');
      return NextResponse.json({
        message: 'OTP sent to your email',
        emailSent: emailResult.success,
        otp // visible in dev for testing
      });
    }

    if (action === 'verifyAndRegister' || action === 'register') {
      const {
        firstName, middleName, lastName, dateOfBirth, gender,
        phone, email, aadhar, address, username, password, otp
      } = body;

      // Verify OTP from MongoDB
      const otpRecord = await OTPModel.findOne({ email, otp });
      if (!otpRecord) {
        return NextResponse.json(
          { message: 'Invalid or expired OTP. Please request a new OTP.' },
          { status: 400 }
        );
      }

      // Check existing user
      const existingUser = await User.findOne({
        $or: [{ email }, { username }, { aadhar }]
      }).select('+password');

      if (existingUser) {
        if (existingUser.email === email)
          return NextResponse.json({ message: 'Email already registered' }, { status: 400 });
        if (existingUser.username === username)
          return NextResponse.json({ message: 'Username already taken' }, { status: 400 });
        if (existingUser.aadhar === aadhar)
          return NextResponse.json({ message: 'Aadhar already registered' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const did = generateDID(aadhar, username);
      await User.create({
        firstName, middleName, lastName,
        dateOfBirth: new Date(dateOfBirth),
        gender, phone, email, aadhar, address, username,
        password: hashedPassword,
        did,
      });

      await OTPModel.deleteMany({ email });
      return NextResponse.json({ message: 'User registered successfully' }, { status: 201 });
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Registration failed' },
      { status: 500 }
    );
  }
}
