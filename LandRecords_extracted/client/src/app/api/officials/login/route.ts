import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import connectDB from "@/lib/db/connect";
import Official from "@/lib/models/Official";
import { createSession, deleteSession, getSessionCookieOptions } from "@/lib/utils/session";
import { getSessionCookieName } from "@/lib/utils/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { username, password, designation } = body;

    if (!username || !password || !designation) {
      return NextResponse.json({ error: "Username, password, and designation are required" }, { status: 400 });
    }

    // Delete any existing session first (prevents cross-user data contamination)
    const existingToken = req.cookies.get(getSessionCookieName())?.value;
    if (existingToken) {
      try { await deleteSession(existingToken); } catch {}
    }

    const official = await Official.findOne({ username, designation }).select("+password");
    if (!official) {
      return NextResponse.json({ error: "Invalid username, password, or designation" }, { status: 401 });
    }

    const isPasswordValid = await compare(password, official.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid username, password, or designation" }, { status: 401 });
    }

    // Create fresh official session
    const session = await createSession(undefined, official._id.toString(), "official");

    const response = NextResponse.json(
      {
        message: "Login successful",
        official: {
          id: official._id,
          username: official.username,
          firstName: official.firstName,
          lastName: official.lastName,
          designation: official.designation,
          officeId: official.officeId,
          email: official.email,
        },
      },
      { status: 200 }
    );

    // Set new session cookie (overwrites any old one)
    response.cookies.set(getSessionCookieName(), session.sessionToken, getSessionCookieOptions());

    return response;
  } catch (error) {
    console.error("Official login error:", error);
    return NextResponse.json({ error: "An error occurred during login" }, { status: 500 });
  }
}
