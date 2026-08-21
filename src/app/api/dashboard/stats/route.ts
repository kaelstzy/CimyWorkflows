import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/auth/verifyAuth";
import { apiSuccess, apiError } from "@/lib/api/response";
import {
  countConversationsByStatus,
  listConversations,
  getAllConversationsForServerAnalysis,
} from "@/lib/data/conversations";
import { findDuplicates, pairKey } from "@/lib/duplicates/similarity";
import { getIgnoredPairKeys } from "@/lib/data/duplicateIgnores";

export async function GET(req: NextRequest) {
  const decoded = await verifyAuth(req);
  if (!decoded) {
    return apiError("UNAUTHENTICATED", "Missing or invalid authentication token.", 401);
  }

  try {
    const [counts, recent, allForDupes, ignoredKeys] = await Promise.all([
      countConversationsByStatus(),
      listConversations({ limit: 5 }),
      getAllConversationsForServerAnalysis(),
      getIgnoredPairKeys(),
    ]);

    const duplicatePairs = findDuplicates(allForDupes).filter(
      (p) => !ignoredKeys.has(pairKey(p.conversationId, p.matchedConversationId))
    );

    return apiSuccess({
      counts,
      recent: recent.items,
      potentialDuplicateCount: duplicatePairs.length,
    });
  } catch (err) {
    console.error("GET /api/dashboard/stats error:", err);
    return apiError("INTERNAL_ERROR", "Failed to load dashboard stats.", 500);
  }
}
