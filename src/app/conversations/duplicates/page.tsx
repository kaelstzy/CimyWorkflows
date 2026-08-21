"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { AppNav } from "@/components/AppNav";
import { useAuthFetch } from "@/lib/hooks/useAuthFetch";

interface DuplicatePair {
  conversationId: string;
  matchedConversationId: string;
  similarity: number;
  reason: "exact" | "near-duplicate";
}

function DuplicatesContent() {
  const authFetch = useAuthFetch();
  const [pairs, setPairs] = useState<DuplicatePair[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function load() {
    setError(null);
    const res = await authFetch<DuplicatePair[]>("/api/conversations/duplicates");
    if (res.success) {
      setPairs(res.data);
    } else {
      setError(res.error.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleIgnore(pair: DuplicatePair) {
    const key = pair.conversationId + pair.matchedConversationId;
    setBusyKey(key);
    const res = await authFetch("/api/conversations/duplicates", {
      method: "POST",
      body: JSON.stringify({
        conversationId: pair.conversationId,
        matchedConversationId: pair.matchedConversationId,
        action: "ignore",
      }),
    });
    setBusyKey(null);
    if (res.success) {
      setPairs((prev) =>
        (prev ?? []).filter(
          (p) =>
            !(
              p.conversationId === pair.conversationId &&
              p.matchedConversationId === pair.matchedConversationId
            )
        )
      );
    } else {
      alert(`Failed to ignore: ${res.error.message}`);
    }
  }

  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="mb-1 text-lg font-semibold text-neutral-100">Potential duplicates</h1>
        <p className="mb-6 text-sm text-neutral-500">
          Flagged for review only — nothing here is deleted or merged automatically. You
          decide what to do with each pair.
        </p>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        {pairs === null ? (
          <p className="text-sm text-neutral-500">Scanning for duplicates…</p>
        ) : pairs.length === 0 ? (
          <p className="text-sm text-neutral-500">No potential duplicates found.</p>
        ) : (
          <div className="space-y-3">
            {pairs.map((pair) => {
              const key = pair.conversationId + pair.matchedConversationId;
              return (
                <div
                  key={key}
                  className="rounded-lg border border-neutral-800 bg-neutral-900 p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
                      <Link
                        href={`/conversations/${pair.conversationId}`}
                        className="truncate font-mono text-neutral-200 underline"
                      >
                        {pair.conversationId}
                      </Link>
                      <span className="shrink-0 text-neutral-600">↔</span>
                      <Link
                        href={`/conversations/${pair.matchedConversationId}`}
                        className="truncate font-mono text-neutral-200 underline"
                      >
                        {pair.matchedConversationId}
                      </Link>
                    </div>
                    <span
                      className={
                        "shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium " +
                        (pair.reason === "exact"
                          ? "border-red-500/30 bg-red-500/10 text-red-400"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-400")
                      }
                    >
                      {pair.reason === "exact" ? "Exact duplicate" : "Near duplicate"} ·{" "}
                      {Math.round(pair.similarity * 100)}%
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleIgnore(pair)}
                      disabled={busyKey === key}
                      className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:border-neutral-500 disabled:opacity-50"
                    >
                      {busyKey === key ? "Working…" : "Keep both / Ignore flag"}
                    </button>
                    <Link
                      href={`/conversations/${pair.conversationId}`}
                      className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:border-neutral-500"
                    >
                      Review first
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function DuplicatesPage() {
  return (
    <RequireAuth>
      <DuplicatesContent />
    </RequireAuth>
  );
}
