"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { AppNav } from "@/components/AppNav";
import { MessageEditor } from "@/components/MessageEditor";
import { useAuthFetch } from "@/lib/hooks/useAuthFetch";
import type { Conversation, ConversationStatus, Message } from "@/types/conversation";

const STATUS_OPTIONS: ConversationStatus[] = ["active", "flagged", "archived"];

function EditConversationContent() {
  const { id } = useParams<{ id: string }>();
  const authFetch = useAuthFetch();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<ConversationStatus>("active");
  const [meta, setMeta] = useState<{ createdAt: unknown; updatedAt: unknown } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await authFetch<Conversation>(`/api/conversations/${id}`);
      if (res.success) {
        setMessages(res.data.messages);
        setStatus(res.data.status);
        setMeta({ createdAt: res.data.createdAt, updatedAt: res.data.updatedAt });
      } else if (res.error.code === "NOT_FOUND") {
        setNotFound(true);
      } else {
        setError(res.error.message);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await authFetch<Conversation>(`/api/conversations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ messages, status }),
    });
    setSaving(false);
    if (res.success) {
      setMeta({ createdAt: res.data.createdAt, updatedAt: res.data.updatedAt });
    } else {
      setError(res.error.message);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete ${id}? This permanently removes it from the dataset and cannot be undone.`
    );
    if (!confirmed) return;

    setDeleting(true);
    const res = await authFetch(`/api/conversations/${id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.success) {
      router.push("/conversations");
    } else {
      setError(res.error.message);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <AppNav />
        <main className="mx-auto max-w-2xl px-6 py-8 text-sm text-neutral-500">Loading…</main>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen">
        <AppNav />
        <main className="mx-auto max-w-2xl px-6 py-8">
          <p className="text-sm text-neutral-400">Conversation {id} does not exist.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-2xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-mono text-lg font-semibold text-neutral-100">{id}</h1>
            {meta?.updatedAt ? (
              <p className="text-xs text-neutral-500">
                Last updated {new Date(String(meta.updatedAt)).toLocaleString()}
              </p>
            ) : null}
          </div>

          <div className="flex overflow-hidden rounded-md border border-neutral-700">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setStatus(opt)}
                className={
                  "px-3 py-1.5 text-xs font-medium capitalize transition " +
                  (status === opt
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-neutral-400 hover:text-neutral-200")
                }
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <MessageEditor messages={messages} onChange={setMessages} />

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <div className="mt-6 flex justify-between">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-md border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete conversation"}
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/conversations")}
              className="rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-500"
            >
              Back to list
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function EditConversationPage() {
  return (
    <RequireAuth>
      <EditConversationContent />
    </RequireAuth>
  );
}
