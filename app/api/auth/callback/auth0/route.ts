import { NextRequest, NextResponse } from "next/server";
import { handleOAuthUser } from "@/lib/auth/oauth";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const storedState = req.cookies.get("oauth_state")?.value;

  if (error || !code) {
    return NextResponse.redirect(new URL("/login?error=auth0_cancelled", req.url));
  }

  if (!state || state !== storedState) {
    return NextResponse.redirect(new URL("/login?error=invalid_state", req.url));
  }

  const domain = process.env.AUTH0_DOMAIN || process.env.AUTH0_ISSUER_BASE_URL;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;
  const redirectUri = `${req.nextUrl.origin}/api/auth/callback/auth0`;

  if (!domain || !clientId || !clientSecret) {
    // Fallback demo mode if keys are not configured in dev
    await handleOAuthUser({
      provider: "auth0",
      providerAccountId: "auth0-demo-user-456",
      email: "auth0.sso.user@example.com",
      name: "Auth0 Enterprise User",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    });

    const res = NextResponse.redirect(new URL("/workspaces", req.url));
    res.cookies.delete("oauth_state");
    return res;
  }

  try {
    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");

    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch(`https://${cleanDomain}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      throw new Error(tokenData.error_description || "Failed to exchange Auth0 code");
    }

    // 2. Fetch user profile from userinfo endpoint
    const profileRes = await fetch(`https://${cleanDomain}/userinfo`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await profileRes.json();
    if (!profileRes.ok || !profile.email) {
      throw new Error("Failed to fetch Auth0 profile");
    }

    // 3. Link or create user and set session cookie
    await handleOAuthUser({
      provider: "auth0",
      providerAccountId: profile.sub || profile.id,
      email: profile.email,
      name: profile.name || profile.nickname,
      image: profile.picture,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      idToken: tokenData.id_token,
    });

    const response = NextResponse.redirect(new URL("/workspaces", req.url));
    response.cookies.delete("oauth_state");
    return response;
  } catch (err) {
    console.error("Auth0 OAuth error:", err);
    return NextResponse.redirect(new URL("/login?error=auth0_failed", req.url));
  }
}
