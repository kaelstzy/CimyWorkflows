"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { SignOutIcon } from "@/components/icons";

interface LogoutButtonProps {
  className?: string;
  onNavigate?: () => void;
}

export function LogoutButton({ className = "", onNavigate }: LogoutButtonProps) {
  const router = useRouter();

  async function handleLogout() {
    onNavigate?.();
    await signOut(auth);
    router.replace("/login");
  }

  return (
    <button
      onClick={handleLogout}
      className={
        "flex items-center gap-2 rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 transition hover:border-neutral-500 hover:text-neutral-100 " +
        className
      }
    >
      <SignOutIcon className="h-4 w-4 shrink-0" />
      Sign out
    </button>
  );
}
