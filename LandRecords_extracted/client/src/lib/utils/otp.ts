// Simple in-memory OTP storage (for demo - use Redis in production)
const otpStore: Record<string, { code: string; expiresAt: number; email: string }> = {};

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function storeOTP(email: string, otp: string): void {
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore[email] = { code: otp, expiresAt, email };
}

export function verifyOTP(email: string, otp: string): boolean {
  const storedOtp = otpStore[email];

  if (!storedOtp) {
    return false;
  }

  if (Date.now() > storedOtp.expiresAt) {
    delete otpStore[email];
    return false;
  }

  if (storedOtp.code === otp) {
    delete otpStore[email];
    return true;
  }

  return false;
}

export function getOTPExpiry(email: string): number | null {
  const storedOtp = otpStore[email];
  if (!storedOtp) return null;
  return Math.ceil((storedOtp.expiresAt - Date.now()) / 1000);
}

export function clearOTP(email: string): void {
  delete otpStore[email];
}
