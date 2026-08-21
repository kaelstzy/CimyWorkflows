"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

/**
 * Wrap any page's content with this to require authentication.
 * The real security boundary is server-side (verifyAuth on each API
 * route) — this is the UX layer that keeps signed-out users off pages
 * that have nothing to show them.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-neutral-400">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
