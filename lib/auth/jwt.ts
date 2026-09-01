import { SignJWT, jwtVerify } from "jose";

export interface UserJwtPayload {
  userId: string;
  email: string;
  name?: string | null;
  [key: string]: unknown;
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    "default_collaborative_workspace_jwt_secret_key_min_32_chars"
);

const SESSION_EXPIRY = "7d"; // 7 days session

/**
 * Signs a JWT token with the provided payload.
 */
export async function signJwt(
  payload: UserJwtPayload,
  expiresIn = SESSION_EXPIRY
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
}

/**
 * Verifies a JWT token and returns the payload if valid.
 */
export async function verifyJwt(token: string): Promise<UserJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as UserJwtPayload;
  } catch {
    return null;
  }
}
