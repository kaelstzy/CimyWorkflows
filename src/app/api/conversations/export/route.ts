import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/verifyAuth";
import { apiError } from "@/lib/api/response";
import { getAllConversationsForServerAnalysis } from "@/lib/data/conversations";
import type { ConversationStatus } from "@/types/conversation";

const VALID_STATUSES: ConversationStatus[] = ["active", "flagged", "archived"];

/**
 * GET /api/conversations/export
 * Optional ?status=active|flagged|archived to filter which conversations
 * are exported.
 *
 * Returns a text/plain JSONL body — one conversation object per line,
 * preserving {id, type, status, messages} with structured roles (never
 * flattened back into "Role: text" strings).
 */
export async function GET(req: NextRequest) {
  const decoded = await verifyAuth(req);
  if (!decoded) {
    return apiError("UNAUTHENTICATED", "Missing or invalid authentication token.", 401);
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");

  if (statusParam && !VALID_STATUSES.includes(statusParam as ConversationStatus)) {
    return apiError(
      "VALIDATION_ERROR",
      "status filter must be one of: active, flagged, archived.",
      400
    );
  }

  try {
    const all = await getAllConversationsForServerAnalysis();
    const filtered = statusParam ? all.filter((c) => c.status === statusParam) : all;

    const lines = filtered.map((c) =>
      JSON.stringify({
        id: c.id,
        type: c.type,
        status: c.status,
        messages: c.messages,
      })
    );

    const jsonl = lines.join("\n") + (lines.length > 0 ? "\n" : "");

    return new NextResponse(jsonl, {
      status: 200,
      headers: {
        "Content-Type": "application/jsonl; charset=utf-8",
        "Content-Disposition": `attachment; filename="cimy-dataset-export-${Date.now()}.jsonl"`,
      },
    });
  } catch (err) {
    console.error("GET /api/conversations/export error:", err);
    return apiError("INTERNAL_ERROR", "Failed to export dataset.", 500);
  }
}
