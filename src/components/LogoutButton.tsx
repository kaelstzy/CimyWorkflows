"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await signOut(auth);
    router.replace("/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 transition hover:border-neutral-500 hover:text-neutral-100"
    >
      Sign out
    </button>
  );
}
