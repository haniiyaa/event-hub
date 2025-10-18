"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { ChatPanel } from "@/components/chat/chat-panel";
import { apiFetch } from "@/lib/api-client";
import { formatDateTime, formatRelative } from "@/lib/date";
import type {
  ClubAdminDashboardResponse,
  ClubJoinRequestStatus,
  ClubJoinRequestSummary,
  ClubStatus,
} from "@/lib/types";
import { useSession } from "@/providers/session-provider";

type BannerState = { variant: "success" | "error"; message: string };

export default function ClubDashboardPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [data, setData] = useState<ClubAdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [clubForm, setClubForm] = useState({ name: "", description: "" });
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreatingClub, setIsCreatingClub] = useState(false);
  const [joinRequests, setJoinRequests] = useState<ClubJoinRequestSummary[]>([]);
  const [joinRequestsLoading, setJoinRequestsLoading] = useState(true);
  const [joinRequestsError, setJoinRequestsError] = useState<string | null>(null);
  const [joinRequestFilter, setJoinRequestFilter] = useState<ClubJoinRequestStatus | "ALL">("PENDING");
  const [decisionBusyId, setDecisionBusyId] = useState<number | null>(null);
  const [joinRequestBanner, setJoinRequestBanner] = useState<BannerState | null>(null);

  const loadJoinRequests = useCallback(async (status: ClubJoinRequestStatus | "ALL") => {
    setJoinRequestsLoading(true);
    setJoinRequestsError(null);

    try {
      const options = status === "ALL" ? {} : { searchParams: { status } };
      const payload = await apiFetch<ClubJoinRequestSummary[]>("/api/club-admin/club/join-requests", options);
      setJoinRequests(payload ?? []);
    } catch (err) {
      setJoinRequestsError(err instanceof Error ? err.message : "Unable to load join requests");
      setJoinRequests([]);
    } finally {
      setJoinRequestsLoading(false);
    }
  }, []);

  const loadDashboard = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "initial") {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const payload = await apiFetch<ClubAdminDashboardResponse>("/api/club-admin/dashboard");
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load club dashboard");
    } finally {
      if (mode === "initial") {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "CLUB_ADMIN") {
      router.replace("/app/dashboard");
      return;
    }

    loadDashboard("initial").catch(() => {
      // errors handled in loadDashboard
    });
  }, [router, sessionLoading, user, loadDashboard]);

  useEffect(() => {
    if (!data?.hasClub) {
      setJoinRequests([]);
      setJoinRequestsLoading(false);
      setJoinRequestsError(null);
      return;
    }

    loadJoinRequests(joinRequestFilter).catch(() => {
      // errors handled in loadJoinRequests
    });
  }, [data?.hasClub, joinRequestFilter, loadJoinRequests]);

  const metrics = useMemo(() => data?.metrics ?? { totalEvents: 0, upcomingEvents: 0, totalRegistrations: 0, instructionCount: 0 }, [data]);

  const handleRefresh = () => {
    loadDashboard("refresh").catch(() => {
      // errors handled in loadDashboard
    });
  };

  const handleCreateClub = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!clubForm.name.trim()) {
      setCreateError("Club name is required");
      return;
    }

    setCreateError(null);
    setIsCreatingClub(true);
    try {
      await apiFetch("/api/club-admin/club", {
        method: "POST",
        body: JSON.stringify({
          name: clubForm.name.trim(),
          description: clubForm.description.trim() || undefined,
        }),
      });
      setClubForm({ name: "", description: "" });
      await loadDashboard("initial");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Unable to create club");
    } finally {
      setIsCreatingClub(false);
    }
  };

  const handleJoinRequestFilterChange = (status: ClubJoinRequestStatus | "ALL") => {
    setJoinRequestFilter(status);
  };

  const handleApproveJoinRequest = async (requestId: number) => {
    setDecisionBusyId(requestId);
    setJoinRequestBanner(null);

    try {
      await apiFetch(`/api/club-admin/club/join-requests/${requestId}/approve`, { method: "POST" });
      setJoinRequestBanner({ variant: "success", message: "Join request approved." });
      await loadJoinRequests(joinRequestFilter);
    } catch (err) {
      setJoinRequestBanner({ variant: "error", message: err instanceof Error ? err.message : "Unable to approve request." });
    } finally {
      setDecisionBusyId(null);
    }
  };

  const handleRejectJoinRequest = async (requestId: number) => {
    const note = window.prompt("Optionally add a note for the student (leave blank to skip).", "");
    if (note === null) {
      return;
    }

    setDecisionBusyId(requestId);
    setJoinRequestBanner(null);

    try {
      await apiFetch(`/api/club-admin/club/join-requests/${requestId}/reject`, {
        method: "POST",
        body: note.trim().length > 0 ? JSON.stringify({ message: note.trim() }) : JSON.stringify({}),
      });
      setJoinRequestBanner({ variant: "success", message: "Join request rejected." });
      await loadJoinRequests(joinRequestFilter);
    } catch (err) {
      setJoinRequestBanner({ variant: "error", message: err instanceof Error ? err.message : "Unable to reject request." });
    } finally {
      setDecisionBusyId(null);
    }
  };

  if (sessionLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user || user.role !== "CLUB_ADMIN") {
    return null;
  }

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12 sm:px-10">
        <Alert variant="error" title="Unable to load club insights" description={error} />
        <Button variant="secondary" className="w-fit" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? "Refreshing…" : "Retry"}
        </Button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const clubStatus = (data.club?.status ?? "ACTIVE") as ClubStatus;
  const isActiveClub = clubStatus === "ACTIVE";
  const statusLabels: Record<ClubStatus, string> = {
    ACTIVE: "Active",
    PENDING: "Pending approval",
    RETIRED: "Retired",
  };
  const statusBadgeVariants: Record<ClubStatus, "default" | "success" | "warning" | "info"> = {
    ACTIVE: "success",
    PENDING: "warning",
    RETIRED: "default",
  };
  const statusCallouts: Partial<Record<ClubStatus, { title: string; description: string; variant: "info" | "warning" }>> = {
    PENDING: {
      title: "Awaiting approval",
      description: "Your club is pending review. Event tools unlock automatically once campus admin approves it.",
      variant: "info",
    },
    RETIRED: {
      title: "Club is retired",
      description: "This club is archived. Reach out to campus admin to reactivate it before managing events again.",
      variant: "warning",
    },
  };
  const statusCallout = statusCallouts[clubStatus];

  const joinRequestStatusLabels: Record<ClubJoinRequestStatus, string> = {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
  };

  const joinRequestStatusBadge: Record<ClubJoinRequestStatus, "default" | "success" | "warning" | "info"> = {
    PENDING: "info",
    APPROVED: "success",
    REJECTED: "warning",
    CANCELLED: "default",
  };

  if (!data.hasClub) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12 sm:px-10">
        <Card className="border-white/10 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-xl text-white">Launch your club workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-sm text-slate-300">
            <p>{data.message ?? "Create your club to start publishing events and managing registrations."}</p>
            <form className="space-y-4" onSubmit={handleCreateClub}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="club-name" className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Club name
                </Label>
                <Input
                  id="club-name"
                  placeholder="e.g. Innovation Society"
                  value={clubForm.name}
                  onChange={(event) => setClubForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="club-description" className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Description
                </Label>
                <textarea
                  id="club-description"
                  className="min-h-[120px] rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                  placeholder="Tell students what makes your club special, upcoming goals, or signature events."
                  value={clubForm.description}
                  onChange={(event) => setClubForm((prev) => ({ ...prev, description: event.target.value }))}
                />
              </div>
              {createError ? <Alert variant="error" title="Unable to create club" description={createError} /> : null}
              <div className="flex gap-3">
                <Button type="submit" disabled={isCreatingClub || !clubForm.name.trim()}>
                  {isCreatingClub ? "Creating…" : "Create club"}
                </Button>
                <Button type="button" variant="secondary" onClick={handleRefresh} disabled={refreshing}>
                  {refreshing ? "Refreshing…" : "Refresh data"}
                </Button>
                <Link
                  href="/app/events"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40"
                >
                  Explore student view
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const upcomingEvents = data.upcomingEvents ?? [];
  const recentRegistrations = data.recentRegistrations ?? [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 sm:px-10">
      <section className="space-y-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold text-white">{data.club?.name ?? "Club dashboard"}</h1>
              <Badge variant={statusBadgeVariants[clubStatus]}>{statusLabels[clubStatus]}</Badge>
            </div>
            <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Admin view</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? "Refreshing…" : "Refresh"}
            </Button>
            {isActiveClub ? (
              <Link
                href="/app/club/events"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40"
              >
                Manage events
              </Link>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                disabled
                title="Event tools unlock once the club is active"
              >
                Manage events
              </Button>
            )}
          </div>
        </div>
        {data.club?.description ? <p className="text-sm text-slate-300">{data.club.description}</p> : null}
        {statusCallout ? (
          <Alert variant={statusCallout.variant} title={statusCallout.title} description={statusCallout.description} />
        ) : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-4">
        <MetricCard title="Total events" value={metrics.totalEvents} tone="sky" />
        <MetricCard title="Upcoming" value={metrics.upcomingEvents} tone="emerald" />
        <MetricCard title="Registrations" value={metrics.totalRegistrations} tone="violet" />
        <MetricCard title="Instructions" value={metrics.instructionCount} tone="amber" />
      </section>

          {data.club?.id ? (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-white">Join requests</h2>
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Review who wants to join {data.club?.name}.</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="rounded-full border border-white/15 bg-slate-950/60 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                    value={joinRequestFilter}
                    onChange={(event) => handleJoinRequestFilterChange(event.target.value as ClubJoinRequestStatus | "ALL")}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="ALL">All statuses</option>
                  </select>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => loadJoinRequests(joinRequestFilter).catch(() => undefined)}
                    disabled={joinRequestsLoading}
                  >
                    {joinRequestsLoading ? "Refreshing…" : "Refresh"}
                  </Button>
                </div>
              </div>

              {joinRequestBanner ? (
                <Alert
                  variant={joinRequestBanner.variant}
                  title={joinRequestBanner.variant === "success" ? "Success" : "Notice"}
                  description={joinRequestBanner.message}
                />
              ) : null}

              <Card className="border-white/10 bg-slate-900/40">
                <CardContent className="space-y-4">
                  {joinRequestsError ? (
                    <Alert variant="error" title="Unable to load join requests" description={joinRequestsError} />
                  ) : joinRequestsLoading ? (
                    <div className="flex min-h-[16rem] items-center justify-center">
                      <Spinner />
                    </div>
                  ) : joinRequests.length === 0 ? (
                    <Alert
                      variant="info"
                      title="No requests"
                      description={joinRequestFilter === "PENDING" ? "You have no pending requests right now." : "No requests match the selected filter."}
                    />
                  ) : (
                    <ul className="space-y-4">
                      {joinRequests.map((request) => (
                        <li key={request.id} className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-white">
                                  {request.requester?.fullName || request.requester?.username || "Unknown student"}
                                </span>
                                <Badge variant={joinRequestStatusBadge[request.status]}>{joinRequestStatusLabels[request.status]}</Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                                {request.requester?.email ? <span>{request.requester.email}</span> : null}
                                {request.createdAt ? (
                                  <span className="uppercase tracking-[0.25em] text-slate-500">
                                    Requested {formatRelative(request.createdAt)}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            {request.status !== "PENDING" && request.reviewedAt ? (
                              <span className="text-[11px] uppercase tracking-[0.3em] text-slate-500">
                                Reviewed {formatRelative(request.reviewedAt)}
                              </span>
                            ) : null}
                          </div>

                          {request.message ? (
                            <div className="space-y-1">
                              <span className="text-[11px] uppercase tracking-[0.3em] text-slate-500">
                                {request.status === "PENDING"
                                  ? "Student message"
                                  : request.status === "CANCELLED"
                                    ? "Student note"
                                    : "Admin note"}
                              </span>
                              <p className="text-sm text-slate-300">{request.message}</p>
                            </div>
                          ) : null}

                          {request.status !== "PENDING" && request.reviewer ? (
                            <p className="text-xs text-slate-400">
                              Decision by {request.reviewer.fullName || request.reviewer.username || "Club admin"}
                            </p>
                          ) : null}

                          {request.status === "PENDING" ? (
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApproveJoinRequest(request.id)}
                                disabled={decisionBusyId === request.id}
                              >
                                {decisionBusyId === request.id ? "Processing…" : "Approve"}
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleRejectJoinRequest(request.id)}
                                disabled={decisionBusyId === request.id}
                              >
                                {decisionBusyId === request.id ? "Processing…" : "Reject"}
                              </Button>
                            </div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </section>
          ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-white/10 bg-slate-900/40">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3 text-base text-white">
              <span>Upcoming events</span>
              <Link href="/app/events" className="text-xs font-semibold text-sky-300 transition hover:text-sky-200">
                View catalog →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length > 0 ? (
              <ul className="flex flex-col divide-y divide-white/5">
                {upcomingEvents.map((event) => (
                  <li key={event.id} className="space-y-2 py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3">
                      <Link href={`/app/events/${event.id}`} className="text-sm font-semibold text-white transition hover:text-sky-200">
                        {event.title}
                      </Link>
                      <Badge variant="default">{formatRelative(event.eventDate)}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>{formatDateTime(event.eventDate)}</span>
                      <span className="uppercase tracking-[0.2em] text-slate-500">{event.location}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{event.currentRegistrations ?? 0}/{event.capacity} registered</span>
                      <span>{event.club?.name}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState message="No upcoming events scheduled. Start planning your next experience." actionLabel="Create event" actionHref="/app/events" />
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-900/40">
          <CardHeader>
            <CardTitle className="text-base text-white">Recent registrations</CardTitle>
          </CardHeader>
          <CardContent>
            {recentRegistrations.length > 0 ? (
              <ul className="flex flex-col divide-y divide-white/5">
                {recentRegistrations.map((registration) => (
                  <li key={registration.registrationId} className="space-y-2 py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm text-white">
                        <span className="font-semibold">{registration.attendee?.fullName ?? registration.attendee?.username}</span>
                        <span className="ml-2 text-xs uppercase tracking-[0.2em] text-slate-500">{registration.attendee?.email}</span>
                      </div>
                      <Badge variant="info">{registration.status.replace("_", " ")}</Badge>
                    </div>
                    <div className="text-xs text-slate-400">
                      Registered {registration.registeredAt ? formatRelative(registration.registeredAt) : "recently"}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <Link href={`/app/events/${registration.event.id}`} className="font-semibold text-sky-200 transition hover:text-sky-100">
                        {registration.event.title}
                      </Link>
                      <span>{formatDateTime(registration.event.eventDate)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState message="No new registrations yet. Share your event link to start filling seats." />
            )}
          </CardContent>
        </Card>
      </section>

      {data.club?.id ? (
        <ChatPanel
          resourceType="club"
          resourceId={Number(data.club.id)}
          title="Club chat"
          disabledReason={isActiveClub ? undefined : "Club chat unlocks once your club is active."}
        />
      ) : null}
    </div>
  );
}

function MetricCard({ title, value, tone }: { title: string; value: number; tone: "sky" | "emerald" | "violet" | "amber" }) {
  const palette = {
    sky: "from-sky-400/10 via-sky-500/5 to-transparent text-sky-200",
    emerald: "from-emerald-400/10 via-emerald-500/5 to-transparent text-emerald-200",
    violet: "from-violet-400/10 via-violet-500/5 to-transparent text-violet-200",
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
