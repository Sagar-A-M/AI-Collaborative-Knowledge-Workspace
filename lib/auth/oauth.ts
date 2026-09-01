import prisma from "@/lib/prisma";
import { setSessionCookie } from "./session";
import { ActivityType, Role } from "@prisma/client";

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

export function isGoogleOAuthConfigured(): boolean {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  return Boolean(
    clientId &&
    clientSecret &&
    clientId.length > 10 &&
    !clientId.startsWith("demo-") &&
    clientId.includes(".apps.googleusercontent.com")
  );
}

export function isAuth0Configured(): boolean {
  const domain = process.env.AUTH0_DOMAIN || process.env.AUTH0_ISSUER_BASE_URL;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;
  return Boolean(
    domain &&
    clientId &&
    clientSecret &&
    !domain.startsWith("demo") &&
    !clientId.startsWith("demo-")
  );
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

  const normalizedEmail = email.toLowerCase().trim();

  // 1. Check if user already exists with this email
  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      memberships: true,
    },
  });

  if (!user) {
    // Create new user with verified email
    const createdUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name || normalizedEmail.split("@")[0],
        image: image || null,
        emailVerified: new Date(),
      },
    });

    // Create default workspace for new OAuth user
    const workspaceSlug = `workspace-${createdUser.id.slice(-6).toLowerCase()}`;
    const workspaceName = `${createdUser.name || "My"}'s Workspace`;

    const workspace = await prisma.workspace.create({
      data: {
        name: workspaceName,
        slug: workspaceSlug,
        ownerId: createdUser.id,
        members: {
          create: {
            userId: createdUser.id,
            role: Role.OWNER,
          },
        },
      },
    });

    // Create initial welcome document
    await prisma.document.create({
      data: {
        title: "Welcome to your AI Knowledge Base",
        content:
          "# Welcome to your AI Collaborative Workspace!\n\nThis is your initial workspace document created with your Google authentication.\n\n### Features Available:\n- **AI Knowledge Assistant**: Ask questions and generate grounded document summaries.\n- **Full-Text PostgreSQL Search**: Search quickly with keyword indexing and Redis caching.\n- **Document Versioning**: Track snapshot revisions and 1-click restore.\n- **Team Folders**: Organize knowledge into multi-tier directory trees.",
        workspaceId: workspace.id,
        authorId: createdUser.id,
      },
    });

    await prisma.activity.create({
      data: {
        workspaceId: workspace.id,
        userId: createdUser.id,
        type: ActivityType.WORKSPACE_CREATED,
        description: `${createdUser.name} created workspace ${workspace.name}`,
      },
    });

    user = await prisma.user.findUnique({
      where: { id: createdUser.id },
      include: { memberships: true },
    });
  } else {
    // Update avatar/name if missing
    if (!user.image && image) {
      await prisma.user.update({
        where: { id: user.id },
        data: { image },
      });
    }
  }

  if (!user) {
    throw new Error("Failed to initialize user session");
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
