export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, signJWT, setSessionCookie } from "@/lib/auth";

// In-memory rate limiting map for login attempts
const loginAttempts = new Map<string, { count: number; lockUntil: number }>();

const MAX_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown_ip";
    const body = await req.json();
    const { username, password, role } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required." },
        { status: 400 }
      );
    }

    const rateKey = `${ip}:${username.trim().toLowerCase()}`;
    const now = Date.now();
    const rateData = loginAttempts.get(rateKey);

    if (rateData && rateData.lockUntil > now) {
      const waitMinutes = Math.ceil((rateData.lockUntil - now) / 60000);
      return NextResponse.json(
        {
          success: false,
          error: `Too many failed login attempts. Please try again in ${waitMinutes} minute(s).`,
        },
        { status: 429 }
      );
    }

    const authResult = await authenticateUser(username, password, role);

    if (!authResult.success || !authResult.user) {
      const currentAttempts = (rateData?.count || 0) + 1;
      if (currentAttempts >= MAX_ATTEMPTS) {
        loginAttempts.set(rateKey, { count: currentAttempts, lockUntil: now + LOCK_TIME_MS });
      } else {
        loginAttempts.set(rateKey, { count: currentAttempts, lockUntil: 0 });
      }

      return NextResponse.json(
        { success: false, error: authResult.error || "Invalid credentials." },
        { status: 401 }
      );
    }

    // Reset rate limiter on successful authentication
    loginAttempts.delete(rateKey);

    const token = await signJWT(authResult.user);
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: authResult.user,
      redirectUrl: `/${authResult.user.role}`,
    });
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
