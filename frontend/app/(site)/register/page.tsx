"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useSession } from "@/providers/session-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    username: "",
    email: "",
    fullName: "",
    phoneNumber: "",
    classDetails: "",
    password: "",
    confirmPassword: "",
  });
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords must match");
      return;
    }

    const phoneNumber = form.phoneNumber.trim();
    const classDetails = form.classDetails.trim();

    if (!phoneNumber || !classDetails) {
      setError("Phone number and class details are required");
      return;
    }

    startTransition(async () => {
      try {
        await register({
          username: form.username,
          email: form.email,
          fullName: form.fullName,
          phoneNumber,
          classDetails,
          password: form.password,
        });
        router.replace("/login?registered=1");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Registration failed");
      }
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-white">Join Event Hub</h1>
        <p className="mt-2 text-sm text-slate-300">
          Create your account to discover upcoming events and manage your registrations.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 rounded-3xl border border-white/10 bg-slate-950/70 p-8 md:grid-cols-2">
        <div className="flex flex-col gap-3 md:col-span-1">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            autoComplete="username"
            value={form.username}
            onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
            required
          />
        </div>

        <div className="flex flex-col gap-3 md:col-span-1">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            autoComplete="name"
            value={form.fullName}
            onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
            required
          />
        </div>

        <div className="flex flex-col gap-3 md:col-span-1">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            required
          />
        </div>

        <div className="flex flex-col gap-3 md:col-span-1">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            value={form.phoneNumber}
            onChange={(event) => setForm((prev) => ({ ...prev, phoneNumber: event.target.value }))}
            required
          />
        </div>

        <div className="flex flex-col gap-3 md:col-span-1">
          <Label htmlFor="classDetails">Program / class details</Label>
          <Input
            id="classDetails"
            placeholder="e.g. BSc Computer Science, Class of 2027"
            value={form.classDetails}
            onChange={(event) => setForm((prev) => ({ ...prev, classDetails: event.target.value }))}
            required
          />
        </div>

        <div className="flex flex-col gap-3">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            required
          />
        </div>

        <div className="flex flex-col gap-3">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
            required
          />
        </div>

        {error ? (
          <div className="md:col-span-2">
            <Alert variant="error" title="Unable to create account" description={error} />
          </div>
        ) : null}

        <div className="md:col-span-2">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating account…" : "Create account"}
          </Button>
        </div>
      </form>

      <p className="text-center text-sm text-slate-400">
        Already registered?{" "}
        <Link href="/login" className="text-sky-300 transition hover:text-sky-200">
          Sign in
        </Link>
      </p>
    </div>
  );
}
