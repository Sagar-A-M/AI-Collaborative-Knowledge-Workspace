import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { signInSchema } from "@/lib/validations/auth";
import { successResponse, handleApiError } from "@/lib/api-response";
import { UnauthorizedError } from "@/lib/errors";
import { requireRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = signInSchema.parse(body);

    const clientIp = req.headers.get("x-forwarded-for") || "unknown-ip";

    // Rate limit: 10 attempts per minute per email / IP
    await requireRateLimit(
      `auth-login:${validatedData.email.toLowerCase()}:${clientIp}`,
      { maxRequests: 10, windowSeconds: 60 },
      "Too many login attempts. Please wait 60 seconds before trying again."
    );

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isPasswordValid = await verifyPassword(validatedData.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    await setSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return successResponse(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      },
      200,
      "Logged in successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
}
