"use client";

import Link from "next/link";
import { useSession } from "@/providers/session-provider";

const ARCHITECTURE_DOC_URL = "https://github.com/haniiyaa/event-hub/blob/main/docs/frontend-architecture.md";

export function Footer() {
  const { user } = useSession();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-white/10 bg-slate-950/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <p>&copy; {year} Event Hub. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <Link href="/app/events" className="transition hover:text-white">
            Browse events
          </Link>
          {user ? (
            <Link href="/app/registrations" className="transition hover:text-white">
              My registrations
            </Link>
          ) : (
            <>
              <Link href="/login" className="transition hover:text-white">
                Login
              </Link>
              <Link href="/register" className="transition hover:text-white">
                Register
              </Link>
            </>
          )}
          <a
            href={ARCHITECTURE_DOC_URL}
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-white"
          >
            Frontend guide
          </a>
        </div>
      </div>
    </footer>
  );
}
