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
  ClubAdminRegistration,
  ClubStatus,
  EventSummary,
  InstructionSummary,
} from "@/lib/types";
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

interface InstructionFormState {
  title: string;
  content: string;
  isImportant: boolean;
}

const INITIAL_INSTRUCTION_FORM: InstructionFormState = {
  title: "",
  content: "",
  isImportant: false,
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
  const match = DATE_TIME_INPUT_REGEX.exec(normalized);
  if (!match) {
    const dateOnlyMatch = DATE_ONLY_INPUT_REGEX.exec(normalized);
    if (!dateOnlyMatch) {
      return null;
    }
    const [, year, month, day] = dateOnlyMatch;
    return `${year}-${month}-${day}T00:00:00`;
  }
  const [, year, month, day, hour, minute, second, fraction] = match;
  const safeSecond = second ?? "00";
  const normalizedSeconds = fraction ? `${safeSecond}.${fraction}` : safeSecond;
  return `${year}-${month}-${day}T${hour}:${minute}:${normalizedSeconds}`;
}

function splitDateTimeParts(value: string): { date: string; time: string } {
  const normalized = normalizeEventDate(value);
  if (!normalized) {
    return { date: "", time: "" };
  }
  const [datePart, rawTimePart] = normalized.split("T");
  const timePart = rawTimePart ? rawTimePart.slice(0, 5) : "";
  return { date: datePart ?? "", time: timePart ?? "" };
}

