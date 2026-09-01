import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getGoogleOAuthUrl, isGoogleOAuthConfigured, handleOAuthUser } from "@/lib/auth/oauth";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/callback/google`;

  // If real Google OAuth credentials are not set in .env, authenticate via local verified demo profile
  if (!isGoogleOAuthConfigured()) {
    await handleOAuthUser({
      provider: "google",
      providerAccountId: "google-verified-user-12345",
      email: "google.user@example.com",
      name: "Google Verified User",
      image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
    });

    return NextResponse.redirect(new URL("/workspaces", req.url));
  }

  // Real Google OAuth Flow
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
