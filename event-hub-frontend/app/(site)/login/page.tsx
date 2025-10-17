"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition } from "react";
import { useSession } from "@/providers/session-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useSession();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const profile = await login(form);
        const destination =
          profile.role === "ADMIN"
            ? "/app/admin/users"
            : profile.role === "CLUB_ADMIN"
              ? "/app/club/dashboard"
              : "/app/dashboard";
        router.replace(destination);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Login failed");
      }
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-white">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-300">
          Sign in with your campus credentials to continue.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-white/10 bg-slate-950/70 p-8">
        <div className="flex flex-col gap-3">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            autoComplete="username"
            value={form.username}
            onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
            required
          />
        </div>

        <div className="flex flex-col gap-3">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            required
          />
        </div>

        <Suspense fallback={null}>
          <RegisteredNotice />
        </Suspense>

        {error ? <Alert variant="error" title="Unable to sign in" description={error} /> : null}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-400">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-sky-300 transition hover:text-sky-200">
          Create one
        </Link>
      </p>
    </div>
  );
}

function RegisteredNotice() {
  const searchParams = useSearchParams();
  const wasRegistered = searchParams?.get("registered");

  if (!wasRegistered) {
    return null;
  }

  return (
    <Alert
      variant="success"
      title="Account created"
      description="Your account is ready. Sign in to explore Event Hub."
    />
  );
}