function combineDateTimeParts(date: string, time: string): string {
  if (!date || !time) {
    return "";
  }
  return `${date}T${time}`;
}

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
  const [activeEventId, setActiveEventId] = useState<number | null>(null);
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
  const [instructions, setInstructions] = useState<InstructionSummary[]>([]);
  const [instructionsLoading, setInstructionsLoading] = useState(false);
  const [instructionsError, setInstructionsError] = useState<string | null>(null);
  const [instructionForm, setInstructionForm] = useState<InstructionFormState>(INITIAL_INSTRUCTION_FORM);
  const [createDateError, setCreateDateError] = useState<string | null>(null);
  const [createDatePart, setCreateDatePart] = useState("");
  const [createTimePart, setCreateTimePart] = useState("");
  const [editDatePart, setEditDatePart] = useState("");
  const [editTimePart, setEditTimePart] = useState("");
  const parseEventTimestamp = useCallback((value: string) => {
    if (!value) {
      return null;
    }
    const normalized = normalizeEventDate(value) ?? value.trim().replace(" ", "T");
    const primary = Date.parse(normalized);
    if (!Number.isNaN(primary)) {
      return primary;
    }
    if (!normalized.endsWith("Z")) {
      const withZ = `${normalized}Z`;
      const secondary = Date.parse(withZ);
      if (!Number.isNaN(secondary)) {
        return secondary;
      }
    }
    return null;
  }, []);
  const [instructionSubmitting, setInstructionSubmitting] = useState(false);
  const [instructionBanner, setInstructionBanner] = useState<BannerState | null>(null);
  const [removingRegistrationId, setRemovingRegistrationId] = useState<number | null>(null);

  const loadEvents = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "initial") {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);
    try {
      const data = await apiFetch<EventSummary[] | null | undefined>("/api/club-admin/events");
      setEvents(Array.isArray(data) ? data : []);
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
    return [...events].sort((a, b) => {
      const aTime = parseEventTimestamp(a.eventDate) ?? 0;
      const bTime = parseEventTimestamp(b.eventDate) ?? 0;
      return aTime - bTime;
    });
  }, [events, parseEventTimestamp]);

  const ongoingEvents = useMemo(() => {
    const now = Date.now();
    return sortedEvents.filter((event) => {
      const timestamp = parseEventTimestamp(event.eventDate);
      if (timestamp === null) {
        return true;
      }
      return timestamp >= now;
    });
  }, [parseEventTimestamp, sortedEvents]);

  const pastEvents = useMemo(() => {
    const now = Date.now();
    return sortedEvents.filter((event) => {
      const timestamp = parseEventTimestamp(event.eventDate);
      if (timestamp === null) {
        return false;
      }
      return timestamp < now;
    });
  }, [parseEventTimestamp, sortedEvents]);

  useEffect(() => {
    if (sortedEvents.length === 0) {
      setActiveEventId(null);
      return;
    }

    setActiveEventId((current) => {
      if (current && sortedEvents.some((event) => event.id === current)) {
        return current;
      }
      const priorityList = ongoingEvents.length > 0 ? ongoingEvents : sortedEvents;
      return priorityList[0]?.id ?? null;
    });
  }, [ongoingEvents, sortedEvents]);

  const fetchInstructions = useCallback(async (eventId: number) => {
    const payload = await apiFetch<InstructionSummary[]>(`/api/club-admin/events/${eventId}/instructions`);
    return payload ?? [];
  }, []);

  useEffect(() => {
    if (!activeEventId) {
      setInstructions([]);
      setInstructionsError(null);
      setInstructionForm(INITIAL_INSTRUCTION_FORM);
      setInstructionBanner(null);
      return;
    }

    let cancelled = false;
    setInstructionsLoading(true);
    setInstructionsError(null);
    setInstructionForm(INITIAL_INSTRUCTION_FORM);
    setInstructionBanner(null);

    fetchInstructions(activeEventId)
      .then((items) => {
        if (!cancelled) {
          setInstructions(items);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setInstructionsError(err instanceof Error ? err.message : "Unable to load instructions");
          setInstructions([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setInstructionsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeEventId, fetchInstructions]);

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

  const handleInstructionsRefresh = useCallback(async () => {
    if (!activeEventId) {
      return;
    }
    setInstructionBanner(null);
    setInstructionsLoading(true);
    setInstructionsError(null);
    try {
      const items = await fetchInstructions(activeEventId);
      setInstructions(items);
    } catch (err) {
      setInstructionsError(err instanceof Error ? err.message : "Unable to load instructions");
      setInstructions([]);
    } finally {
      setInstructionsLoading(false);
    }
  }, [activeEventId, fetchInstructions]);

  const handleInstructionInputChange = useCallback(<K extends keyof InstructionFormState>(key: K, value: InstructionFormState[K]) => {
    setInstructionForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleInstructionSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!activeEventId) {
        setInstructionBanner({ variant: "error", message: "Select an event to share instructions." });
        return;
      }
      if (!instructionForm.title.trim() || !instructionForm.content.trim()) {
        setInstructionBanner({ variant: "error", message: "Title and details are required." });
        return;
      }
      if (!canManageEvents) {
        setInstructionBanner({ variant: "error", message: "Your club must be active before sending instructions." });
        return;
      }

      setInstructionSubmitting(true);
      setInstructionBanner(null);
      setInstructionsError(null);
      try {
        await apiFetch(`/api/club-admin/events/${activeEventId}/instructions`, {
          method: "POST",
          body: JSON.stringify({
            title: instructionForm.title.trim(),
            content: instructionForm.content.trim(),
            isImportant: instructionForm.isImportant,
          }),
        });

        setInstructionBanner({ variant: "success", message: "Instruction shared with attendees." });
        setInstructionForm(INITIAL_INSTRUCTION_FORM);
        const items = await fetchInstructions(activeEventId);
        setInstructions(items);
      } catch (err) {
        setInstructionBanner({ variant: "error", message: err instanceof Error ? err.message : "Unable to send instruction." });
      } finally {
        setInstructionSubmitting(false);
      }
    },
    [activeEventId, canManageEvents, fetchInstructions, instructionForm.content, instructionForm.isImportant, instructionForm.title]
  );

  const handleRemoveRegistration = useCallback(async (eventId: number, registrationId: number, attendeeName: string | undefined) => {
    if (!canManageEvents) {
      return;
    }

    const label = attendeeName?.trim() || "this attendee";
    const confirmed = window.confirm(`Remove ${label} from the event?`);
    if (!confirmed) {
      return;
    }

    setRemovingRegistrationId(registrationId);
    setPageBanner(null);

    try {
      await apiFetch(`/api/club-admin/events/${eventId}/registrations/${registrationId}`, {
        method: "DELETE",
      });

      setRegistrations((prev) => {
        const current = prev[eventId];
        if (!current?.data) {
          return prev;
        }
        return {
          ...prev,
          [eventId]: {
            ...current,
            data: current.data.filter((registration) => registration.registrationId !== registrationId),
          },
        };
      });

      await loadEvents("refresh");
      setPageBanner({ variant: "success", message: "Registration removed." });
    } catch (err) {
      setPageBanner({ variant: "error", message: err instanceof Error ? err.message : "Unable to remove registration." });
    } finally {
      setRemovingRegistrationId(null);
    }
  }, [canManageEvents, loadEvents]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManageEvents) {
      return;
    }

    const title = form.title.trim();
    const description = form.description.trim();
    const location = form.location.trim();
    const combinedDate = combineDateTimeParts(createDatePart, createTimePart);
    const hasDate = Boolean(createDatePart);
    const hasTime = Boolean(createTimePart);

    if (!title || !description || !location) {
      setBanner({ variant: "error", message: "All fields are required." });
      return;
    }

    if (!hasDate) {
      setCreateDateError("Pick a date before creating your event.");
      setBanner({ variant: "error", message: "Select a date for your event." });
      return;
    }

    if (!hasTime) {
      setCreateDateError("Pick a start time before creating your event.");
      setBanner({ variant: "error", message: "Select a time for your event." });
      return;
    }

    if (!combinedDate) {
      setCreateDateError("Pick a date and time before creating your event.");
      setBanner({ variant: "error", message: "Select a date and time for your event." });
      return;
    }

    const capacityValue = Number.parseInt(form.capacity, 10);
    if (Number.isNaN(capacityValue) || capacityValue <= 0) {
      setBanner({ variant: "error", message: "Capacity must be a positive number." });
      return;
    }

    const normalizedDate = normalizeEventDate(combinedDate);
    if (!normalizedDate) {
      setCreateDateError("Enter a valid date using the calendar or format YYYY-MM-DD HH:mm.");
      setBanner({ variant: "error", message: "Enter a valid date and time (YYYY-MM-DD HH:mm)." });
      return;
    }

    setSubmitting(true);
    setBanner(null);

    try {
      await apiFetch("/api/club-admin/events", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          location,
          capacity: capacityValue,
          eventDate: normalizedDate,
        }),
      });

      const success = { variant: "success", message: "Event created successfully." } as BannerState;
      setForm(INITIAL_FORM);
      setCreateDateError(null);
    setCreateDatePart("");
    setCreateTimePart("");
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

  const handleCreateDatePartChange = (value: string) => {
    setCreateDatePart(value);
    setCreateDateError(null);
    setForm((prev) => ({ ...prev, eventDate: combineDateTimeParts(value, createTimePart) }));
  };

  const handleCreateTimePartChange = (value: string) => {
    setCreateTimePart(value);
    setCreateDateError(null);
    setForm((prev) => ({ ...prev, eventDate: combineDateTimeParts(createDatePart, value) }));
  };

  const handleEditDatePartChange = (value: string) => {
    setEditDatePart(value);
    setEditBanner(null);
    setEditForm((prev) => ({ ...prev, eventDate: combineDateTimeParts(value, editTimePart) }));
  };

  const handleEditTimePartChange = (value: string) => {
    setEditTimePart(value);
    setEditBanner(null);
    setEditForm((prev) => ({ ...prev, eventDate: combineDateTimeParts(editDatePart, value) }));
  };

  const openEdit = (event: EventSummary) => {
    if (!canManageEvents) {
      return;
    }
    setEditingEventId(event.id);
    const { date, time } = splitDateTimeParts(event.eventDate);
    setEditDatePart(date);
    setEditTimePart(time);
    setEditForm({
      title: event.title,
      description: event.description,
      eventDate: combineDateTimeParts(date, time),
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
    setEditDatePart("");
    setEditTimePart("");
  };

  const submitEdit = async (eventId: number) => {
    const title = editForm.title.trim();
    const description = editForm.description.trim();
    const location = editForm.location.trim();
    const combinedDate = combineDateTimeParts(editDatePart, editTimePart);

    if (!title || !description || !location) {
      setEditBanner({ variant: "error", message: "All fields are required." });
      return;
    }

    const capacityValue = Number.parseInt(editForm.capacity, 10);
    if (Number.isNaN(capacityValue) || capacityValue <= 0) {
      setEditBanner({ variant: "error", message: "Capacity must be a positive number." });
      return;
    }

    if (!editDatePart || !editTimePart) {
      setEditBanner({ variant: "error", message: "Select a date and time before saving." });
      return;
    }

    const normalizedDate = normalizeEventDate(combinedDate);
    if (!normalizedDate) {
      setEditBanner({ variant: "error", message: "Enter a valid date and time (YYYY-MM-DD HH:mm)." });
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
          title,
          description,
          location,
          capacity: capacityValue,
          eventDate: normalizedDate,
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

  const renderEventCard = (event: EventSummary, isPastEvent = false) => {
    const spotsRemaining = Math.max(event.capacity - (event.currentRegistrations ?? 0), 0);
    const isFull = spotsRemaining === 0;
    const registrationsState = registrations[event.id] ?? { loading: false, data: null, error: null, open: false };
    const isEditing = editingEventId === event.id;
    const isActive = activeEventId === event.id;

    return (
      <Card
        key={event.id}
        className={`border-white/10 bg-slate-900/40 transition ${
          isActive ? "border-sky-400/70 shadow-[0_0_0_1px_rgba(56,189,248,0.4)]" : ""
        }`}
      >
        <CardHeader className="space-y-2">
          <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-base text-white">
            <span className="flex-1 text-left">{event.title}</span>
            <div className="flex items-center gap-2">
              <Badge variant={isFull ? "warning" : "info"}>
                {isFull ? "Event full" : `${spotsRemaining} spots left`}
              </Badge>
              {isPastEvent ? <Badge variant="default">Past event</Badge> : null}
            </div>
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
              size="sm"
              onClick={() => setActiveEventId(event.id)}
              variant={isActive ? "primary" : "secondary"}
              disabled={isActive}
            >
              {isActive ? "Viewing instructions & chat" : "Open instructions & chat"}
            </Button>
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
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        id={`edit-eventDate-${event.id}`}
                        type="date"
                        value={isEditing ? editDatePart : ""}
                        onChange={(e) => handleEditDatePartChange(e.target.value)}
                        required
                      />
                      <Input
                        id={`edit-eventTime-${event.id}`}
                        type="time"
                        step={60}
                        value={isEditing ? editTimePart : ""}
                        onChange={(e) => handleEditTimePartChange(e.target.value)}
                        required
                      />
                    </div>
                    <p className="text-xs text-slate-500">Example: 2025-10-18 19:30</p>
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
                      <li key={registration.registrationId} className="flex flex-col gap-2 py-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-white">
                          <span>{registration.attendee?.fullName ?? registration.attendee?.username}</span>
                          <Badge variant="info">{registration.status.replace("_", " ")}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                          <span>{registration.attendee?.email}</span>
                          {registration.attendee?.phoneNumber ? <span>{registration.attendee.phoneNumber}</span> : null}
                          <span>
                            {registration.registeredAt ? `Registered ${formatRelative(registration.registeredAt)}` : "Timing unknown"}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                            ID: {registration.registrationId}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-300 hover:text-red-200"
                            onClick={() => void handleRemoveRegistration(event.id, registration.registrationId, registration.attendee?.fullName ?? registration.attendee?.username)}
                            disabled={!canManageEvents || removingRegistrationId === registration.registrationId}
                          >
                            {removingRegistrationId === registration.registrationId ? "Removing…" : "Remove attendee"}
                          </Button>
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
          {isActive ? (
            <div className="space-y-5 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white">Instructions & chat</h3>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Keep attendees aligned and answer questions instantly.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {instructionsLoading ? (
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Refreshing…</span>
                  ) : null}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleInstructionsRefresh().catch(() => undefined)}
                    disabled={instructionsLoading || !activeEventId}
                  >
                    {instructionsLoading ? "Refreshing…" : "Refresh instructions"}
                  </Button>
                </div>
              </div>

              {instructionBanner ? (
                <Alert
                  variant={instructionBanner.variant}
                  title={instructionBanner.variant === "success" ? "Success" : "Notice"}
                  description={instructionBanner.message}
                />
              ) : null}

              {instructionsError ? (
                <Alert variant="error" title="Unable to load instructions" description={instructionsError} />
              ) : instructionsLoading ? (
                <div className="flex min-h-[12rem] items-center justify-center">
                  <Spinner />
                </div>
              ) : instructions.length === 0 ? (
                <Alert
                  variant="info"
                  title="No instructions yet"
                  description="Share preparation notes so attendees know what to expect."
                />
              ) : (
                <ul className="space-y-4">
                  {instructions.map((instruction) => (
                    <li key={instruction.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-semibold text-white">{instruction.title}</h4>
                          {instruction.createdAt ? (
                            <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
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

              <form className="space-y-4" onSubmit={handleInstructionSubmit}>
                <fieldset
                  disabled={!canManageEvents || instructionSubmitting || !activeEventId}
                  className={`${!canManageEvents ? "pointer-events-none opacity-60" : ""}`}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <Label htmlFor="instruction-title">Instruction title</Label>
                      <Input
                        id="instruction-title"
                        value={instructionForm.title}
                        onChange={(event) => handleInstructionInputChange("title", event.target.value)}
                        placeholder="e.g. Bring your student ID"
                        required
                      />
                    </div>
                    <div className="md:col-span-2 flex flex-col gap-2">
                      <Label htmlFor="instruction-content">Details</Label>
                      <textarea
                        id="instruction-content"
                        className="min-h-[120px] rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                        value={instructionForm.content}
                        onChange={(event) => handleInstructionInputChange("content", event.target.value)}
                        placeholder="Share arrival info, required materials, or reminders."
                        required
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border border-white/20 bg-slate-950"
                        checked={instructionForm.isImportant}
                        onChange={(event) => handleInstructionInputChange("isImportant", event.target.checked)}
                      />
                      Mark as important
                    </label>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="submit">
                      {instructionSubmitting ? "Posting…" : "Share instruction"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setInstructionForm(INITIAL_INSTRUCTION_FORM)}
                      disabled={instructionSubmitting}
                    >
                      Clear
                    </Button>
                  </div>
                </fieldset>
              </form>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white">Event chat</h4>
                <ChatPanel
                  resourceType="event"
                  resourceId={event.id}
                  title={`${event.title} chat`}
                  disabledReason={!canManageEvents ? "Activate your club to use event chat." : undefined}
                />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
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
          <p className="text-sm text-slate-300">Create new Events and review upcoming experiences.</p>
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
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
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
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    id="eventDate"
                    type="date"
                    value={createDatePart}
                    onChange={(event) => handleCreateDatePartChange(event.target.value)}
                    required
                  />
                  <Input
                    id="eventTime"
                    type="time"
                    step={60}
                    value={createTimePart}
                    onChange={(event) => handleCreateTimePartChange(event.target.value)}
                    required
                  />
                </div>
                <p className="text-xs text-slate-500">Example: 2025-10-18 19:30</p>
                {createDateError ? (
                  <p className="text-xs text-red-300">{createDateError}</p>
                ) : null}
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
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setForm(INITIAL_FORM);
                    setCreateDateError(null);
                    setCreateDatePart("");
                    setCreateTimePart("");
                  }}
                >
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
            {ongoingEvents.length > 0
              ? `Showing ${ongoingEvents.length} ongoing ${ongoingEvents.length === 1 ? "event" : "events"}`
              : sortedEvents.length === 0
                ? "No events scheduled yet"
                : "No ongoing events right now"}
          </span>
          <span>{refreshing ? "Refreshing…" : ""}</span>
        </div>

        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Spinner />
          </div>
        ) : ongoingEvents.length === 0 ? (
          sortedEvents.length === 0 ? (
            <Card className="border-dashed border-white/10 bg-slate-900/40">
              <CardContent className="space-y-3 py-10 text-center text-sm text-slate-300">
                <p>Your club has not scheduled any events yet.</p>
                <p>Create one above to start engaging students.</p>
              </CardContent>
            </Card>
          ) : (
            <Alert
              variant="info"
              title="No ongoing events"
              description="All scheduled events have already occurred. Review past programming below or create something new."
            />
          )
        ) : (
          <div className="flex flex-col gap-4">
            {ongoingEvents.map((event) => renderEventCard(event))}
          </div>
        )}
      </section>

      {pastEvents.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
            <span>{`Past events (${pastEvents.length})`}</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {pastEvents.map((event) => renderEventCard(event, true))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
