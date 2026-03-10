import { auth } from "@/lib/auth";
import { handleApiError, AppError } from "@/errors";
import { NextRequest, NextResponse } from "next/server";

type Handler = (
  req: NextRequest,
  context: { userId: string; params?: Record<string, string> }
) => Promise<NextResponse>;

export function withAuth(handler: Handler) {
  return async (req: NextRequest, { params }: { params?: Promise<Record<string, string>> } = {}) => {
    try {
      const session = await auth();
      if (!session?.user?.id) {
        throw new AppError("Unauthorized", 401);
      }

      const resolvedParams = params ? await params : undefined;

      return await handler(req, {
        userId: session.user.id,
        params: resolvedParams,
      });
    } catch (error) {
      return handleApiError(error);
    }
  };
}
