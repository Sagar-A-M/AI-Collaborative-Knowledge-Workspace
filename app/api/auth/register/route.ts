import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { signUpSchema } from "@/lib/validations/auth";
import { successResponse, handleApiError } from "@/lib/api-response";
import { ConflictError } from "@/lib/errors";
import { requireRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get("x-forwarded-for") || "unknown-ip";

    // Rate limit: 5 account creations per 5 minutes per IP
    await requireRateLimit(
      `auth-register:${clientIp}`,
      { maxRequests: 5, windowSeconds: 300 },
      "Too many registration attempts from this IP. Please try again later."
    );

    const body = await req.json();
    const validatedData = signUpSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      throw new ConflictError("An account with this email already exists");
    }

    const passwordHash = await hashPassword(validatedData.password);

    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    });

    await setSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return successResponse({ user }, 201, "Account registered successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
