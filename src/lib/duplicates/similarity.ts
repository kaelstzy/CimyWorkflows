import { tokenize } from "@/lib/utils/tokenize";
import type { Conversation } from "@/types/conversation";
import crypto from "crypto";

export interface DuplicatePair {
  conversationId: string;
  matchedConversationId: string;
  similarity: number; // 0-1
  reason: "exact" | "near-duplicate";
}

function contentKey(conversation: Conversation): string {
  return conversation.messages.map((m) => `${m.role}:${m.content.trim().toLowerCase()}`).join("\n");
}

function contentHash(conversation: Conversation): string {
  return crypto.createHash("sha256").update(contentKey(conversation)).digest("hex");
}

function tokenSet(conversation: Conversation): Set<string> {
  const all = conversation.messages.flatMap((m) => tokenize(m.content));
  return new Set(all);
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersectionSize = 0;
  for (const token of a) {
    if (b.has(token)) intersectionSize++;
  }
  const unionSize = a.size + b.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

// Deliberately conservative: catches conversations that are essentially the
// same content, not ones that merely share common words.
const NEAR_DUPLICATE_THRESHOLD = 0.85;
// Skip pairs where either conversation is trivially short — short overlap
// on common short conversations otherwise floods the flag list.
const MIN_TOKENS_FOR_NEAR_DUPLICATE_CHECK = 4;

/**
 * Finds exact and near-duplicate conversation pairs within the given set.
 * Pure detection only — never deletes or modifies conversation data.
 * O(n^2) token comparison; fine for a personal dataset workbench at the
 * scale this tool targets (thousands, not millions, of conversations).
 */
export function findDuplicates(conversations: Conversation[]): DuplicatePair[] {
  const pairs: DuplicatePair[] = [];

  const hashes = conversations.map(contentHash);
  const tokenSets = conversations.map(tokenSet);

  for (let i = 0; i < conversations.length; i++) {
    for (let j = i + 1; j < conversations.length; j++) {
      if (hashes[i] === hashes[j]) {
        pairs.push({
          conversationId: conversations[i].id,
          matchedConversationId: conversations[j].id,
          similarity: 1,
          reason: "exact",
        });
        continue;
      }

      if (
        tokenSets[i].size < MIN_TOKENS_FOR_NEAR_DUPLICATE_CHECK ||
        tokenSets[j].size < MIN_TOKENS_FOR_NEAR_DUPLICATE_CHECK
      ) {
        continue;
      }

      const similarity = jaccardSimilarity(tokenSets[i], tokenSets[j]);
      if (similarity >= NEAR_DUPLICATE_THRESHOLD) {
        pairs.push({
          conversationId: conversations[i].id,
          matchedConversationId: conversations[j].id,
          similarity,
          reason: "near-duplicate",
        });
      }
    }
  }

  return pairs.sort((a, b) => b.similarity - a.similarity);
}

export function pairKey(idA: string, idB: string): string {
  return [idA, idB].sort().join("__");
}
