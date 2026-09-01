import { clearSessionCookie } from "@/lib/auth/session";
import { successResponse, handleApiError } from "@/lib/api-response";

export async function POST() {
  try {
    await clearSessionCookie();
    return successResponse({ loggedOut: true }, 200, "Logged out successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
