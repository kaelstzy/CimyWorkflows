"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { AppNav } from "@/components/AppNav";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuthFetch } from "@/lib/hooks/useAuthFetch";
import { useAuth } from "@/components/AuthProvider";
import type { Conversation, ConversationStatus } from "@/types/conversation";

const STATUS_TABS: { label: string; value: ConversationStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Flagged", value: "flagged" },
  { label: "Archived", value: "archived" },
];

function ConversationListContent() {
  const authFetch = useAuthFetch();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusFilter = (searchParams.get("status") as ConversationStatus | null) ?? "all";
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
  const [items, setItems] = useState<Conversation[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activeQuery = searchParams.get("q") ?? "";

  const fetchPage = useCallback(
    async (cursor?: string, append = false) => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (activeQuery) params.set("q", activeQuery);
      if (cursor) params.set("cursor", cursor);

      const res = await authFetch<Conversation[]>(`/api/conversations?${params.toString()}`);
      if (res.success) {
        setItems((prev) => (append ? [...prev, ...res.data] : res.data));
        setNextCursor(res.pagination?.nextCursor ?? null);
      } else {
        setError(res.error.message);
      }
      setLoading(false);
    },
    [authFetch, statusFilter, activeQuery]
  );

  useEffect(() => {
    fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, activeQuery]);

  function applyFilters(nextStatus: ConversationStatus | "all", nextQuery: string) {
    const params = new URLSearchParams();
    if (nextStatus !== "all") params.set("status", nextStatus);
    if (nextQuery) params.set("q", nextQuery);
    router.push(`/conversations${params.toString() ? `?${params.toString()}` : ""}`);
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      `Delete ${id}? This permanently removes it from the dataset and cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(id);
    const res = await authFetch(`/api/conversations/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.success) {
      setItems((prev) => prev.filter((c) => c.id !== id));
    } else {
      alert(`Failed to delete: ${res.error.message}`);
    }
  }

  async function handleExport() {
    if (!user) return;
    const idToken = await user.getIdToken();
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res = await fetch(`/api/conversations/export?${params.toString()}`, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!res.ok) {
      alert("Export failed.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cimy-dataset-export-${Date.now()}.jsonl`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-neutral-100">Conversations</h1>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="rounded-md border border-neutral-700 px-3 py-2 text-sm text-neutral-300 hover:border-neutral-500 hover:text-neutral-100"
            >
              Export JSONL
            </button>
            <Link
              href="/conversations/new"
              className="rounded-md bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-white"
            >
              + New conversation
            </Link>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="flex overflow-hidden rounded-md border border-neutral-700">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => applyFilters(tab.value, activeQuery)}
                className={
                  "px-3 py-1.5 text-sm transition " +
                  (statusFilter === tab.value
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-neutral-400 hover:text-neutral-200")
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              applyFilters(statusFilter, searchInput.trim());
            }}
            className="flex flex-1 min-w-[200px] gap-2"
          >
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by content or ID…"
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100 outline-none focus:border-neutral-400"
            />
            {activeQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  applyFilters(statusFilter, "");
                }}
                className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-400 hover:text-neutral-200"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        {loading && items.length === 0 ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-neutral-500">No conversations match this view.</p>
        ) : (
          <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
            {items.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm transition hover:bg-neutral-900"
              >
                <Link href={`/conversations/${c.id}`} className="flex flex-1 items-center gap-3">
                  <span className="font-mono text-neutral-400">{c.id}</span>
                  <StatusBadge status={c.status} />
                  <span className="truncate text-neutral-500">
                    {c.messages[0]?.content ?? ""}
                  </span>
                </Link>
                <span className="shrink-0 text-xs text-neutral-500">
                  {c.messages.length} msgs
                </span>
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={deletingId === c.id}
                  className="shrink-0 rounded px-2 py-1 text-xs text-red-400/80 hover:text-red-400 disabled:opacity-40"
                >
                  {deletingId === c.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            ))}
          </div>
        )}

        {!activeQuery && nextCursor && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => fetchPage(nextCursor, true)}
              disabled={loading}
              className="rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-500 disabled:opacity-50"
            >
              {loading ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ConversationListPage() {
  return (
    <RequireAuth>
      <Suspense
        fallback={<div className="p-8 text-sm text-neutral-500">Loading…</div>}
      >
        <ConversationListContent />
      </Suspense>
    </RequireAuth>
  );
}
