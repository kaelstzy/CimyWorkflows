"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { AppNav } from "@/components/AppNav";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuthFetch } from "@/lib/hooks/useAuthFetch";
import type { Conversation } from "@/types/conversation";

interface StatsResponse {
  counts: { total: number; active: number; flagged: number; archived: number };
  recent: Conversation[];
  potentialDuplicateCount: number;
}

function DashboardContent() {
  const authFetch = useAuthFetch();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await authFetch<StatsResponse>("/api/dashboard/stats");
      if (res.success) {
        setStats(res.data);
      } else {
        setError(res.error.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-neutral-100">Dashboard</h1>
          <Link
            href="/conversations/new"
            className="rounded-md bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-white"
          >
            + New conversation
          </Link>
        </div>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        {!stats ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Total" value={stats.counts.total} href="/conversations" />
              <StatCard
                label="Active"
                value={stats.counts.active}
                href="/conversations?status=active"
              />
              <StatCard
                label="Flagged"
                value={stats.counts.flagged}
                href="/conversations?status=flagged"
              />
              <StatCard
                label="Archived"
                value={stats.counts.archived}
                href="/conversations?status=archived"
              />
            </div>

            {stats.potentialDuplicateCount > 0 && (
              <Link
                href="/conversations/duplicates"
                className="mb-8 flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300 transition hover:bg-amber-500/15"
              >
                <span>
                  {stats.potentialDuplicateCount} potential duplicate
                  {stats.potentialDuplicateCount === 1 ? "" : "s"} flagged for review
                </span>
                <span>Review →</span>
              </Link>
            )}

            <section>
              <h2 className="mb-3 text-sm font-medium text-neutral-300">Recent conversations</h2>
              {stats.recent.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  No conversations yet.{" "}
                  <Link href="/conversations/new" className="underline">
                    Create the first one.
                  </Link>
                </p>
              ) : (
                <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
                  {stats.recent.map((c) => (
                    <Link
                      key={c.id}
                      href={`/conversations/${c.id}`}
                      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3 text-sm transition hover:bg-neutral-900"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="truncate font-mono text-neutral-400">{c.id}</span>
                        <StatusBadge status={c.status} />
                      </div>
                      <span className="shrink-0 text-neutral-500">
                        {c.messages.length} messages
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition hover:border-neutral-600"
    >
      <div className="text-2xl font-semibold text-neutral-100">{value}</div>
      <div className="text-xs text-neutral-500">{label}</div>
    </Link>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}
