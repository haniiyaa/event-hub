"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatPanel } from "@/components/chat/chat-panel";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { ClubStatus, EventSummary, InstructionSummary, RegistrationSummary } from "@/lib/types";
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

type InstructionState = {
  loading: boolean;
  error: string | null;
  items: InstructionSummary[];
  fetched: boolean;
};

const DATE_TIME_INPUT_REGEX = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?$/;
const DATE_ONLY_INPUT_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

function normalizeEventDate(value?: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const withoutTimezone = trimmed.replace(/([+-]\d{2}:\d{2}|Z)$/i, "");
  const normalized = withoutTimezone.replace(" ", "T");
  const fullMatch = DATE_TIME_INPUT_REGEX.exec(normalized);
  if (!fullMatch) {
    const dateOnlyMatch = DATE_ONLY_INPUT_REGEX.exec(normalized);
    if (!dateOnlyMatch) {
      return null;
    }
    const [, year, month, day] = dateOnlyMatch;
    return `${year}-${month}-${day}T00:00:00`;
  }
  const [, year, month, day, hour, minute, second, fraction] = fullMatch;
  const safeSecond = second ?? "00";
  const normalizedSeconds = fraction ? `${safeSecond}.${fraction}` : safeSecond;
  return `${year}-${month}-${day}T${hour}:${minute}:${normalizedSeconds}`;
}

