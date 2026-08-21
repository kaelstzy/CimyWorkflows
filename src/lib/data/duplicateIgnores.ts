import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { pairKey } from "@/lib/duplicates/similarity";

const COLLECTION = "duplicate_ignores";

export async function ignoreDuplicatePair(idA: string, idB: string): Promise<void> {
  const key = pairKey(idA, idB);
  await adminDb.collection(COLLECTION).doc(key).set({
    conversationIds: [idA, idB].sort(),
    ignoredAt: FieldValue.serverTimestamp(),
  });
}

export async function getIgnoredPairKeys(): Promise<Set<string>> {
  const snap = await adminDb.collection(COLLECTION).get();
  return new Set(snap.docs.map((d) => d.id));
}
