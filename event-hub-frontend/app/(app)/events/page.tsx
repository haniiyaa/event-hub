"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { apiFetch } from "@/lib/api-client";
import type { ClubStatus, EventSummary } from "@/lib/types";
import { formatDateTime, formatRelative } from "@/lib/date";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button, buttonClasses } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

interface Filters {
  q: string;
  from: string;
  to: string;
}

const createDefaultFilters = (): Filters => ({ q: "", from: "", to: "" });

export default function EventsPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [filters, setFilters] = useState<Filters>(() => createDefaultFilters());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [initialLoading, setInitialLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const visibleEvents = useMemo(() => {
    return events.filter((event) => {
      const status = (event.club?.status ?? "ACTIVE") as ClubStatus;
      return !event.club || status === "ACTIVE";
    });
  }, [events]);

  const hiddenEventsCount = events.length - visibleEvents.length;

  const loadEvents = (nextFilters: Filters) => {
    startTransition(async () => {
      try {
        setError(null);
        const data = await apiFetch<EventSummary[]>("/api/student/events", {
          searchParams: {
            q: nextFilters.q || undefined,
            from: nextFilters.from || undefined,
            to: nextFilters.to || undefined,
          },
        });
        setEvents(data);
        setLastUpdatedAt(new Date().toISOString());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load events");
      } finally {
        setInitialLoading(false);
      }
    });
  };

  useEffect(() => {
    loadEvents(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loadEvents(filters);
  };

  const handleReset = () => {
    const cleared = createDefaultFilters();
    setFilters(cleared);
    loadEvents(cleared);
  };

  const hasActiveFilters = Boolean(filters.q || filters.from || filters.to);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 sm:px-10">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold text-white">Discover events</h1>
        <p className="text-sm text-slate-300">
          Filter by keyword or date range to find the perfect campus experience.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/70 p-6 md:grid-cols-[2fr_1fr_1fr_auto]"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="search">Keyword</Label>
          <Input
            id="search"
            placeholder="Search by title or club"
            value={filters.q}
            onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="from">From</Label>
          <Input
            id="from"
            type="datetime-local"
            value={filters.from}
            onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="to">To</Label>
          <Input
            id="to"
            type="datetime-local"
            value={filters.to}
            onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Filtering…" : "Apply filters"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="ml-2"
            onClick={handleReset}
            disabled={isPending || !hasActiveFilters}
          >
            Clear
          </Button>
        </div>
      </form>

      {error ? <Alert variant="error" title="Unable to load events" description={error} /> : null}

      {hiddenEventsCount > 0 ? (
        <Alert
          variant="info"
          title="Some events are hidden"
          description="Events from clubs that are awaiting approval or have been retired are not shown."
        />
      ) : null}

      {initialLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner />
        </div>
      ) : visibleEvents.length === 0 ? (
        <Alert
          variant="info"
          title={hiddenEventsCount > 0 ? "No active events available" : "No events match your filters"}
          description={hiddenEventsCount > 0
            ? "Clubs must be active to publish events. Check back soon or reach out to the organizers."
            : "Try clearing search filters or check back later for new programming."}
        />
      ) : (
        <div className="space-y-4" aria-live="polite">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
            <span>
              Showing {visibleEvents.length} {visibleEvents.length === 1 ? "event" : "events"}
            </span>
            <span>{isPending ? "Refreshing…" : lastUpdatedAt ? `Updated ${formatRelative(lastUpdatedAt)}` : ""}</span>
          </div>
          <div className="relative">
            {isPending ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-slate-950/60 backdrop-blur-sm">
                <Spinner />
              </div>
            ) : null}
            <div className={`grid gap-6 md:grid-cols-2 ${isPending ? "opacity-60" : ""}`}>
              {visibleEvents.map((event) => {
                const spotsRemaining = Math.max(event.capacity - (event.currentRegistrations ?? 0), 0);
                const isFull = spotsRemaining === 0;

                return (
                  <Card key={event.id} className="flex flex-col gap-4">
                    <CardHeader className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <CardTitle>{event.title}</CardTitle>
                          <CardDescription>{event.location}</CardDescription>
                        </div>
                        {event.club ? <Badge variant="info">{event.club.name}</Badge> : null}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-sm text-slate-300">
                        <span className="font-medium text-slate-100">{formatDateTime(event.eventDate)}</span>
                        <span className="ml-2 text-xs uppercase tracking-[0.2em] text-slate-500">({formatRelative(event.eventDate)})</span>
                      </div>
                      <p className="text-sm text-slate-300">{event.description}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                        <span>{event.currentRegistrations ?? 0}/{event.capacity} registered</span>
                        <Badge variant={isFull ? "warning" : "success"}>
                          {isFull ? "Event full" : `${spotsRemaining} spots left`}
                        </Badge>
                      </div>
                      <Link href={`/app/events/${event.id}`} className={buttonClasses({ className: "w-full justify-center" })}>
                        View details
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
