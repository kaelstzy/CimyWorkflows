import { adminDb } from "@/lib/firebase/admin";
import { FieldValue, Timestamp, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getNextConversationId } from "@/lib/data/conversationId";
import { buildSearchTokens, tokenize } from "@/lib/utils/tokenize";
import type {
  Conversation,
  ConversationStatus,
  CreateConversationInput,
  UpdateConversationInput,
} from "@/types/conversation";

const COLLECTION = "conversation";

// Firestore array-contains-any supports at most 30 values per query.
const MAX_SEARCH_TOKENS_PER_QUERY = 30;

function serialize(doc: QueryDocumentSnapshot): Conversation {
  const data = doc.data();
  const toIso = (v: unknown) => (v instanceof Timestamp ? v.toDate().toISOString() : v ?? null);
  return {
    id: data.id,
    type: "conversation",
    status: data.status,
    messages: data.messages,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export async function createConversation(input: CreateConversationInput): Promise<Conversation> {
  const id = await getNextConversationId();
  const now = FieldValue.serverTimestamp();

  const docData = {
    id,
    type: "conversation" as const,
    status: input.status ?? "active",
    messages: input.messages,
    searchTokens: buildSearchTokens(id, input.messages),
    createdAt: now,
    updatedAt: now,
  };

  await adminDb.collection(COLLECTION).doc(id).set(docData);
  const snap = await adminDb.collection(COLLECTION).doc(id).get();
  return serialize(snap as QueryDocumentSnapshot);
}

export async function getConversationById(id: string): Promise<Conversation | null> {
  const snap = await adminDb.collection(COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return serialize(snap as QueryDocumentSnapshot);
}

export async function updateConversation(
  id: string,
  input: UpdateConversationInput
): Promise<Conversation | null> {
  const docRef = adminDb.collection(COLLECTION).doc(id);
  const existing = await docRef.get();
  if (!existing.exists) return null;

  const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (input.messages !== undefined) {
    update.messages = input.messages;
    update.searchTokens = buildSearchTokens(id, input.messages);
  }
  if (input.status !== undefined) {
    update.status = input.status;
  }

  await docRef.update(update);
  const updated = await docRef.get();
  return serialize(updated as QueryDocumentSnapshot);
}

export async function deleteConversation(id: string): Promise<boolean> {
  const docRef = adminDb.collection(COLLECTION).doc(id);
  const existing = await docRef.get();
  if (!existing.exists) return false;
  await docRef.delete();
  return true;
}

export interface ListParams {
  status?: ConversationStatus;
  limit: number;
  cursor?: string; // last seen conversation id from the previous page
}

export interface ListResult {
  items: Conversation[];
  nextCursor: string | null;
}

/**
 * Paginated listing, newest-id-first. Uses a document-snapshot cursor
 * (startAfter) rather than offset-based paging so it stays efficient as
 * the collection grows.
 */
export async function listConversations(params: ListParams): Promise<ListResult> {
  let query = adminDb.collection(COLLECTION).orderBy("id", "desc").limit(params.limit + 1);

  if (params.status) {
    query = adminDb
      .collection(COLLECTION)
      .where("status", "==", params.status)
      .orderBy("id", "desc")
      .limit(params.limit + 1);
  }

  if (params.cursor) {
    const cursorSnap = await adminDb.collection(COLLECTION).doc(params.cursor).get();
    if (cursorSnap.exists) {
      query = query.startAfter(cursorSnap);
    }
  }

  const snap = await query.get();
  const docs = snap.docs;
  const hasMore = docs.length > params.limit;
  const pageDocs = hasMore ? docs.slice(0, params.limit) : docs;

  return {
    items: pageDocs.map((d) => serialize(d)),
    nextCursor: hasMore ? pageDocs[pageDocs.length - 1].id : null,
  };
}

export interface SearchParams {
  query: string;
  status?: ConversationStatus;
  limit: number;
}

/**
 * Server-side search using a precomputed `searchTokens` field, so the
 * client never has to fetch the whole dataset to filter it locally.
 * This is a simple token-overlap search, not full-text relevance ranking.
 */
export async function searchConversations(params: SearchParams): Promise<Conversation[]> {
  const tokens = tokenize(params.query).slice(0, MAX_SEARCH_TOKENS_PER_QUERY);

  if (tokens.length === 0) {
    return [];
  }

  let query = adminDb
    .collection(COLLECTION)
    .where("searchTokens", "array-contains-any", tokens)
    .limit(params.limit);

  if (params.status) {
    query = adminDb
      .collection(COLLECTION)
      .where("searchTokens", "array-contains-any", tokens)
      .where("status", "==", params.status)
      .limit(params.limit);
  }

  const snap = await query.get();
  return snap.docs.map((d) => serialize(d));
}

/**
 * Server-side-only bulk fetch used for duplicate detection and JSONL
 * export. Paged internally (never a single unbounded read) but the
 * result stays on the server — it is never sent to the browser as one
 * blob for the client to filter.
 */
export async function getAllConversationsForServerAnalysis(
  maxDocs = 5000
): Promise<Conversation[]> {
  const results: Conversation[] = [];
  const pageSize = 500;
  let lastDoc: QueryDocumentSnapshot | undefined;

  while (results.length < maxDocs) {
    let query = adminDb.collection(COLLECTION).orderBy("id", "asc").limit(pageSize);
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }
    const snap = await query.get();
    if (snap.empty) break;

    results.push(...snap.docs.map((d) => serialize(d)));
    lastDoc = snap.docs[snap.docs.length - 1];

    if (snap.docs.length < pageSize) break;
  }

  return results.slice(0, maxDocs);
}

export interface StatusCounts {
  total: number;
  active: number;
  flagged: number;
  archived: number;
}

export async function countConversationsByStatus(): Promise<StatusCounts> {
  const collection = adminDb.collection(COLLECTION);
  const [total, active, flagged, archived] = await Promise.all([
    collection.count().get(),
    collection.where("status", "==", "active").count().get(),
    collection.where("status", "==", "flagged").count().get(),
    collection.where("status", "==", "archived").count().get(),
  ]);

  return {
    total: total.data().count,
    active: active.data().count,
    flagged: flagged.data().count,
    archived: archived.data().count,
  };
}
