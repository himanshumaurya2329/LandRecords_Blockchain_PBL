import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Official, { DESIGNATIONS } from '@/lib/models/Official';
import bcryptjs from 'bcryptjs';
import { generateOTP, storeOTP, verifyOTP } from '@/lib/utils/otp';
import { sendOTPEmail } from '@/lib/utils/email';

// POST: Send OTP to email
export async function POST(request: NextRequest) {
  try {
    const { action, firstName, lastName, designation, department, email, phone, officeId, username, password, otp } = await request.json();

    // Action 1: Send OTP
    if (action === 'sendOTP') {
      const errors: Record<string, string> = {};

      if (!email?.trim()) errors.email = 'Email is required';
      if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        errors.email = 'Invalid email format';
      }

      if (Object.keys(errors).length > 0) {
        return NextResponse.json({ errors }, { status: 400 });
      }

      const generatedOTP = generateOTP();
      storeOTP(email, generatedOTP);

      // Send email with OTP using Nodemailer
      const emailResult = await sendOTPEmail(email, generatedOTP, firstName || 'Official');

      return NextResponse.json(
        { 
          message: 'OTP sent to your email',
          otp: process.env.NODE_ENV === 'development' ? generatedOTP : undefined, // Only show in dev
          emailSent: emailResult.success 
        },
        { status: 200 }
      );
    }

    // Action 2: Verify OTP and Register
    if (action === 'verifyAndRegister') {
      const errors: Record<string, string> = {};

      // Validate OTP
      if (!otp?.trim()) {
        errors.otp = 'OTP is required';
      } else if (!verifyOTP(email, otp)) {
        errors.otp = 'Invalid or expired OTP';
      }

      if (!firstName?.trim()) errors.firstName = 'First name is required';
      if (!lastName?.trim()) errors.lastName = 'Last name is required';
      if (!designation) errors.designation = 'Designation is required';
      if (!DESIGNATIONS.includes(designation)) {
        errors.designation = 'Invalid designation';
      }
      if (!department?.trim()) errors.department = 'Department is required';
      if (!email?.trim()) errors.email = 'Email is required';
      if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        errors.email = 'Invalid email format';
      }
      if (!phone?.trim()) errors.phone = 'Phone number is required';
      if (!/^\d{10}$/.test(phone)) errors.phone = 'Phone must be 10 digits';
      if (!officeId?.trim()) errors.officeId = 'Office ID is required';
      if (!username?.trim()) errors.username = 'Username is required';
      if (!password) errors.password = 'Password is required';
      if (password?.length < 6) errors.password = 'Password must be at least 6 characters';

      if (Object.keys(errors).length > 0) {
        return NextResponse.json({ errors }, { status: 400 });
      }

      await connectDB();

      // Check for existing official
      const existingOfficeId = await Official.findOne({ officeId });
      if (existingOfficeId) {
        return NextResponse.json(
          { errors: { officeId: 'Office ID already registered' } },
          { status: 400 }
        );
      }

      const existingUsername = await Official.findOne({ username });
      if (existingUsername) {
        return NextResponse.json(
          { errors: { username: 'Username already taken' } },
          { status: 400 }
        );
      }

      // Hash password
      const hashedPassword = await bcryptjs.hash(password, 10);

      // Create official
      const official = new Official({
        firstName,
        lastName,
        designation,
        department,
        email,
        phone,
        officeId,
        username,
        password: hashedPassword,
        isVerified: true,
      });

      await official.save();

      return NextResponse.json(
        { message: 'Official registered successfully' },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { message: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
