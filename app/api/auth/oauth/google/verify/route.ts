import { NextRequest } from "next/server";
import { handleOAuthUser } from "@/lib/auth/oauth";
import { successResponse, handleApiError } from "@/lib/api-response";
import { BadRequestError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken, email, name, picture, googleId } = body;

    if (!email || !googleId) {
      throw new BadRequestError("Missing required Google user verification data");
    }

    const user = await handleOAuthUser({
      provider: "google",
      providerAccountId: googleId,
      email,
      name,
      image: picture,
      idToken,
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
      "Google authentication verified successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
}
