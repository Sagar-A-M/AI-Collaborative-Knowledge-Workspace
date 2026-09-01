import { cookies } from "next/headers";
import { signJwt, verifyJwt, type UserJwtPayload } from "./jwt";
import prisma from "@/lib/prisma";
import { UnauthorizedError } from "@/lib/errors";

export const SESSION_COOKIE_NAME = "auth_session_token";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

/**
 * Creates and sets a secure HTTP-only session cookie.
 */
export async function setSessionCookie(payload: UserJwtPayload): Promise<void> {
  const token = await signJwt(payload);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Deletes the session cookie on logout.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Gets the JWT payload from current cookies if authenticated.
 */
export async function getSessionPayload(): Promise<UserJwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;
  return verifyJwt(token);
}

/**
 * Retrieves the currently authenticated user from the database.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const payload = await getSessionPayload();
  if (!payload?.userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      },
    });
    return user;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

/**
 * Requires authentication for server actions / API handlers. Throws UnauthorizedError if not logged in.
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthorizedError("You must be logged in to perform this action.");
  }
  return user;
}
