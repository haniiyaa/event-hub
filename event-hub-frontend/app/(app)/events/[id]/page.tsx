"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { ApiError, apiFetch } from "@/lib/api-client";
import type { ClubStatus, EventDetail, InstructionSummary, RegistrationSummary } from "@/lib/types";
import { formatDateTime, formatRelative } from "@/lib/date";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

interface FeedbackState {
  type: "success" | "error";
  message: string;
}

interface LoadOptions {
  showLoader?: boolean;
}

export default function EventDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const eventId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [instructions, setInstructions] = useState<InstructionSummary[]>([]);
  const [registration, setRegistration] = useState<RegistrationSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [actionPending, startAction] = useTransition();

  const loadEvent = useCallback(
    async ({ showLoader = true }: LoadOptions = {}) => {
      if (!eventId) {
        setError("Missing event id");
        setEvent(null);
        return;
      }

      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        setError(null);
        const eventData = await apiFetch<EventDetail>(`/api/student/events/${eventId}`);
        setEvent(eventData);

        let instructionData: InstructionSummary[] = [];
        try {
          instructionData = await apiFetch<InstructionSummary[]>(`/api/student/events/${eventId}/instructions`);
        } catch (instructionError) {
          console.warn("Unable to load instructions", instructionError);
        }
        setInstructions(instructionData ?? []);

        let registrationsData: RegistrationSummary[] = [];
        try {
          registrationsData = await apiFetch<RegistrationSummary[]>("/api/student/me/registrations");
        } catch (registrationError) {
          console.warn("Unable to load registrations", registrationError);
        }
        const match = registrationsData.find((reg) => String(reg.event.id) === String(eventId));
        setRegistration(match ?? null);
      } catch (err) {
        console.error("Failed to load event", err);
        setEvent(null);
        if (err instanceof ApiError) {
          setError(err.message || "Unable to load event");
        } else {
          setError("Unable to load event details. Please try again later.");
        }
      } finally {
        if (showLoader) {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [eventId]
  );

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  const handleRegister = useCallback(() => {
    if (!eventId) return;
    if (event?.club?.status && event.club.status !== "ACTIVE") {
      return;
    }
    setFeedback(null);
    startAction(async () => {
      try {
        await apiFetch(`/api/student/events/${eventId}/register`, {
          method: "POST",
        });
        await loadEvent({ showLoader: false });
        setFeedback({ type: "success", message: "You're registered for this event." });
      } catch (err) {
        console.error("Registration failed", err);
        const message = err instanceof ApiError ? err.message : "Unable to register right now.";
        setFeedback({ type: "error", message });
      }
    });
  }, [eventId, event?.club?.status, loadEvent, startAction]);

  const handleCancel = useCallback(() => {
    if (!eventId) return;
    setFeedback(null);
    startAction(async () => {
      try {
        await apiFetch(`/api/student/events/${eventId}/register`, {
          method: "DELETE",
        });
        await loadEvent({ showLoader: false });
        setFeedback({ type: "success", message: "Your registration has been cancelled." });
      } catch (err) {
        console.error("Cancellation failed", err);
        const message = err instanceof ApiError ? err.message : "Unable to cancel registration.";
        setFeedback({ type: "error", message });
      }
    });
  }, [eventId, loadEvent, startAction]);

  const spotsRemaining = useMemo(() => {
    if (!event) return null;
    const remaining = Math.max(event.capacity - (event.currentRegistrations ?? 0), 0);
    return remaining;
  }, [event]);

  const isFull = useMemo(() => spotsRemaining !== null && spotsRemaining <= 0, [spotsRemaining]);
  const eventDate = useMemo(() => (event ? new Date(event.eventDate) : null), [event]);
  const isPastEvent = useMemo(() => (eventDate ? eventDate.getTime() < Date.now() : false), [eventDate]);
  const clubStatus = (event?.club?.status ?? "ACTIVE") as ClubStatus;
  const isClubActive = clubStatus === "ACTIVE";
  const clubStatusBadges: Partial<Record<ClubStatus, { variant: "info" | "warning" | "default"; label: string }>> = {
    PENDING: { variant: "warning", label: "Club pending approval" },
    RETIRED: { variant: "default", label: "Club retired" },
  };
  const clubStatusCallouts: Partial<Record<ClubStatus, { variant: "warning" | "info"; description: string }>> = {
    PENDING: {
      variant: "info",
      description: "This club is awaiting campus admin approval. New registrations are on hold for now.",
    },
    RETIRED: {
      variant: "warning",
      description: "This club has retired, so this event is not accepting additional registrations.",
    },
  };
  const clubStatusBadge = clubStatusBadges[clubStatus];
  const clubStatusCallout = clubStatusCallouts[clubStatus];

  const registrationStatus = registration?.status ?? null;
  const isRegistered = registrationStatus === "REGISTERED" || registrationStatus === "ATTENDED";
  const isCancelled = registrationStatus === "CANCELLED";

  const showRegisterButton = !isRegistered && !isPastEvent && !isFull && isClubActive;
  const showRegisterAgainButton = isCancelled && !isPastEvent && !isFull && isClubActive;
  const showCancelButton = registrationStatus === "REGISTERED" && !isPastEvent;

  const registrationBadge = useMemo(() => {
    switch (registrationStatus) {
      case "REGISTERED":
        return { label: "Registered", variant: "success" as const };
      case "ATTENDED":
        return { label: "Attended", variant: "info" as const };
      case "CANCELLED":
        return { label: "Registration cancelled", variant: "warning" as const };
      default:
        return { label: "Not registered", variant: "default" as const };
    }
  }, [registrationStatus]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-6 sm:px-10">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12 sm:px-10">
        <Link href="/app/events" className={buttonClasses({ variant: "ghost", size: "sm" })}>
          ← Back to events
        </Link>
        <Alert variant="error" title="Unable to load event" description={error} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12 sm:px-10">
        <Link href="/app/events" className={buttonClasses({ variant: "ghost", size: "sm" })}>
          ← Back to events
        </Link>
        <Alert variant="info" title="Event not found" description="The event you're looking for may have been removed." />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12 sm:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/app/events" className={buttonClasses({ variant: "ghost", size: "sm" })}>
          ← Back to events
        </Link>
        {refreshing ? (
          <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Refreshing…</span>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold text-white">{event.title}</h1>
          {event.club ? <Badge variant="info">{event.club.name}</Badge> : null}
          {!isClubActive && clubStatusBadge ? (
            <Badge variant={clubStatusBadge.variant}>{clubStatusBadge.label}</Badge>
          ) : null}
          {isFull ? <Badge variant="warning">Event full</Badge> : null}
          {isPastEvent ? <Badge variant="default">Past event</Badge> : null}
        </div>
        <p className="max-w-3xl text-sm text-slate-300">{event.description}</p>
      </div>

      {feedback ? (
        <Alert
          variant={feedback.type === "success" ? "success" : "error"}
          title={feedback.type === "success" ? "Success" : "Something went wrong"}
          description={feedback.message}
        />
      ) : null}

      {clubStatusCallout ? (
        <Alert variant={clubStatusCallout.variant} description={clubStatusCallout.description} />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Event overview</CardTitle>
            <CardDescription>Everything you need to know before you go.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">
              <DetailBlock
                label="Date & time"
                primary={formatDateTime(event.eventDate)}
                secondary={`(${formatRelative(event.eventDate)})`}
              />
              <DetailBlock label="Location" primary={event.location} />
              <DetailBlock
                label="Capacity"
                primary={`${event.currentRegistrations ?? 0}/${event.capacity} registered`}
                secondary={spotsRemaining !== null ? `${spotsRemaining} spot${spotsRemaining === 1 ? "" : "s"} remaining` : undefined}
              />
              {event.createdAt ? (
                <DetailBlock label="Posted" primary={formatDateTime(event.createdAt)} secondary={`(${formatRelative(event.createdAt)})`} />
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="h-max">
          <CardHeader>
            <CardTitle>Registration</CardTitle>
            <CardDescription>Manage your RSVP for this event.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={registrationBadge.variant}>{registrationBadge.label}</Badge>
              {registration?.registeredAt ? (
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Updated {formatRelative(registration.registeredAt)}
                </span>
              ) : null}
            </div>

            {isPastEvent ? (
              <Alert variant="info" description="This event has already taken place." />
            ) : null}

            {isFull && !isRegistered ? (
              <Alert variant="warning" description="This event is currently full. Check back later to see if a spot opens up." />
            ) : null}

            <div className="flex flex-wrap gap-3">
              {showRegisterButton || showRegisterAgainButton ? (
                <Button onClick={handleRegister} disabled={actionPending || refreshing}>
                  {actionPending ? "Processing…" : showRegisterAgainButton ? "Register again" : "Register for this event"}
                </Button>
              ) : null}
              {showCancelButton ? (
                <Button variant="secondary" onClick={handleCancel} disabled={actionPending || refreshing}>
                  {actionPending ? "Processing…" : "Cancel registration"}
                </Button>
              ) : null}
            </div>

            {registrationStatus === "ATTENDED" ? (
              <p className="text-xs text-slate-400">
                Thanks for attending! Keep an eye on your email for post-event follow-ups.
              </p>
            ) : null}
            {isCancelled ? (
              <p className="text-xs text-slate-400">You cancelled your spot. Register again if plans change.</p>
            ) : null}
            {!registrationStatus ? (
              <p className="text-xs text-slate-400">Reserve your seat to receive reminders and updates.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Instructions & preparation</CardTitle>
          <CardDescription>Guidelines shared by the organizing club.</CardDescription>
        </CardHeader>
        <CardContent>
          {instructions.length === 0 ? (
            <p className="text-sm text-slate-400">No special instructions yet. Check back closer to the event date.</p>
          ) : (
            <ul className="space-y-4">
              {instructions.map((instruction) => (
                <li key={instruction.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-white">{instruction.title}</h4>
                      {instruction.createdAt ? (
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          Posted {formatRelative(instruction.createdAt)}
                        </p>
                      ) : null}
                    </div>
                    {instruction.isImportant ? <Badge variant="warning">Important</Badge> : null}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{instruction.content}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DetailBlock({
  label,
  primary,
  secondary,
}: {
  label: string;
  primary: string;
  secondary?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-slate-950/40 p-4">
      <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <span className="text-base font-semibold text-white">{primary}</span>
      {secondary ? <span className="text-xs text-slate-400">{secondary}</span> : null}
    </div>
  );
}
