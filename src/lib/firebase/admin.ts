/**
 * Firebase ADMIN SDK initialization.
 *
 * SERVER-SIDE ONLY. Never import this file from a Client Component or
 * expose these values to the browser. This file uses the private
 * service-account credentials (FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL)
 * which must remain secret.
 */
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp(): App {
  if (getApps().length) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Private keys are often stored with literal "\n" sequences in env vars;
  // these must be converted back into real newlines.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. Ensure FIREBASE_PROJECT_ID, " +
        "FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in the server environment."
    );
  }

  return initializeApp({
  projectId,
  credential: cert({
    projectId,
    clientEmail,
    privateKey,
  }),
});
}

const adminApp = getAdminApp();

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