function toPickerInputValue(value: string): string {
  const normalized = normalizeEventDate(value);
  if (normalized) {
    return normalized.slice(0, 16);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (DATE_ONLY_INPUT_REGEX.test(trimmed)) {
    return `${trimmed}T00:00`;
  }
  const fallback = trimmed.replace(" ", "T");
  return fallback.length >= 16 ? fallback.slice(0, 16) : "";
}

function toManualInputValue(value: string): string {
  const normalized = normalizeEventDate(value);
  if (normalized) {
    return normalized.replace("T", " ").slice(0, 16);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  return trimmed.replace("T", " ").replace(/\s+/g, " ");
}

function sanitizeManualDateInput(value: string): string {
  return value.replace(/[^0-9T:\-. ]/g, "").replace(/\s+/g, " ");
}

function prepareFilterValue(value: string): { param?: string; error?: string } {
  if (!value.trim()) {
    return { param: undefined };
  }
  const normalized = normalizeEventDate(value);
  if (!normalized) {
    return { error: "Enter a valid date and time (YYYY-MM-DD HH:mm)." };
  }
  return { param: normalized };
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [filters, setFilters] = useState<Filters>(() => createDefaultFilters());
  const [filterModes, setFilterModes] = useState<{ from: "picker" | "manual"; to: "picker" | "manual" }>(() => ({
    from: "picker",
    to: "picker",
  }));
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const latestRequestIdRef = useRef(0);
  const [registrations, setRegistrations] = useState<RegistrationSummary[]>([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(true);
  const [registrationsError, setRegistrationsError] = useState<string | null>(null);
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<number | null>(null);
  const [registrationInstructions, setRegistrationInstructions] = useState<Record<number, InstructionState>>({});
  const [filtersError, setFiltersError] = useState<string | null>(null);

  const visibleEvents = useMemo(() => {
    return events.filter((event) => {
      const status = (event.club?.status ?? "ACTIVE") as ClubStatus;
      return !event.club || status === "ACTIVE";
    });
  }, [events]);

  const hiddenEventsCount = events.length - visibleEvents.length;

  const loadEvents = useCallback(async (nextFilters: Filters) => {
    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;

    const preparedFrom = prepareFilterValue(nextFilters.from);
    const preparedTo = prepareFilterValue(nextFilters.to);
    if (preparedFrom.error || preparedTo.error) {
      setFiltersError(preparedFrom.error ?? preparedTo.error ?? null);
      setIsPending(false);
      setInitialLoading(false);
      return;
    }
    setFiltersError(null);

    setIsPending(true);
    try {
      setError(null);
      const data = await apiFetch<EventSummary[] | null | undefined>("/api/student/events", {
        searchParams: {
          q: nextFilters.q || undefined,
          from: preparedFrom.param,
          to: preparedTo.param,
        },
      });
      setEvents(Array.isArray(data) ? data : []);
      setLastUpdatedAt(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      if (latestRequestIdRef.current === requestId) {
        setIsPending(false);
      }
      setInitialLoading(false);
    }
  }, []);

  const loadRegistrations = useCallback(async () => {
    setRegistrationsLoading(true);
    setRegistrationsError(null);
    try {
      const payload = await apiFetch<RegistrationSummary[] | null | undefined>("/api/student/me/registrations");
      const active = (Array.isArray(payload) ? payload : []).filter((registration) => registration.status !== "CANCELLED");
      setRegistrations(active);
      setSelectedRegistrationId((previous) => {
        if (previous && active.some((registration) => registration.registrationId === previous)) {
          return previous;
        }
        return active[0]?.registrationId ?? null;
      });
      if (active.length === 0) {
        setRegistrationInstructions({});
      }
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setRegistrations([]);
        setSelectedRegistrationId(null);
        setRegistrationInstructions({});
        setRegistrationsError(null);
      } else {
        setRegistrationsError(err instanceof Error ? err.message : "Unable to load your registrations");
      }
    } finally {
      setRegistrationsLoading(false);
    }
  }, []);

  const loadRegistrationInstructions = useCallback(
    async (eventId: number, options: { force?: boolean } = {}) => {
      setRegistrationInstructions((previous) => {
        const current = previous[eventId];
        if (!options.force && current && (current.loading || (current.fetched && !current.error))) {
          return previous;
        }

        return {
          ...previous,
          [eventId]: {
            loading: true,
            error: null,
            items: current?.items ?? [],
            fetched: current?.fetched ?? false,
          },
        };
      });

      try {
        const payload = await apiFetch<InstructionSummary[] | null | undefined>(
          `/api/student/events/${eventId}/instructions`
        );
        setRegistrationInstructions((previous) => ({
          ...previous,
          [eventId]: {
            loading: false,
            error: null,
            items: Array.isArray(payload) ? payload : [],
            fetched: true,
          },
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to load instructions";
        setRegistrationInstructions((previous) => ({
          ...previous,
          [eventId]: {
            loading: false,
            error: message,
            items: [],
            fetched: true,
          },
        }));
      }
    },
    []
  );

  useEffect(() => {
    loadEvents(filters).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadRegistrations().catch(() => undefined);
  }, [loadRegistrations]);

  useEffect(() => {
    if (registrations.length === 0) {
      setSelectedRegistrationId(null);
      return;
    }
    setSelectedRegistrationId((previous) => {
      if (previous && registrations.some((registration) => registration.registrationId === previous)) {
        return previous;
      }
      return registrations[0]?.registrationId ?? null;
    });
  }, [registrations]);

  useEffect(() => {
    if (!selectedRegistrationId) {
      return;
    }
    const registration = registrations.find((item) => item.registrationId === selectedRegistrationId);
    if (!registration) {
      return;
    }
    void loadRegistrationInstructions(registration.event.id);
  }, [selectedRegistrationId, registrations, loadRegistrationInstructions]);

  const activeRegistration = useMemo(() => {
    if (!selectedRegistrationId) {
      return null;
    }
    return registrations.find((item) => item.registrationId === selectedRegistrationId) ?? null;
  }, [registrations, selectedRegistrationId]);

  const activeEventId = activeRegistration?.event.id ?? null;
  const activeInstructionState = activeEventId ? registrationInstructions[activeEventId] : undefined;

  const handleRegistrationSelect = useCallback(
    (registrationId: number) => {
      setSelectedRegistrationId(registrationId);
      const registration = registrations.find((item) => item.registrationId === registrationId);
      if (registration) {
        void loadRegistrationInstructions(registration.event.id);
      }
    },
    [registrations, loadRegistrationInstructions]
  );

  const handleRegisteredInstructionsRefresh = useCallback(() => {
    if (!activeEventId) {
      return;
    }
    void loadRegistrationInstructions(activeEventId, { force: true });
  }, [activeEventId, loadRegistrationInstructions]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadEvents(filters);
  };

  const handleFilterDateChange = useCallback((key: "from" | "to", value: string, mode: "picker" | "manual") => {
    const nextValue = mode === "manual" ? sanitizeManualDateInput(value) : value;
    setFilters((prev) => ({ ...prev, [key]: nextValue }));
    setFiltersError(null);
  }, []);

  const handleReset = () => {
    const cleared = createDefaultFilters();
    setFilters(cleared);
    setFilterModes({ from: "picker", to: "picker" });
    setFiltersError(null);
    void loadEvents(cleared);
  };

  const hasActiveFilters = Boolean(filters.q.trim() || filters.from.trim() || filters.to.trim());

  const fromInputId = filterModes.from === "picker" ? "from" : "fromManual";
  const toInputId = filterModes.to === "picker" ? "to" : "toManual";
  const fromPickerValue = toPickerInputValue(filters.from);
  const fromManualValue = toManualInputValue(filters.from);
  const toPickerValue = toPickerInputValue(filters.to);
  const toManualValue = toManualInputValue(filters.to);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 sm:px-10">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold text-white">Discover events</h1>
        <p className="text-sm text-slate-300">
          Filter by keyword or date range to find the perfect campus experience.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-white">Your registered events</h2>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Review instructions, then jump straight into the chat with fellow attendees.
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadRegistrations().catch(() => undefined)}
            disabled={registrationsLoading}
          >
            {registrationsLoading ? "Loading…" : "Refresh"}
          </Button>
        </div>

        {registrationsError ? (
          <Alert variant="error" title="Unable to load registrations" description={registrationsError} />
        ) : registrationsLoading ? (
          <div className="flex min-h-[20vh] items-center justify-center">
            <Spinner />
          </div>
        ) : registrations.length === 0 ? (
          <Alert
            variant="info"
            title="No registrations yet"
            description="Browse upcoming events below to reserve your spot and unlock chat access."
          />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card className="border-white/10 bg-slate-900/40">
              <CardHeader>
                <CardTitle className="text-base text-white">Registered events</CardTitle>
                <CardDescription>Choose an RSVP to see updates.</CardDescription>
              </CardHeader>
              <CardContent>
                <RegisteredEventList
                  registrations={registrations}
                  activeId={selectedRegistrationId}
                  onSelect={handleRegistrationSelect}
                />
              </CardContent>
            </Card>

            {activeRegistration ? (
              <RegisteredEventDetail
                registration={activeRegistration}
                instructionState={activeInstructionState}
                onRefreshInstructions={handleRegisteredInstructionsRefresh}
              />
            ) : (
              <Card className="border-dashed border-white/15 bg-slate-900/30">
                <CardContent className="flex min-h-[18rem] items-center justify-center text-center text-sm text-slate-400">
                  Select a registration to review instructions and chat with attendees.
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </section>

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
            onChange={(event) => {
              setFilters((prev) => ({ ...prev, q: event.target.value }));
              setFiltersError(null);
            }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={fromInputId}>From</Label>
            <button
              type="button"
              className="text-xs font-semibold text-sky-300 transition hover:text-sky-200"
              onClick={() => {
                setFilterModes((prev) => ({ ...prev, from: prev.from === "picker" ? "manual" : "picker" }));
                setFiltersError(null);
              }}
            >
              {filterModes.from === "picker" ? "Type manually" : "Use calendar"}
            </button>
          </div>
          {filterModes.from === "picker" ? (
            <Input
              id="from"
              type="datetime-local"
              step={60}
              value={fromPickerValue}
              onChange={(event) => handleFilterDateChange("from", event.target.value, "picker")}
            />
          ) : (
            <Input
              id="fromManual"
              type="text"
              placeholder="YYYY-MM-DD HH:mm"
              value={fromManualValue}
              onChange={(event) => handleFilterDateChange("from", event.target.value, "manual")}
            />
          )}
          <p className="text-xs text-slate-500">Example: 2025-10-18 19:30</p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={toInputId}>To</Label>
            <button
              type="button"
              className="text-xs font-semibold text-sky-300 transition hover:text-sky-200"
              onClick={() => {
                setFilterModes((prev) => ({ ...prev, to: prev.to === "picker" ? "manual" : "picker" }));
                setFiltersError(null);
              }}
            >
              {filterModes.to === "picker" ? "Type manually" : "Use calendar"}
            </button>
          </div>
          {filterModes.to === "picker" ? (
            <Input
              id="to"
              type="datetime-local"
              step={60}
              value={toPickerValue}
              onChange={(event) => handleFilterDateChange("to", event.target.value, "picker")}
            />
          ) : (
            <Input
              id="toManual"
              type="text"
              placeholder="YYYY-MM-DD HH:mm"
              value={toManualValue}
              onChange={(event) => handleFilterDateChange("to", event.target.value, "manual")}
            />
          )}
          <p className="text-xs text-slate-500">Example: 2025-10-18 19:30</p>
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

      {filtersError ? (
        <Alert variant="error" title="Check filter dates" description={filtersError} />
      ) : null}

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

function RegisteredEventList({
  registrations,
  activeId,
  onSelect,
}: {
  registrations: RegistrationSummary[];
  activeId: number | null;
  onSelect: (registrationId: number) => void;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {registrations.map((registration) => {
        const event = registration.event;
        const isSelected = registration.registrationId === activeId;
        return (
          <li key={registration.registrationId}>
            <button
              type="button"
              onClick={() => onSelect(registration.registrationId)}
              className={`flex w-full flex-col gap-3 rounded-2xl border px-4 py-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                isSelected ? "border-sky-400 bg-sky-400/10" : "border-white/5 hover:border-sky-300/40"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-white">{event.title}</span>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span>{formatDateTime(event.eventDate)}</span>
                    <span className="uppercase tracking-[0.2em] text-slate-500">{formatRelative(event.eventDate)}</span>
                    <span>{event.location}</span>
                  </div>
                </div>
                <Badge variant="default">{registration.status.replace("_", " ")}</Badge>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <span>{event.currentRegistrations ?? 0}/{event.capacity} registered</span>
                <span>
                  Registered {registration.registeredAt ? formatRelative(registration.registeredAt) : "recently"}
                </span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function RegisteredEventDetail({
  registration,
  instructionState,
  onRefreshInstructions,
}: {
  registration: RegistrationSummary;
  instructionState?: InstructionState;
  onRefreshInstructions: () => void;
}) {
  const event = registration.event;
  const statusLabel = registration.status.replace("_", " ");
  const instructionsLoading = !instructionState || (instructionState.loading && !instructionState.fetched);
  const instructionsRefreshing = instructionState?.loading ?? false;
  const instructionItems = instructionState?.items ?? [];
  const instructionsError = instructionState?.error ?? null;
  const canChat = registration.status === "REGISTERED" || registration.status === "ATTENDED";

  return (
    <Card className="border-white/10 bg-slate-900/40">
      <CardHeader>
        <CardTitle className="text-base text-white">Event details & chat</CardTitle>
        <CardDescription>Stay in sync with organizers and other attendees.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-white">{event.title}</span>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span>{formatDateTime(event.eventDate)}</span>
                <span className="uppercase tracking-[0.2em] text-slate-500">{formatRelative(event.eventDate)}</span>
                <span>{event.location}</span>
              </div>
            </div>
            <Badge variant="default">{statusLabel}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span>{event.currentRegistrations ?? 0}/{event.capacity} registered</span>
            <span>
              Registered {registration.registeredAt ? formatRelative(registration.registeredAt) : "recently"}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-white">Event instructions</h3>
            <div className="flex items-center gap-3">
              {instructionsRefreshing ? (
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Refreshing…</span>
              ) : null}
              <Button
                variant="secondary"
                size="sm"
                onClick={onRefreshInstructions}
                disabled={instructionsRefreshing}
              >
                {instructionsRefreshing ? "Refreshing…" : "Refresh"}
              </Button>
            </div>
          </div>
          {instructionsError ? (
            <Alert variant="error" description={instructionsError} />
          ) : instructionsLoading ? (
            <div className="flex min-h-[4.5rem] items-center justify-center">
              <Spinner />
            </div>
          ) : instructionItems.length === 0 ? (
            <Alert
              variant="info"
              description="No instructions yet. Check back closer to the event date."
            />
          ) : (
            <ul className="space-y-3">
              {instructionItems.map((instruction) => (
                <li key={instruction.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{instruction.title}</p>
                      {instruction.createdAt ? (
                        <span className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">
                          Posted {formatRelative(instruction.createdAt)}
                        </span>
                      ) : null}
                    </div>
                    {instruction.isImportant ? <Badge variant="warning">Important</Badge> : null}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{instruction.content}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-white">Event chat</h3>
            {!canChat ? (
              <span className="text-xs text-slate-500">
                Chat unlocks once your registration is confirmed.
              </span>
            ) : null}
          </div>
          <ChatPanel
            resourceType="event"
            resourceId={event.id}
            title={`${event.title} chat`}
            disabledReason={canChat ? undefined : "Register or await approval to join the conversation."}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/app/events/${event.id}`}
            className={buttonClasses({ variant: "primary", size: "sm", className: "justify-center" })}
          >
            Open event details
          </Link>
          <Link
            href="/app/registrations"
            className={buttonClasses({ variant: "secondary", size: "sm", className: "justify-center" })}
          >
            Manage all registrations
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
