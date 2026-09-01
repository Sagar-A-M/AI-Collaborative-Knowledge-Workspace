import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getGoogleOAuthUrl } from "@/lib/auth/oauth";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/callback/google`;
  const state = crypto.randomBytes(16).toString("hex");

  const googleUrl = getGoogleOAuthUrl(state, redirectUri);

  const response = NextResponse.redirect(googleUrl);
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  return response;
}
