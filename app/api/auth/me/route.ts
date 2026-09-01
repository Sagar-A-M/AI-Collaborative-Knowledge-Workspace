import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return successResponse({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
