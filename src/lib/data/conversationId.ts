import { adminDb } from "@/lib/firebase/admin";

const COUNTER_DOC = adminDb.collection("counters").doc("conversation");

/**
 * Atomically reserves the next conversation ID (conv_000001, conv_000002, ...)
 * using a Firestore transaction so concurrent creates never collide.
 */
export async function getNextConversationId(): Promise<string> {
  const nextNumber = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(COUNTER_DOC);
    const current = snap.exists ? (snap.data()?.value as number) ?? 0 : 0;
    const next = current + 1;
    tx.set(COUNTER_DOC, { value: next }, { merge: true });
    return next;
  });

  return `conv_${String(nextNumber).padStart(6, "0")}`;
}
