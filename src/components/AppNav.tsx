"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { LogoutButton } from "@/components/LogoutButton";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/conversations", label: "Conversations" },
  { href: "/conversations/duplicates", label: "Duplicates" },
];

export function AppNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <header className="border-b border-neutral-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold text-neutral-100">Cimy Dataset Workbench</span>
          <nav className="flex items-center gap-4">
            {links.map((link) => {
              const active =
                link.href === "/conversations"
                  ? pathname === "/conversations" || /^\/conversations\/(new|conv_)/.test(pathname)
                  : pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    "text-sm transition " +
                    (active
                      ? "text-neutral-100 font-medium"
                      : "text-neutral-400 hover:text-neutral-200")
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user?.email && <span className="text-xs text-neutral-500">{user.email}</span>}
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
