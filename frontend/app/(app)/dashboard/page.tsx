"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { apiFetch } from "@/lib/api-client";
import { formatDateTime, formatRelative } from "@/lib/date";
import type { StudentDashboardInstruction, StudentDashboardRegistration, StudentDashboardResponse } from "@/lib/types";
import { useSession } from "@/providers/session-provider";

export default function StudentDashboardPage() {
  const { user, loading: sessionLoading } = useSession();
  const [data, setData] = useState<StudentDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    apiFetch<StudentDashboardResponse>("/api/student/dashboard")
      .then((payload) => setData(payload))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load dashboard"))
      .finally(() => setLoading(false));
  }, [sessionLoading, user]);

  const metrics = useMemo(() => data?.metrics ?? { totalRegistrations: 0, upcomingRegistrations: 0, pendingInstructions: 0 }, [data]);

  if (sessionLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12 text-center sm:px-10">
        <Alert
          variant="info"
          title="You are not signed in"
          description="Log in to access your personalized student dashboard."
        />
        <div className="flex justify-center gap-3">
          <Link href="/login" className={"inline-flex items-center justify-center rounded-full bg-sky-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"}>
            Log in
          </Link>
          <Link href="/register" className={"inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:border-white/40"}>
            Create account
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12 sm:px-10">
        <Alert variant="error" title="Unable to load dashboard" description={error} />
        <Button variant="secondary" className="w-fit" onClick={() => void window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const upcoming = data.upcomingRegistrations;
  const instructions = data.recentInstructions;
  const recommendations = data.recommendedEvents;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 sm:px-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold text-white">Welcome back, {user.fullName || user.username}</h1>
        <p className="text-sm text-slate-300">
          Track your upcoming RSVPs, review fresh instructions, and discover new events tailored to you.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Total registrations" value={metrics.totalRegistrations} tone="sky" />
        <MetricCard title="Upcoming events" value={metrics.upcomingRegistrations} tone="emerald" />
        <MetricCard title="New instructions" value={metrics.pendingInstructions} tone="amber" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-white/10 bg-slate-900/40">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3 text-base text-white">
              <span>Upcoming registrations</span>
              <Link href="/app/registrations" className="text-xs font-semibold text-sky-300 transition hover:text-sky-200">
                View all →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>{upcoming.length > 0 ? <UpcomingRegistrations items={upcoming} /> : <EmptyState message="You have no upcoming registrations yet." actionLabel="Browse events" actionHref="/app/events" />}</CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-900/40">
          <CardHeader>
            <CardTitle className="text-base text-white">Latest instructions</CardTitle>
          </CardHeader>
          <CardContent>{instructions.length > 0 ? <InstructionList items={instructions} /> : <EmptyState message="No new instructions. Check back closer to your events." />}</CardContent>
        </Card>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Recommended for you</h2>
          <Link href="/app/events" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 transition hover:text-slate-200">
            Explore catalog
          </Link>
        </div>
        {recommendations.length > 0 ? (
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            {recommendations.map((event) => (
              <Card key={event.id} className="border-white/10 bg-slate-900/40">
                <CardHeader className="space-y-2">
                  <CardTitle className="text-lg text-white">{event.title}</CardTitle>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{formatRelative(event.eventDate)}</p>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-slate-300">
                  <div>
                    <span className="font-semibold text-slate-100">{formatDateTime(event.eventDate)}</span>
                    <span className="ml-2 text-xs uppercase tracking-[0.2em] text-slate-500">{event.location}</span>
                  </div>
                  <p className="line-clamp-3 text-slate-300/90">{event.description}</p>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{event.currentRegistrations ?? 0}/{event.capacity} registered</span>
                    {event.club ? <Badge variant="info">{event.club.name}</Badge> : null}
                  </div>
                  <Link href={`/app/events/${event.id}`} className="inline-flex items-center justify-center rounded-full bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-300">
                    View details
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState message="No tailored recommendations yet. Register for events to see personalized picks." actionLabel="Browse events" actionHref="/app/events" />
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({ title, value, tone }: { title: string; value: number; tone: "sky" | "emerald" | "amber" }) {
  const palette = {
    sky: "from-sky-400/10 via-sky-500/5 to-transparent text-sky-200",
    emerald: "from-emerald-400/10 via-emerald-500/5 to-transparent text-emerald-200",
    amber: "from-amber-400/10 via-amber-500/5 to-transparent text-amber-200",
  } as const;

  return (
    <Card className={`border-white/10 bg-gradient-to-br ${palette[tone]}`}>
      <CardContent className="flex flex-col gap-2 py-6">
        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{title}</span>
        <span className="text-3xl font-semibold text-white">{value}</span>
      </CardContent>
    </Card>
  );
}

function UpcomingRegistrations({ items }: { items: StudentDashboardRegistration[] }) {
  return (
    <ul className="flex flex-col divide-y divide-white/5">
      {items.map((item) => (
        <li key={item.registrationId} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
          <div className="flex items-center justify-between gap-3">
            <Link href={`/app/events/${item.event.id}`} className="text-sm font-semibold text-white transition hover:text-sky-200">
              {item.event.title}
            </Link>
            <Badge variant="default">{item.status.replace("_", " ")}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span>{formatDateTime(item.event.eventDate)}</span>
            <span className="uppercase tracking-[0.2em] text-slate-500">{formatRelative(item.event.eventDate)}</span>
            <span>{item.event.location}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{item.event.currentRegistrations ?? 0}/{item.event.capacity} registered</span>
            <span>Registered {item.registeredAt ? formatRelative(item.registeredAt) : "recently"}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function InstructionList({ items }: { items: StudentDashboardInstruction[] }) {
  return (
    <ul className="flex flex-col divide-y divide-white/5">
      {items.map((instruction) => (
        <li key={instruction.instructionId} className="space-y-2 py-4 first:pt-0 last:pb-0">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">{instruction.title}</p>
            {instruction.important ? <Badge variant="warning">Important</Badge> : null}
          </div>
          <p className="text-sm text-slate-300/90">{instruction.content}</p>
          {instruction.event ? (
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="uppercase tracking-[0.2em] text-slate-500">{instruction.event.title}</span>
              {instruction.event.eventDate ? <span>{formatDateTime(instruction.event.eventDate)}</span> : null}
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ message, actionLabel, actionHref }: { message: string; actionLabel?: string; actionHref?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/50 p-6 text-sm text-slate-300">
      <p>{message}</p>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className="mt-3 inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
