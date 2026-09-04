export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  await clearSessionCookie();
  return NextResponse.json({ success: true, message: "Logged out successfully" });
}

export async function GET(req: NextRequest) {
  await clearSessionCookie();
  const signInUrl = new URL("/sign-in", req.url);
  return NextResponse.redirect(signInUrl);
}
