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
import { apiFetch } from "@/lib/api-client";
import { formatDateTime, formatRelative } from "@/lib/date";
import type { ClubAdminDashboardResponse, ClubAdminRegistration, ClubStatus, EventSummary } from "@/lib/types";
import { useSession } from "@/providers/session-provider";

interface BannerState {
  variant: "success" | "error";
  message: string;
}

const INITIAL_FORM = {
  title: "",
  description: "",
  eventDate: "",
  location: "",
  capacity: "",
};

export default function ClubEventsPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [pageBanner, setPageBanner] = useState<BannerState | null>(null);
  const [dashboard, setDashboard] = useState<ClubAdminDashboardResponse | null>(null);
  const [clubLoading, setClubLoading] = useState(true);
  const [clubError, setClubError] = useState<string | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [registrations, setRegistrations] = useState<Record<number, {
    loading: boolean;
    data: ClubAdminRegistration[] | null;
    error: string | null;
    open: boolean;
  }>>({});
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(INITIAL_FORM);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editBanner, setEditBanner] = useState<BannerState | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<number | null>(null);

  const loadEvents = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "initial") {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);
    try {
      const data = await apiFetch<EventSummary[]>("/api/club-admin/events");
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load events");
    } finally {
      if (mode === "initial") {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }, []);

  const loadClubContext = useCallback(async () => {
    setClubLoading(true);
    setClubError(null);

    try {
      const payload = await apiFetch<ClubAdminDashboardResponse>("/api/club-admin/dashboard");
      setDashboard(payload);

      if (!payload.hasClub) {
        router.replace("/app/club/dashboard");
      }
    } catch (err) {
      setClubError(err instanceof Error ? err.message : "Unable to load club status");
    } finally {
      setClubLoading(false);
    }
  }, [router]);

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

    loadClubContext().catch(() => {
      // handled in loadClubContext
    });
  }, [loadClubContext, router, sessionLoading, user]);

  useEffect(() => {
    if (dashboard?.hasClub) {
      loadEvents("initial").catch(() => {
        // errors handled inside loadEvents
      });
    }
  }, [dashboard?.hasClub, loadEvents]);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  }, [events]);

  const clubStatus = (dashboard?.club?.status ?? "ACTIVE") as ClubStatus;
  const canManageEvents = clubStatus === "ACTIVE";
  const statusCallouts: Partial<Record<ClubStatus, { variant: "info" | "warning"; title: string; description: string }>> = {
    PENDING: {
      variant: "info",
      title: "Awaiting approval",
      description: "Event creation is locked until campus admin approves your club.",
    },
    RETIRED: {
      variant: "warning",
      title: "Club is retired",
      description: "This club is archived. Contact campus admin to reactivate it before modifying events.",
    },
  };
  const statusCallout = statusCallouts[clubStatus];
  const statusLabels: Record<ClubStatus, string> = {
    ACTIVE: "Active",
    PENDING: "Pending approval",
    RETIRED: "Retired",
  };
  const statusBadgeVariant: Record<ClubStatus, "success" | "info" | "warning" | "default"> = {
    ACTIVE: "success",
    PENDING: "info",
    RETIRED: "warning",
  };

  const normalizeEventDate = (value: string) => {
    if (!value) {
      return "";
    }
    if (value.length === 16) {
      return `${value}:00`;
    }
    return value;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.location.trim() || !form.eventDate) {
      setBanner({ variant: "error", message: "All fields are required." });
      return;
    }

    if (!canManageEvents) {
      return;
    }

    const capacityValue = Number.parseInt(form.capacity, 10);
    if (Number.isNaN(capacityValue) || capacityValue <= 0) {
      setBanner({ variant: "error", message: "Capacity must be a positive number." });
      return;
    }

    setSubmitting(true);
    setBanner(null);

    try {
      await apiFetch("/api/club-admin/events", {
        method: "POST",
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          location: form.location.trim(),
          capacity: capacityValue,
          eventDate: normalizeEventDate(form.eventDate),
        }),
      });

      const success = { variant: "success", message: "Event created successfully." } as BannerState;
      setForm(INITIAL_FORM);
      setBanner(success);
      setPageBanner(success);
      await loadEvents("refresh");
    } catch (err) {
      setBanner({ variant: "error", message: err instanceof Error ? err.message : "Unable to create event." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = () => {
    loadEvents("refresh").catch(() => {
      // errors handled inside loadEvents
    });
  };

  const toggleRegistrations = async (eventId: number) => {
    let shouldFetch = false;

    setRegistrations((prev) => {
      const current = prev[eventId] ?? { loading: false, data: null, error: null, open: false };
      const open = !current.open;
      const next = { ...prev };
      next[eventId] = { ...current, open };

      if (open && !current.data && !current.loading) {
        shouldFetch = true;
        next[eventId] = { ...next[eventId], loading: true, error: null };
      }

      return next;
    });

    if (!shouldFetch) {
      return;
    }

    try {
      const data = await apiFetch<ClubAdminRegistration[]>(`/api/club-admin/events/${eventId}/registrations`);
      setRegistrations((prev) => {
        const current = prev[eventId] ?? { loading: false, data: null, error: null, open: true };
        return {
          ...prev,
          [eventId]: { loading: false, data, error: null, open: current.open },
        };
      });
    } catch (err) {
      setRegistrations((prev) => {
        const current = prev[eventId] ?? { loading: false, data: null, error: null, open: true };
        return {
          ...prev,
          [eventId]: {
            loading: false,
            data: null,
            error: err instanceof Error ? err.message : "Unable to load registrations",
            open: current.open,
          },
        };
      });
    }
  };

  const handleFormChange = (key: keyof typeof INITIAL_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const formatForInput = (iso: string) => {
    if (!iso) return "";
    const date = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const openEdit = (event: EventSummary) => {
    if (!canManageEvents) {
      return;
    }
    setEditingEventId(event.id);
    setEditForm({
      title: event.title,
      description: event.description,
      eventDate: formatForInput(event.eventDate),
      location: event.location,
      capacity: String(event.capacity),
    });
    setEditBanner(null);
  };

  const handleEditChange = (key: keyof typeof INITIAL_FORM, value: string) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const cancelEdit = () => {
    setEditingEventId(null);
    setEditForm(INITIAL_FORM);
    setEditBanner(null);
  };

  const submitEdit = async (eventId: number) => {
    if (!editForm.title.trim() || !editForm.description.trim() || !editForm.location.trim() || !editForm.eventDate) {
      setEditBanner({ variant: "error", message: "All fields are required." });
      return;
    }

    const capacityValue = Number.parseInt(editForm.capacity, 10);
    if (Number.isNaN(capacityValue) || capacityValue <= 0) {
      setEditBanner({ variant: "error", message: "Capacity must be a positive number." });
      return;
    }

    if (!canManageEvents) {
      return;
    }

    setEditSubmitting(true);
    setEditBanner(null);
    try {
      await apiFetch(`/api/club-admin/events/${eventId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          location: editForm.location.trim(),
          capacity: capacityValue,
          eventDate: normalizeEventDate(editForm.eventDate),
        }),
      });

      const success = { variant: "success", message: "Event updated successfully." } as BannerState;
      setEditBanner(success);
      setPageBanner(success);
      await loadEvents("refresh");
      cancelEdit();
    } catch (err) {
      setEditBanner({ variant: "error", message: err instanceof Error ? err.message : "Unable to update event." });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (eventId: number, title: string) => {
    if (!canManageEvents) {
      return;
    }
    const confirmed = window.confirm(`Delete “${title}”? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setDeletingEventId(eventId);
    setPageBanner(null);

    try {
      await apiFetch(`/api/club-admin/events/${eventId}`, {
        method: "DELETE",
      });
      setPageBanner({ variant: "success", message: "Event deleted." });
      await loadEvents("refresh");
      setRegistrations((prev) => {
        const next = { ...prev };
        delete next[eventId];
        return next;
      });
      if (editingEventId === eventId) {
        cancelEdit();
      }
    } catch (err) {
      setPageBanner({ variant: "error", message: err instanceof Error ? err.message : "Unable to delete event." });
    } finally {
      setDeletingEventId(null);
    }
  };

  if (sessionLoading || clubLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user || user.role !== "CLUB_ADMIN") {
    return null;
  }

  if (clubError) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col justify-center gap-4 px-6">
        <Alert variant="error" title="Unable to load club details" description={clubError} />
        <Button type="button" onClick={() => loadClubContext().catch(() => undefined)}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 sm:px-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold text-white">Manage club events</h1>
            <Badge variant={statusBadgeVariant[clubStatus]}>{statusLabels[clubStatus]}</Badge>
          </div>
          <p className="text-sm text-slate-300">Create new programming and review upcoming experiences.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? "Refreshing…" : "Refresh"}
        </Button>
      </header>

      {pageBanner ? (
        <Alert
          variant={pageBanner.variant}
          title={pageBanner.variant === "success" ? "Success" : "Notice"}
          description={pageBanner.message}
        />
      ) : null}

      {statusCallout ? (
        <Alert variant={statusCallout.variant} title={statusCallout.title} description={statusCallout.description} />
      ) : null}

      <Card className="border-white/10 bg-slate-900/40">
        <CardHeader>
          <CardTitle className="text-base text-white">Create a new event</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <fieldset
              disabled={!canManageEvents || submitting}
              className={`grid gap-4 md:grid-cols-2 ${!canManageEvents ? "pointer-events-none opacity-60" : ""}`}
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(event) => handleFormChange("title", event.target.value)}
                  placeholder="e.g. Welcome Week Mixer"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(event) => handleFormChange("location", event.target.value)}
                  placeholder="Student Center Atrium"
                  required
                />
              </div>
              <div className="md:col-span-2 flex flex-col gap-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="min-h-[140px] rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                  placeholder="Share the vibe, highlights, or key details attendees should know."
                  value={form.description}
                  onChange={(event) => handleFormChange("description", event.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="eventDate">Date & time</Label>
                <Input
                  id="eventDate"
                  type="datetime-local"
                  value={form.eventDate}
                  onChange={(event) => handleFormChange("eventDate", event.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(event) => handleFormChange("capacity", event.target.value)}
                  placeholder="50"
                  required
                />
              </div>
              <div className="md:col-span-2 flex items-center gap-3">
                <Button type="submit">
                  {submitting ? "Creating…" : "Create event"}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setForm(INITIAL_FORM)}>
                  Clear
                </Button>
              </div>
            </fieldset>
            {banner ? (
              <Alert
                variant={banner.variant}
                title={banner.variant === "success" ? "Success" : "Something went wrong"}
                description={banner.message}
              />
            ) : null}
          </form>
        </CardContent>
      </Card>

      {error ? <Alert variant="error" title="Unable to load events" description={error} /> : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
          <span>
            {sortedEvents.length === 0
              ? "No events scheduled yet"
              : `Showing ${sortedEvents.length} ${sortedEvents.length === 1 ? "event" : "events"}`}
          </span>
          <span>{refreshing ? "Refreshing…" : ""}</span>
        </div>

        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Spinner />
          </div>
        ) : sortedEvents.length === 0 ? (
          <Card className="border-dashed border-white/10 bg-slate-900/40">
            <CardContent className="space-y-3 py-10 text-center text-sm text-slate-300">
              <p>Your club has not scheduled any events yet.</p>
              <p>Create one above to start engaging students.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {sortedEvents.map((event) => {
              const spotsRemaining = Math.max(event.capacity - (event.currentRegistrations ?? 0), 0);
              const isFull = spotsRemaining === 0;
              const registrationsState = registrations[event.id] ?? { loading: false, data: null, error: null, open: false };
              const isEditing = editingEventId === event.id;

              return (
                <Card key={event.id} className="border-white/10 bg-slate-900/40">
                  <CardHeader className="space-y-2">
                    <CardTitle className="flex items-center justify-between gap-3 text-base text-white">
                      <span>{event.title}</span>
                      <Badge variant={isFull ? "warning" : "info"}>
                        {isFull ? "Event full" : `${spotsRemaining} spots left`}
                      </Badge>
                    </CardTitle>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{formatRelative(event.eventDate)}</p>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-slate-300">
                    <p>{event.description}</p>
                    <div className="space-y-2 text-xs text-slate-400">
                      <div>
                        <span className="font-semibold text-slate-200">When:</span> {formatDateTime(event.eventDate)}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-200">Where:</span> {event.location}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-200">Registrations:</span> {event.currentRegistrations ?? 0}/{event.capacity}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/app/events/${event.id}`}
                        className="inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40"
                      >
                        View student page
                      </Link>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => void toggleRegistrations(event.id)}
                      >
                        {registrationsState.open ? "Hide registrations" : "View registrations"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => (isEditing ? cancelEdit() : openEdit(event))}
                        disabled={!canManageEvents || deletingEventId === event.id}
                      >
                        {isEditing ? "Cancel edit" : "Edit"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-300 hover:text-red-200"
                        onClick={() => void handleDelete(event.id, event.title)}
                        disabled={!canManageEvents || deletingEventId === event.id}
                      >
                        {deletingEventId === event.id ? "Deleting…" : "Delete"}
                      </Button>
                    </div>
                    {isEditing ? (
                      <div className="space-y-4 rounded-2xl border border-white/15 bg-slate-950/60 p-4">
                        <fieldset
                          disabled={!canManageEvents || editSubmitting}
                          className={`space-y-4 ${!canManageEvents ? "pointer-events-none opacity-60" : ""}`}
                        >
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="flex flex-col gap-2">
                              <Label htmlFor={`edit-title-${event.id}`}>Title</Label>
                              <Input
                                id={`edit-title-${event.id}`}
                                value={editForm.title}
                                onChange={(e) => handleEditChange("title", e.target.value)}
                                required
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <Label htmlFor={`edit-location-${event.id}`}>Location</Label>
                              <Input
                                id={`edit-location-${event.id}`}
                                value={editForm.location}
                                onChange={(e) => handleEditChange("location", e.target.value)}
                                required
                              />
                            </div>
                            <div className="md:col-span-2 flex flex-col gap-2">
                              <Label htmlFor={`edit-description-${event.id}`}>Description</Label>
                              <textarea
                                id={`edit-description-${event.id}`}
                                className="min-h-[120px] rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                                value={editForm.description}
                                onChange={(e) => handleEditChange("description", e.target.value)}
                                required
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <Label htmlFor={`edit-eventDate-${event.id}`}>Date & time</Label>
                              <Input
                                id={`edit-eventDate-${event.id}`}
                                type="datetime-local"
                                value={editForm.eventDate}
                                onChange={(e) => handleEditChange("eventDate", e.target.value)}
                                required
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <Label htmlFor={`edit-capacity-${event.id}`}>Capacity</Label>
                              <Input
                                id={`edit-capacity-${event.id}`}
                                type="number"
                                min={1}
                                value={editForm.capacity}
                                onChange={(e) => handleEditChange("capacity", e.target.value)}
                                required
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button type="button" onClick={() => void submitEdit(event.id)}>
                              {editSubmitting ? "Saving…" : "Save changes"}
                            </Button>
                            <Button type="button" variant="secondary" onClick={cancelEdit}>
                              Cancel
                            </Button>
                          </div>
                        </fieldset>
                        {editBanner ? (
                          <Alert
                            variant={editBanner.variant}
                            title={editBanner.variant === "success" ? "Success" : "Something went wrong"}
                            description={editBanner.message}
                          />
                        ) : null}
                      </div>
                    ) : null}
                    {registrationsState.open ? (
                      <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs text-slate-300">
                        {registrationsState.loading ? (
                          <div className="flex items-center gap-2 text-slate-400">
                            <Spinner />
                            <span>Loading registrations…</span>
                          </div>
                        ) : registrationsState.error ? (
                          <Alert variant="error" title="Unable to load registrations" description={registrationsState.error} />
                        ) : registrationsState.data && registrationsState.data.length > 0 ? (
                          <div className="space-y-3">
                            <div className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
                              {registrationsState.data.length} attendee{registrationsState.data.length === 1 ? "" : "s"}
                            </div>
                            <ul className="divide-y divide-white/10">
                              {registrationsState.data.map((registration) => (
                                <li key={registration.registrationId} className="flex flex-col gap-1 py-2">
                                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-white">
                                    <span>{registration.attendee?.fullName ?? registration.attendee?.username}</span>
                                    <Badge variant="info">{registration.status.replace("_", " ")}</Badge>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                                    <span>{registration.attendee?.email}</span>
                                    <span>
                                      {registration.registeredAt ? `Registered ${formatRelative(registration.registeredAt)}` : "Timing unknown"}
                                    </span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/50 p-3 text-center text-[13px] text-slate-400">
                            No registrations yet. Share your event to fill the roster.
                          </div>
                        )}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
