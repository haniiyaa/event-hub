"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { apiFetch } from "@/lib/api-client";
import type { RegistrationSummary } from "@/lib/types";
import { formatDateTime, formatRelative } from "@/lib/date";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

const STATUS_FILTERS = ["ALL", "REGISTERED", "ATTENDED", "CANCELLED"] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];

type GroupedRegistrations = Record<Exclude<StatusFilter, "ALL">, RegistrationSummary[]>;

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<RegistrationSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadRegistrations = useCallback(() => {
    startTransition(async () => {
      try {
        setError(null);
        const data = await apiFetch<RegistrationSummary[]>("/api/student/me/registrations");
        setRegistrations(data);
      } catch (err) {
        console.error("Failed to load registrations", err);
        setError(err instanceof Error ? err.message : "Unable to load registrations");
      } finally {
        setInitialLoading(false);
      }
    });
  }, [startTransition]);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  const grouped = useMemo(() => {
    return registrations.reduce<GroupedRegistrations>(
      (acc, item) => {
        const key = item.status as keyof GroupedRegistrations;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(item);
        return acc;
      },
      {
        REGISTERED: [],
        ATTENDED: [],
        CANCELLED: [],
      }
    );
  }, [registrations]);

  const filteredRegistrations = useMemo(() => {
    if (statusFilter === "ALL") return registrations;
    return registrations.filter((reg) => reg.status === statusFilter);
  }, [registrations, statusFilter]);

  const hasRegistrations = registrations.length > 0;

  const statusCounts = useMemo(() => {
    return {
      ALL: registrations.length,
      REGISTERED: grouped.REGISTERED.length,
      ATTENDED: grouped.ATTENDED.length,
      CANCELLED: grouped.CANCELLED.length,
    } satisfies Record<StatusFilter, number>;
  }, [grouped, registrations.length]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12 sm:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">Your registrations</h1>
          <p className="text-sm text-slate-300">Track upcoming events and revisit ones you have already attended.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/app/events" className={buttonClasses({ variant: "ghost", size: "sm" })}>
            Browse events
          </Link>
          <Button type="button" variant="secondary" onClick={loadRegistrations} disabled={isPending}>
            {isPending ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            className={buttonClasses({
              variant: filter === statusFilter ? "primary" : "secondary",
              size: "sm",
              className: "capitalize",
            })}
            onClick={() => setStatusFilter(filter)}
            disabled={isPending && filter !== statusFilter}
          >
            {filter.toLowerCase()} <span className="ml-2 text-xs uppercase tracking-[0.2em] text-slate-900/70">{statusCounts[filter]}</span>
          </button>
        ))}
      </div>

      {error ? <Alert variant="error" title="Unable to load registrations" description={error} /> : null}

      {initialLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner />
        </div>
      ) : !hasRegistrations ? (
        <Alert
          variant="info"
          title="No registrations yet"
          description="When you sign up for events you'll see them listed here with quick links and updates."
        />
      ) : filteredRegistrations.length === 0 ? (
        <Alert
          variant="default"
          title="No results for this filter"
          description="Try a different status filter to see other registrations."
        />
      ) : (
        <div className="space-y-4" aria-live="polite">
          {isPending ? (
            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 text-sm text-slate-400">
              Refreshing registrations…
            </div>
          ) : null}

          <div className="grid gap-6">
            {filteredRegistrations.map((registration) => {
              const event = registration.event;
              const isPastEvent = new Date(event.eventDate).getTime() < Date.now();

              return (
                <Card key={registration.registrationId} className="overflow-hidden">
                  <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-xl">{event.title}</CardTitle>
                      <CardDescription>{event.location}</CardDescription>
                    </div>
                    <Badge variant={statusToBadgeVariant(registration.status)}>{registration.status.toLowerCase()}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Detail label="Event date" value={formatDateTime(event.eventDate)} helper={`(${formatRelative(event.eventDate)})`} />
                      <Detail
                        label="Your RSVP"
                        value={formatDateTime(registration.registeredAt)}
                        helper={`(${formatRelative(registration.registeredAt)})`}
                      />
                      <Detail
                        label="Capacity"
                        value={`${event.currentRegistrations ?? 0}/${event.capacity} registered`}
                      />
                      <Detail label="Status" value={registration.status.toLowerCase()} capitalize />
                    </div>

                    {isPastEvent && registration.status === "REGISTERED" ? (
                      <Alert variant="info" description="This event has already passed. Update your status to keep your history accurate." />
                    ) : null}

                    <div className="flex flex-wrap gap-3">
                      <Link href={`/app/events/${event.id}`} className={buttonClasses({ variant: "primary", size: "sm" })}>
                        View event details
                      </Link>
                      {registration.status === "REGISTERED" ? (
                        <Link href={`/app/events/${event.id}`} className={buttonClasses({ variant: "secondary", size: "sm" })}>
                          Manage registration
                        </Link>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function statusToBadgeVariant(status: RegistrationSummary["status"]) {
  switch (status) {
    case "REGISTERED":
      return "success" as const;
    case "ATTENDED":
      return "info" as const;
    case "CANCELLED":
      return "warning" as const;
    default:
      return "default" as const;
  }
}

function Detail({
  label,
  value,
  helper,
  capitalize,
}: {
  label: string;
  value: string;
  helper?: string;
  capitalize?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-white/5 bg-slate-950/40 p-4">
      <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <span className={`text-base font-semibold text-white ${capitalize ? "capitalize" : ""}`}>{value}</span>
      {helper ? <span className="text-xs text-slate-400">{helper}</span> : null}
    </div>
  );
}
