"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, buttonClasses } from "@/components/ui/button";
import { useSession } from "@/providers/session-provider";
import clsx from "clsx";

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useSession();

  const navLinks = [
    { href: "/", label: "Home" },
    ...(user ? [{ href: "/app/dashboard", label: "Dashboard" }] : []),
    { href: "/app/events", label: "Events" },
    { href: "/app/registrations", label: "My Registrations" },
    ...(user?.role === "CLUB_ADMIN"
      ? [
          { href: "/app/club/dashboard", label: "Club Dashboard" },
          { href: "/app/club/events", label: "Manage Events" },
        ]
      : []),
    ...(user?.role === "ADMIN"
      ? [{ href: "/app/admin/users", label: "Admin" }]
      : []),
  ];

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4 sm:px-10">
        <Link href="/" className="text-lg font-semibold tracking-tight text-white">
          Event Hub
        </Link>
        <nav className="flex items-center gap-6 text-sm font-semibold text-slate-300">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "transition hover:text-white",
                isActive(link.href) ? "text-white" : undefined
              )}
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-slate-300 sm:inline-flex">
                {user.fullName || user.username}
              </span>
              <Button variant="secondary" size="sm" onClick={() => void logout()}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold text-slate-300 transition hover:text-white">
                Log in
              </Link>
              <Link href="/register" className={buttonClasses({ size: "sm" })}>
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
