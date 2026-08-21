"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { AppNav } from "@/components/AppNav";
import { MessageEditor } from "@/components/MessageEditor";
import { useAuthFetch } from "@/lib/hooks/useAuthFetch";
import type { Conversation, Message } from "@/types/conversation";

function NewConversationContent() {
  const authFetch = useAuthFetch();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    { role: "user", content: "" },
    { role: "assistant", content: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await authFetch<Conversation>("/api/conversations", {
      method: "POST",
      body: JSON.stringify({ messages }),
    });
    setSaving(false);

    if (res.success) {
      router.push(`/conversations/${res.data.id}`);
    } else {
      setError(res.error.message);
    }
  }

  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="mb-1 text-lg font-semibold text-neutral-100">New conversation</h1>
        <p className="mb-6 text-sm text-neutral-500">
          Add message turns below. This will be saved as a new{" "}
          <span className="text-neutral-400">active</span> conversation.
        </p>

        <MessageEditor messages={messages} onChange={setMessages} />

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            onClick={() => router.push("/conversations")}
            className="rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save conversation"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default function NewConversationPage() {
  return (
    <RequireAuth>
      <NewConversationContent />
    </RequireAuth>
  );
}
