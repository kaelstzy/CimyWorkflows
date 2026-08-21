import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import type { DecodedIdToken } from "firebase-admin/auth";

/**
 * Verifies the Firebase ID token sent by the client in the
 * `Authorization: Bearer <idToken>` header.
 *
 * This is the server-side authentication check for API routes.
 * It does NOT rely on the client hiding UI — an unauthenticated
 * or invalid/expired token is always rejected here.
 *
 * Returns the decoded token (containing uid, email, etc.) on success,
 * or null if the request is not authenticated.
 */
export async function verifyAuth(req: NextRequest): Promise<DecodedIdToken | null> {
  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const idToken = authHeader.slice("Bearer ".length).trim();

  if (!idToken) {
    return null;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch {
    // Invalid, expired, or tampered token.
    return null;
  }
}
