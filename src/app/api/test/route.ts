import { getApp } from "firebase-admin/app";
import { adminDb } from "@/lib/firebase/admin";

export async function GET() {
  try {
    const app = getApp();

    const snap = await adminDb
      .collection("conversation")
      .doc("conv_000001")
      .get();

    return Response.json({
      ok: true,
      projectId: app.options.projectId ?? null,
      credentialConfigured: !!app.options.credential,
      firestoreDatabase: "(default)",
      firestoreRead: {
        exists: snap.exists,
      },
    });
  } catch (error) {
    const app = getApp();

    return Response.json(
      {
        ok: false,
        projectId: app.options.projectId ?? null,
        credentialConfigured: !!app.options.credential,
        firestoreDatabase: "(default)",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
