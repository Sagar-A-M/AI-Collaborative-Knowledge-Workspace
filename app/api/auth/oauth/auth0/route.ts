import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAuth0OAuthUrl, isAuth0Configured, handleOAuthUser } from "@/lib/auth/oauth";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/callback/auth0`;

  // If real Auth0 credentials are not set in .env, authenticate via verified demo profile
  if (!isAuth0Configured()) {
    await handleOAuthUser({
      provider: "auth0",
      providerAccountId: "auth0-verified-user-67890",
      email: "auth0.sso.user@example.com",
      name: "Auth0 Enterprise User",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    });

    return NextResponse.redirect(new URL("/workspaces", req.url));
  }

  // Real Auth0 Flow
  const state = crypto.randomBytes(16).toString("hex");
  const auth0Url = getAuth0OAuthUrl(state, redirectUri);

  const response = NextResponse.redirect(auth0Url);
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  return response;
}
