import { adminDb } from "@/lib/firebase/admin";

export async function GET() {
  try {
    const snap = await adminDb
      .collection("conversation")
      .doc("conv_000001")
      .get();

    return Response.json({
      ok: true,
      exists: snap.exists,
      data: snap.exists ? snap.data() : null,
    });
  } catch (error) {
    console.error("Firestore test:", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
