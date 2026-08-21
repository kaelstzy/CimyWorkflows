"use client";

import { useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppNav } from "@/components/AppNav";
import { LogoutButton } from "@/components/LogoutButton";
import { useAuth } from "@/components/AuthProvider";
import { AccountIcon, CopyIcon } from "@/components/icons";

function AccountContent() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  async function handleCopyEmail() {
    if (!user?.email) return;
    try {
      await navigator.clipboard.writeText(user.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can fail silently (unsupported/insecure context) — not critical.
    }
  }

  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="mb-1 text-lg font-semibold text-neutral-100">Account</h1>
        <p className="mb-6 text-sm text-neutral-500">
          Details for the account currently signed in to this workbench.
        </p>

        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-neutral-300">
              <AccountIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wide text-neutral-500">Email</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="min-w-0 break-all text-sm text-neutral-100">
                  {user?.email ?? "—"}
                </p>
                {user?.email && (
                  <button
                    onClick={handleCopyEmail}
                    className="flex shrink-0 items-center gap-1 rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-400 transition hover:border-neutral-500 hover:text-neutral-200"
                  >
                    <CopyIcon className="h-3.5 w-3.5" />
                    {copied ? "Copied" : "Copy"}
                  </button>
                )}
              </div>

              <p className="mt-4 text-xs uppercase tracking-wide text-neutral-500">User ID</p>
              <p className="mt-1 break-all font-mono text-xs text-neutral-400">{user?.uid ?? "—"}</p>
            </div>
          </div>

          <div className="mt-6 border-t border-neutral-800 pt-4">
            <p className="mb-3 text-xs text-neutral-500">
              This is a private tool. Accounts are managed manually in the Firebase console.
            </p>
            <LogoutButton />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AccountPage() {
  return (
    <RequireAuth>
      <AccountContent />
    </RequireAuth>
  );
}
