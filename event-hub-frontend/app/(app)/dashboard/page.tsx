"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ChatPanel } from "@/components/chat/chat-panel";
import { apiFetch } from "@/lib/api-client";
import { formatDateTime, formatRelative } from "@/lib/date";
import type {
  ClubBrowseSummary,
  ClubMembershipSummary,
  InstructionSummary,
  StudentDashboardInstruction,
  StudentDashboardRegistration,
  StudentDashboardResponse,
} from "@/lib/types";
import { useSession } from "@/providers/session-provider";

type BannerState = { variant: "success" | "error"; message: string };

type RegistrationInstructionState = {
  loading: boolean;
  error: string | null;
  items: InstructionSummary[];
  fetched: boolean;
};

export default function StudentDashboardPage() {
  const { user, loading: sessionLoading } = useSession();
  const [data, setData] = useState<StudentDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clubMemberships, setClubMemberships] = useState<ClubMembershipSummary[]>([]);
  const [clubMembershipsLoading, setClubMembershipsLoading] = useState(true);
  const [clubMembershipsError, setClubMembershipsError] = useState<string | null>(null);
  const [activeClubId, setActiveClubId] = useState<number | null>(null);
  const [availableClubs, setAvailableClubs] = useState<ClubBrowseSummary[]>([]);
  const [availableClubsLoading, setAvailableClubsLoading] = useState(true);
  const [availableClubsError, setAvailableClubsError] = useState<string | null>(null);
  const [joinRequestBusyId, setJoinRequestBusyId] = useState<number | null>(null);
  const [joinRequestFeedback, setJoinRequestFeedback] = useState<BannerState | null>(null);
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<number | null>(null);
  const [registrationInstructions, setRegistrationInstructions] = useState<Record<number, RegistrationInstructionState>>({});

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

  const loadClubMemberships = useCallback(async () => {
    if (!user) {
      setClubMemberships([]);
      setClubMembershipsLoading(false);
      setActiveClubId(null);
      return;
    }
    setClubMembershipsLoading(true);
    setClubMembershipsError(null);
    try {
      const payload = await apiFetch<ClubMembershipSummary[]>("/api/student/clubs/memberships");
      const filtered = (payload ?? []).filter((membership) => membership.club?.id);
      setClubMemberships(filtered);
      setActiveClubId((previous) => {
        if (previous && filtered.some((membership) => membership.club?.id === previous)) {
          return previous;
        }
        return filtered[0]?.club?.id ?? null;
      });
    } catch (err) {
      setClubMembershipsError(err instanceof Error ? err.message : "Unable to load your clubs");
    } finally {
      setClubMembershipsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    if (!user) {
      setClubMemberships([]);
      setActiveClubId(null);
      setClubMembershipsLoading(false);
      return;
    }

    loadClubMemberships().catch(() => {
      // errors handled in loadClubMemberships
    });
  }, [sessionLoading, user, loadClubMemberships]);

  const loadAvailableClubs = useCallback(async () => {
    if (!user) {
      setAvailableClubs([]);
      setAvailableClubsLoading(false);
      setAvailableClubsError(null);
      return;
    }
    setAvailableClubsLoading(true);
    setAvailableClubsError(null);
    try {
      const payload = await apiFetch<ClubBrowseSummary[]>("/api/student/clubs/available");
      setAvailableClubs(payload ?? []);
    } catch (err) {
      setAvailableClubsError(err instanceof Error ? err.message : "Unable to load clubs");
    } finally {
      setAvailableClubsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    if (!user) {
      setAvailableClubs([]);
      setAvailableClubsLoading(false);
      setAvailableClubsError(null);
      return;
    }

    loadAvailableClubs().catch(() => {
      // errors handled inside loadAvailableClubs
    });
  }, [sessionLoading, user, loadAvailableClubs]);

  useEffect(() => {
    if (!user) {
      setSelectedRegistrationId(null);
      setRegistrationInstructions({});
    }
  }, [user]);

  const handleJoinClub = useCallback(
    async (clubId: number) => {
      if (!user) {
        return;
      }
      setJoinRequestFeedback(null);
      setJoinRequestBusyId(clubId);
      try {
        await apiFetch(`/api/student/clubs/${clubId}/join-requests`, {
          method: "POST",
          body: JSON.stringify({ message: "" }),
        });
        setJoinRequestFeedback({ variant: "success", message: "Request sent. Expect a response soon." });
        await loadAvailableClubs();
        await loadClubMemberships();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to submit request";
        setJoinRequestFeedback({ variant: "error", message });
      } finally {
        setJoinRequestBusyId(null);
      }
    },
    [user, loadAvailableClubs, loadClubMemberships]
  );

  const loadRegistrationInstructions = useCallback(
    async (eventId: number, options: { force?: boolean } = {}) => {
      if (!user) {
        setRegistrationInstructions({});
        return;
      }

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
        const payload = await apiFetch<InstructionSummary[]>(`/api/student/events/${eventId}/instructions`);
        setRegistrationInstructions((previous) => ({
          ...previous,
          [eventId]: {
            loading: false,
            error: null,
            items: payload ?? [],
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
    [user]
  );

  const metrics = useMemo(() => data?.metrics ?? { totalRegistrations: 0, upcomingRegistrations: 0, pendingInstructions: 0 }, [data]);
  const activeClub = useMemo(() => {
    if (!activeClubId) {
      return null;
    }
    return clubMemberships.find((membership) => membership.club?.id === activeClubId) ?? null;
  }, [activeClubId, clubMemberships]);
  const upcoming = useMemo(() => data?.upcomingRegistrations ?? [], [data]);
  const recentInstructions = useMemo(() => data?.recentInstructions ?? [], [data]);
  const recommendations = useMemo(() => data?.recommendedEvents ?? [], [data]);

  useEffect(() => {
    if (upcoming.length === 0) {
      setSelectedRegistrationId(null);
      return;
    }
    setSelectedRegistrationId((previous) => {
      if (previous && upcoming.some((registration) => registration.registrationId === previous)) {
        return previous;
      }
      return upcoming[0].registrationId;
    });
  }, [upcoming]);

  useEffect(() => {
    if (!user || !selectedRegistrationId) {
      return;
    }
    const registration = upcoming.find((item) => item.registrationId === selectedRegistrationId);
    if (!registration) {
      return;
    }
    void loadRegistrationInstructions(registration.event.id);
  }, [selectedRegistrationId, upcoming, loadRegistrationInstructions, user]);

  const activeRegistration = useMemo(() => {
    if (!selectedRegistrationId) {
      return null;
    }
    return upcoming.find((item) => item.registrationId === selectedRegistrationId) ?? null;
  }, [selectedRegistrationId, upcoming]);

  const activeEventId = activeRegistration?.event.id ?? null;
  const activeInstructionState = activeEventId ? registrationInstructions[activeEventId] : undefined;

  const handleRegistrationSelect = useCallback(
    (registrationId: number) => {
      setSelectedRegistrationId(registrationId);
      const registration = upcoming.find((item) => item.registrationId === registrationId);
      if (registration) {
        void loadRegistrationInstructions(registration.event.id);
      }
    },
    [upcoming, loadRegistrationInstructions]
  );

  const handleInstructionsRefresh = useCallback(() => {
    if (!activeEventId) {
      return;
    }
    void loadRegistrationInstructions(activeEventId, { force: true });
  }, [activeEventId, loadRegistrationInstructions]);

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

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-white/10 bg-slate-900/40">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3 text-base text-white">
              <span>Manage registrations</span>
              <Link href="/app/registrations" className="text-xs font-semibold text-sky-300 transition hover:text-sky-200">
                View all →
              </Link>
            </CardTitle>
            <CardDescription>Track RSVPs, review instructions, and jump into the conversation.</CardDescription>
          </CardHeader>
          <CardContent>
            {upcoming.length > 0 ? (
              <UpcomingRegistrations
                items={upcoming}
                activeId={selectedRegistrationId}
                onSelect={handleRegistrationSelect}
              />
            ) : (
              <EmptyState message="You have no upcoming registrations yet." actionLabel="Browse events" actionHref="/app/events" />
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          {activeRegistration ? (
            <RegistrationDetailPanel
              registration={activeRegistration}
              instructionState={activeInstructionState}
              onRefreshInstructions={handleInstructionsRefresh}
            />
          ) : (
            <Card className="border-dashed border-white/15 bg-slate-900/30">
              <CardContent className="flex min-h-[18rem] items-center justify-center text-center text-sm text-slate-400">
                Register for an event to unlock a dedicated instruction feed and chat hub.
              </CardContent>
            </Card>
          )}
          <Card className="border-white/10 bg-slate-900/40">
            <CardHeader>
              <CardTitle className="text-base text-white">Latest instructions</CardTitle>
              <CardDescription>Recent notes from clubs you follow.</CardDescription>
            </CardHeader>
            <CardContent>
              {recentInstructions.length > 0 ? (
                <InstructionList items={recentInstructions} />
              ) : (
                <EmptyState message="No new instructions. Check back closer to your events." />
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-white">Your clubs</h2>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Chat unlocks automatically after an admin approves your join request.
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadClubMemberships().catch(() => undefined)}
            disabled={clubMembershipsLoading || !user}
          >
            {clubMembershipsLoading ? "Loading…" : "Refresh"}
          </Button>
        </div>

        {clubMembershipsError ? (
          <Alert variant="error" title="Unable to load clubs" description={clubMembershipsError} />
        ) : clubMembershipsLoading ? (
          <div className="flex min-h-[24vh] items-center justify-center">
            <Spinner />
          </div>
        ) : clubMemberships.length === 0 ? (
          <Alert
            variant="info"
            title="No active club memberships"
            description="Browse clubs and submit a join request to unlock chat with members."
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <Card className="border-white/10 bg-slate-900/40">
              <CardHeader>
                <CardTitle className="text-base text-white">Active clubs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="flex flex-col gap-3">
                  {clubMemberships.map((membership) => {
                    const clubId = membership.club?.id;
                    if (!clubId) {
                      return null;
                    }
                    const isSelected = activeClubId === clubId;
                    return (
                      <li key={membership.id}>
                        <button
                          type="button"
                          onClick={() => setActiveClubId(clubId)}
                          className={`flex w-full flex-col gap-2 rounded-xl border px-4 py-4 text-left transition focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-950 ${
                            isSelected ? "border-sky-400 bg-sky-400/10" : "border-white/5 hover:border-sky-300/40"
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-white">{membership.club?.name}</span>
                            <Badge variant={membership.role === "OFFICER" ? "info" : "default"}>{membership.role}</Badge>
                          </div>
                          {membership.club?.description ? (
                            <p className="text-xs text-slate-400">{membership.club.description}</p>
                          ) : null}
                          <span className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">
                            Joined {membership.joinedAt ? formatRelative(membership.joinedAt) : "recently"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>

            {activeClub && activeClub.club?.id ? (
              <ChatPanel
                resourceType="club"
                resourceId={activeClub.club.id}
                title={`${activeClub.club.name} chat`}
              />
            ) : (
              <Card className="border-dashed border-white/15 bg-slate-900/30">
                <CardContent className="flex min-h-[18rem] items-center justify-center text-sm text-slate-400">
                  Select a club on the left to open the conversation.
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-white">Join a club</h2>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Browse active clubs and request to join. Campus admins and club officers respond within a few days.
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadAvailableClubs().catch(() => undefined)}
            disabled={availableClubsLoading || !user}
          >
            {availableClubsLoading ? "Loading…" : "Refresh"}
          </Button>
        </div>

        {joinRequestFeedback ? (
          <Alert variant={joinRequestFeedback.variant} description={joinRequestFeedback.message} />
        ) : null}

        {availableClubsError ? (
          <Alert variant="error" title="Unable to load clubs" description={availableClubsError} />
        ) : availableClubsLoading ? (
          <div className="flex min-h-[20vh] items-center justify-center">
            <Spinner />
          </div>
        ) : availableClubs.length === 0 ? (
          <Alert
            variant="info"
            title="No clubs available"
            description="All active clubs you're eligible to join will appear here."
          />
        ) : (
          <Card className="border-white/10 bg-slate-900/40">
            <CardContent className="space-y-4 p-6">
              <ul className="flex flex-col gap-4">
                {availableClubs.map((club) => {
                  const isMember = club.member;
                  const pending = club.pendingRequest;
                  return (
                    <li
                      key={club.id}
                      className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-sm font-semibold text-white">{club.name}</span>
                          {isMember ? (
                            <Badge variant="success">Member</Badge>
                          ) : pending ? (
                            <Badge variant="warning">Pending approval</Badge>
                          ) : null}
                        </div>
                        {club.description ? <p className="text-xs text-slate-400">{club.description}</p> : null}
                      </div>
                      <div className="flex flex-col items-stretch gap-2 sm:w-[200px] sm:items-end">
                        {isMember ? (
                          <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Already joined</span>
                        ) : pending ? (
                          <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Request submitted</span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleJoinClub(club.id)}
                            disabled={joinRequestBusyId === club.id}
                          >
                            {joinRequestBusyId === club.id ? "Submitting…" : "Request to join"}
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        )}
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

function RegistrationDetailPanel({
  registration,
  instructionState,
  onRefreshInstructions,
}: {
  registration: StudentDashboardRegistration;
  instructionState?: RegistrationInstructionState;
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
        <CardDescription>Stay aligned with organizers and fellow attendees.</CardDescription>
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
            <h4 className="text-sm font-semibold text-white">Event instructions</h4>
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
            <h4 className="text-sm font-semibold text-white">Event chat</h4>
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

function UpcomingRegistrations({ items, activeId, onSelect }: { items: StudentDashboardRegistration[]; activeId: number | null; onSelect: (registrationId: number) => void }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const isSelected = activeId === item.registrationId;
        return (
          <li key={item.registrationId}>
            <div
              className={`rounded-2xl border px-4 py-4 transition ${
                isSelected ? "border-sky-400 bg-sky-400/10" : "border-white/5 hover:border-sky-300/40"
              }`}
            >
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(item.registrationId)}
                className="flex w-full flex-col gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-white">{item.event.title}</span>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>{formatDateTime(item.event.eventDate)}</span>
                      <span className="uppercase tracking-[0.2em] text-slate-500">{formatRelative(item.event.eventDate)}</span>
                      <span>{item.event.location}</span>
                    </div>
                  </div>
                  <Badge variant="default">{item.status.replace("_", " ")}</Badge>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <span>{item.event.currentRegistrations ?? 0}/{item.event.capacity} registered</span>
                  <span>Registered {item.registeredAt ? formatRelative(item.registeredAt) : "recently"}</span>
                </div>
              </button>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/app/events/${item.event.id}`}
                  className={buttonClasses({ variant: "secondary", size: "sm", className: "justify-center" })}
                  onClick={() => onSelect(item.registrationId)}
                >
                  View event details
                </Link>
                <Link
                  href="/app/registrations"
                  className={buttonClasses({ variant: "ghost", size: "sm", className: "justify-center text-slate-200" })}
                >
                  Manage all registrations
                </Link>
              </div>
            </div>
          </li>
        );
      })}
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
