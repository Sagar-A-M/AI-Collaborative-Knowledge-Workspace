import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAuth0OAuthUrl } from "@/lib/auth/oauth";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/callback/auth0`;
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
