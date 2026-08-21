import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/auth/verifyAuth";
import { apiSuccess, apiError } from "@/lib/api/response";
import { validateCreateInput, ValidationError } from "@/lib/validation/conversation";
import {
  createConversation,
  listConversations,
  searchConversations,
} from "@/lib/data/conversations";
import type { ConversationStatus } from "@/types/conversation";

const VALID_STATUSES: ConversationStatus[] = ["active", "flagged", "archived"];

export async function POST(req: NextRequest) {
  const decoded = await verifyAuth(req);
  if (!decoded) {
    return apiError("UNAUTHENTICATED", "Missing or invalid authentication token.", 401);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }

  try {
    const input = validateCreateInput(body);
    const conversation = await createConversation(input);
    return apiSuccess(conversation, { status: 201 });
  } catch (err) {
    if (err instanceof ValidationError) {
      return apiError("VALIDATION_ERROR", err.message, 400);
    }
    console.error("POST /api/conversations error:", err);
    return apiError("INTERNAL_ERROR", "Failed to create conversation.", 500);
  }
}

export async function GET(req: NextRequest) {
  const decoded = await verifyAuth(req);
  if (!decoded) {
    return apiError("UNAUTHENTICATED", "Missing or invalid authentication token.", 401);
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const queryParam = searchParams.get("q");
  const cursorParam = searchParams.get("cursor") ?? undefined;
  const limitParam = Number(searchParams.get("limit") ?? "25");
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 100) : 25;

  let status: ConversationStatus | undefined;
  if (statusParam) {
    if (!VALID_STATUSES.includes(statusParam as ConversationStatus)) {
      return apiError(
        "VALIDATION_ERROR",
        "status filter must be one of: active, flagged, archived.",
        400
      );
    }
    status = statusParam as ConversationStatus;
  }

  try {
    if (queryParam && queryParam.trim().length > 0) {
      // Search mode: server-side token search, no cursor pagination
      // (result sets are expected to be small and already filtered).
      const items = await searchConversations({ query: queryParam, status, limit });
      return apiSuccess(items);
    }

    const result = await listConversations({ status, limit, cursor: cursorParam });
    return apiSuccess(result.items, { pagination: { nextCursor: result.nextCursor } });
  } catch (err) {
    console.error("GET /api/conversations error:", err);
    return apiError("INTERNAL_ERROR", "Failed to list conversations.", 500);
  }
}
