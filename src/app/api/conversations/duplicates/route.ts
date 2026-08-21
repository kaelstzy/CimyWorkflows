import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/auth/verifyAuth";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getAllConversationsForServerAnalysis } from "@/lib/data/conversations";
import { findDuplicates, pairKey } from "@/lib/duplicates/similarity";
import { getIgnoredPairKeys, ignoreDuplicatePair } from "@/lib/data/duplicateIgnores";

/**
 * GET /api/conversations/duplicates
 *
 * Detection only. Never deletes or modifies conversation data — the user
 * decides what to do with each flagged pair (keep both, ignore, review).
 */
export async function GET(req: NextRequest) {
  const decoded = await verifyAuth(req);
  if (!decoded) {
    return apiError("UNAUTHENTICATED", "Missing or invalid authentication token.", 401);
  }

  try {
    const [conversations, ignoredKeys] = await Promise.all([
      getAllConversationsForServerAnalysis(),
      getIgnoredPairKeys(),
    ]);

    const allPairs = findDuplicates(conversations);
    const pairs = allPairs.filter(
      (p) => !ignoredKeys.has(pairKey(p.conversationId, p.matchedConversationId))
    );

    return apiSuccess(pairs);
  } catch (err) {
    console.error("GET /api/conversations/duplicates error:", err);
    return apiError("INTERNAL_ERROR", "Failed to run duplicate detection.", 500);
  }
}

/**
 * POST /api/conversations/duplicates
 * Body: { conversationId: string, matchedConversationId: string, action: "ignore" }
 *
 * Records that the user reviewed and dismissed this flagged pair. This
 * does not touch either conversation document.
 */
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

  const b = body as Record<string, unknown>;
  const { conversationId, matchedConversationId, action } = b;

  if (
    typeof conversationId !== "string" ||
    typeof matchedConversationId !== "string" ||
    action !== "ignore"
  ) {
    return apiError(
      "VALIDATION_ERROR",
      'Expected { conversationId, matchedConversationId, action: "ignore" }.',
      400
    );
  }

  try {
    await ignoreDuplicatePair(conversationId, matchedConversationId);
    return apiSuccess({ ignored: true });
  } catch (err) {
    console.error("POST /api/conversations/duplicates error:", err);
    return apiError("INTERNAL_ERROR", "Failed to record ignore action.", 500);
  }
}
