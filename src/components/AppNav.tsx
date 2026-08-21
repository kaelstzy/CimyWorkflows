"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { LogoutButton } from "@/components/LogoutButton";
import {
  AccountIcon,
  CloseIcon,
  ConversationsIcon,
  DashboardIcon,
  DuplicatesIcon,
  MenuIcon,
} from "@/components/icons";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/conversations", label: "Conversations", icon: ConversationsIcon },
  { href: "/conversations/duplicates", label: "Duplicates", icon: DuplicatesIcon },
  { href: "/account", label: "Account", icon: AccountIcon },
];

function isActive(pathname: string, href: string) {
  if (href === "/conversations") {
    return pathname === "/conversations" || /^\/conversations\/(new|conv_)/.test(pathname);
  }
  if (href === "/account") {
    return pathname === "/account";
  }
  return pathname === href;
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
      <Image
        src="/cimy-logo.png"
        alt="Cimy"
        width={28}
        height={28}
        className="h-7 w-7 shrink-0"
        priority
      />
      <span className="text-sm font-semibold tracking-tight text-neutral-100 sm:text-[15px]">
        Cimy Workbench
      </span>
    </Link>
  );
}

export function AppNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }
      setMenuOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800 bg-[#0b0c0f]/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        {/* Desktop layout */}
        <div className="hidden min-w-0 items-center gap-8 md:flex">
          <Brand />
          <nav className="flex items-center gap-1">
            {links.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    "rounded-md px-3 py-1.5 text-sm font-medium transition " +
                    (active
                      ? "bg-neutral-800/80 text-neutral-100"
                      : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200")
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden min-w-0 shrink-0 items-center gap-3 md:flex">
          {user?.email && (
            <span
              className="max-w-[180px] truncate text-xs text-neutral-500 lg:max-w-[260px]"
              title={user.email}
            >
              {user.email}
            </span>
          )}
          <LogoutButton />
        </div>

        {/* Mobile layout */}
        <div className="flex min-w-0 flex-1 items-center justify-between md:hidden">
          <Brand />
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-panel"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-neutral-700 text-neutral-300 transition hover:border-neutral-500 hover:text-neutral-100"
          >
            {menuOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Floating mobile menu */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-30 animate-backdrop-in bg-black/50 md:hidden"
            aria-hidden="true"
          />
          <div
            id="mobile-nav-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="fixed left-4 right-4 top-[64px] z-40 origin-top animate-menu-in overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl shadow-black/50 md:hidden"
          >
            {user?.email && (
              <div className="border-b border-neutral-800 px-4 py-3">
                <p className="truncate text-xs text-neutral-500" title={user.email}>
                  {user.email}
                </p>
              </div>
            )}

            <nav className="flex flex-col gap-1 p-2">
              {links.map((link) => {
                const active = isActive(pathname, link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition " +
                      (active
                        ? "bg-neutral-800 text-neutral-100"
                        : "text-neutral-300 hover:bg-neutral-800/60 hover:text-neutral-100")
                    }
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0 text-neutral-400" />
                    <span className="truncate">{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-neutral-800 p-2">
              <LogoutButton className="w-full justify-center" onNavigate={() => setMenuOpen(false)} />
            </div>
          </div>
        </>
      )}
    </header>
  );
}
