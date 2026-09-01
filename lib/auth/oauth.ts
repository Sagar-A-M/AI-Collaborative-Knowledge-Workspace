import prisma from "@/lib/prisma";
import { setSessionCookie } from "./session";

interface OAuthProfile {
  provider: "google" | "auth0";
  providerAccountId: string;
  email: string;
  name?: string | null;
  image?: string | null;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
}

export function getGoogleOAuthUrl(state: string, redirectUri: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID || "demo-google-client-id";
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";

  const options = {
    redirect_uri: redirectUri,
    client_id: clientId,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
    state,
  };

  const qs = new URLSearchParams(options);
  return `${rootUrl}?${qs.toString()}`;
}

export function getAuth0OAuthUrl(state: string, redirectUri: string): string {
  const domain = process.env.AUTH0_DOMAIN || process.env.AUTH0_ISSUER_BASE_URL || "demo.auth0.com";
  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const clientId = process.env.AUTH0_CLIENT_ID || "demo-auth0-client-id";

  const rootUrl = `https://${cleanDomain}/authorize`;

  const options = {
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "openid profile email",
    state,
  };

  const qs = new URLSearchParams(options);
  return `${rootUrl}?${qs.toString()}`;
}

export async function handleOAuthUser(profile: OAuthProfile) {
  const { provider, providerAccountId, email, name, image, accessToken, refreshToken, idToken } =
    profile;

  // 1. Check if user already exists with this email
  let user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    // Create new user with verified email
    user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name || email.split("@")[0],
        image: image || null,
        emailVerified: new Date(),
      },
    });
  } else {
    // Update avatar/name if missing
    if (!user.image && image) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { image },
      });
    }
  }

  // 2. Link or update OAuth account
  await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId,
      },
    },
    update: {
      accessToken,
      refreshToken,
      idToken,
    },
    create: {
      userId: user.id,
      type: "oauth",
      provider,
      providerAccountId,
      accessToken,
      refreshToken,
      idToken,
    },
  });

  // 3. Set standard session cookie
  await setSessionCookie({
    userId: user.id,
    email: user.email,
    name: user.name,
  });

  return user;
}
