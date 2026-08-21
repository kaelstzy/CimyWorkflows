import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/auth/verifyAuth";
import { apiSuccess, apiError } from "@/lib/api/response";
import { validateUpdateInput, ValidationError } from "@/lib/validation/conversation";
import {
  getConversationById,
  updateConversation,
  deleteConversation,
} from "@/lib/data/conversations";

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const decoded = await verifyAuth(req);
  if (!decoded) {
    return apiError("UNAUTHENTICATED", "Missing or invalid authentication token.", 401);
  }

  try {
    const conversation = await getConversationById(params.id);
    if (!conversation) {
      return apiError("NOT_FOUND", `Conversation ${params.id} does not exist.`, 404);
    }
    return apiSuccess(conversation);
  } catch (err) {
    console.error(`GET /api/conversations/${params.id} error:`, err);
    return apiError("INTERNAL_ERROR", "Failed to load conversation.", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
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
    const input = validateUpdateInput(body);
    const updated = await updateConversation(params.id, input);
    if (!updated) {
      return apiError("NOT_FOUND", `Conversation ${params.id} does not exist.`, 404);
    }
    return apiSuccess(updated);
  } catch (err) {
    if (err instanceof ValidationError) {
      return apiError("VALIDATION_ERROR", err.message, 400);
    }
    console.error(`PATCH /api/conversations/${params.id} error:`, err);
    return apiError("INTERNAL_ERROR", "Failed to update conversation.", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const decoded = await verifyAuth(req);
  if (!decoded) {
    return apiError("UNAUTHENTICATED", "Missing or invalid authentication token.", 401);
  }

  try {
    const deleted = await deleteConversation(params.id);
    if (!deleted) {
      return apiError("NOT_FOUND", `Conversation ${params.id} does not exist.`, 404);
    }
    return apiSuccess({ id: params.id, deleted: true });
  } catch (err) {
    console.error(`DELETE /api/conversations/${params.id} error:`, err);
    return apiError("INTERNAL_ERROR", "Failed to delete conversation.", 500);
  }
}
