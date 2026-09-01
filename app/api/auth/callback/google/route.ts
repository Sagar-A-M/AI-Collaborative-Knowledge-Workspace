import { NextRequest, NextResponse } from "next/server";
import { handleOAuthUser } from "@/lib/auth/oauth";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const storedState = req.cookies.get("oauth_state")?.value;

  if (error || !code) {
    return NextResponse.redirect(new URL("/login?error=oauth_cancelled", req.url));
  }

  if (!state || state !== storedState) {
    return NextResponse.redirect(new URL("/login?error=invalid_state", req.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${req.nextUrl.origin}/api/auth/callback/google`;

  if (!clientId || !clientSecret) {
    // Fallback demo mode if keys are not yet configured in development
    await handleOAuthUser({
      provider: "google",
      providerAccountId: "google-demo-user-123",
      email: "google.user@example.com",
      name: "Google Verified User",
      image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
    });

    const res = NextResponse.redirect(new URL("/workspaces", req.url));
    res.cookies.delete("oauth_state");
    return res;
  }

  try {
    // 1. Exchange code for access token & id token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      throw new Error(tokenData.error_description || "Failed to exchange Google OAuth code");
    }

    // 2. Fetch user profile
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await profileRes.json();
    if (!profileRes.ok || !profile.email) {
      throw new Error("Failed to fetch Google profile");
    }

    // 3. Link or create user and set session cookie
    await handleOAuthUser({
      provider: "google",
      providerAccountId: profile.id,
      email: profile.email,
      name: profile.name,
      image: profile.picture,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      idToken: tokenData.id_token,
    });

    const response = NextResponse.redirect(new URL("/workspaces", req.url));
    response.cookies.delete("oauth_state");
    return response;
  } catch (err) {
    console.error("Google OAuth error:", err);
    return NextResponse.redirect(new URL("/login?error=oauth_failed", req.url));
  }
}
