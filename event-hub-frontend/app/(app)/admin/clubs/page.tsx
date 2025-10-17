"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { apiFetch } from "@/lib/api-client";
import { formatDateTime } from "@/lib/date";
import type { AdminClub, ClubJoinRequestSummary, ClubStatus } from "@/lib/types";
import { useSession } from "@/providers/session-provider";

interface BannerState {
  variant: "success" | "error";
  message: string;
}

type ClubFilter = "ALL" | ClubStatus;

const CLUB_STATUS_FILTERS: { key: ClubFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "ACTIVE", label: "Active" },
  { key: "RETIRED", label: "Retired" },
];

function statusBadgeVariant(status: ClubStatus) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "PENDING") return "warning" as const;
  return "default" as const;
}

export default function AdminClubsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: sessionLoading } = useSession();

  const [clubStatusFilter, setClubStatusFilter] = useState<ClubFilter>("PENDING");
  const [clubs, setClubs] = useState<AdminClub[]>([]);
  const [clubLoading, setClubLoading] = useState(true);
  const [clubError, setClubError] = useState<string | null>(null);
  const [requests, setRequests] = useState<ClubJoinRequestSummary[]>([]);
  const [requestLoading, setRequestLoading] = useState(true);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [pendingRequestId, setPendingRequestId] = useState<number | null>(null);
  const [pendingClubId, setPendingClubId] = useState<number | null>(null);

  const isAdmin = useMemo(() => user?.role === "ADMIN", [user]);

  const loadClubs = useCallback(async (filter: ClubFilter) => {
    setClubLoading(true);
    setClubError(null);
    try {
      const data = await apiFetch<AdminClub[]>("/api/admin/clubs", {
        ...(filter === "ALL" ? {} : { searchParams: { status: filter } }),
      });
      setClubs(data);
    } catch (err) {
      setClubError(err instanceof Error ? err.message : "Failed to load clubs");
    } finally {
      setClubLoading(false);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setRequestLoading(true);
    setRequestError(null);
    try {
      const data = await apiFetch<ClubJoinRequestSummary[]>("/api/admin/club-requests");
      setRequests(data);
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : "Failed to load club requests");
    } finally {
      setRequestLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionLoading) {
      if (!isAdmin) {
        router.replace("/app/events");
        return;
      }
      loadRequests().catch(() => {
        // errors handled in loadRequests
      });
    }
  }, [sessionLoading, isAdmin, loadRequests, router]);

  useEffect(() => {
    if (!sessionLoading && isAdmin) {
      loadClubs(clubStatusFilter).catch(() => {
        // errors handled in loadClubs
      });
    }
  }, [sessionLoading, isAdmin, clubStatusFilter, loadClubs]);

  const handleRefreshClubs = () => {
    loadClubs(clubStatusFilter).catch(() => {
      // errors handled in loadClubs
    });
  };

  const handleRefreshRequests = () => {
    loadRequests().catch(() => {
      // errors handled in loadRequests
    });
  };

  const approveRequest = useCallback(
    async (requestId: number) => {
      setPendingRequestId(requestId);
      setBanner(null);
      try {
        await apiFetch(`/api/admin/club-requests/${requestId}/approve`, {
          method: "POST",
        });
        await Promise.all([loadRequests(), loadClubs(clubStatusFilter)]);
        setBanner({ variant: "success", message: "Club approved and activated." });
      } catch (err) {
        setBanner({
          variant: "error",
          message: err instanceof Error ? err.message : "Unable to approve club request.",
        });
      } finally {
        setPendingRequestId(null);
      }
    },
    [clubStatusFilter, loadClubs, loadRequests]
  );

  const rejectRequest = useCallback(
    async (requestId: number) => {
      let message: string | undefined;
      if (typeof window !== "undefined") {
        const input = window.prompt("Add an optional note for the requester", "");
        if (input && input.trim().length > 0) {
          message = input.trim();
        }
      }

      setPendingRequestId(requestId);
      setBanner(null);

      try {
        await apiFetch(`/api/admin/club-requests/${requestId}/reject`, {
          method: "POST",
          body: message ? JSON.stringify({ message }) : undefined,
        });
        await loadRequests();
        setBanner({ variant: "success", message: "Club request rejected." });
      } catch (err) {
        setBanner({
          variant: "error",
          message: err instanceof Error ? err.message : "Unable to reject club request.",
        });
      } finally {
        setPendingRequestId(null);
      }
    },
    [loadRequests]
  );

  const updateClubStatus = useCallback(
    async (clubId: number, nextStatus: ClubStatus) => {
      setPendingClubId(clubId);
      setBanner(null);
      try {
        await apiFetch(`/api/admin/clubs/${clubId}/status`, {
          method: "PUT",
          body: JSON.stringify({ status: nextStatus }),
        });
        await loadClubs(clubStatusFilter);
        setBanner({ variant: "success", message: `Club marked as ${nextStatus.toLowerCase()}.` });
      } catch (err) {
        setBanner({
          variant: "error",
          message: err instanceof Error ? err.message : "Unable to update club status.",
        });
      } finally {
        setPendingClubId(null);
      }
    },
    [clubStatusFilter, loadClubs]
  );

  if (sessionLoading || (!isAdmin && (clubLoading || requestLoading))) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 sm:px-10">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold text-white">Admin · Approve clubs</h1>
        <p className="text-sm text-slate-300">
          Review new club requests, activate approved organizations, and manage the lifecycle of existing clubs.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          { href: "/app/admin/users", label: "Manage users" },
          { href: "/app/admin/clubs", label: "Approve clubs" },
        ].map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                buttonClasses({ variant: active ? "secondary" : "ghost", size: "sm" }),
                active ? "bg-slate-900/60" : ""
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {banner ? (
        <Alert
          variant={banner.variant}
          title={banner.variant === "success" ? "Success" : "Something went wrong"}
          description={banner.message}
        />
      ) : null}

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-white">Pending club creation requests</h2>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
              {requestLoading
                ? "Loading requests…"
                : `Showing ${requests.length} pending ${requests.length === 1 ? "request" : "requests"}`}
            </span>
          </div>
          <Button variant="secondary" size="sm" onClick={handleRefreshRequests} disabled={requestLoading}>
            Refresh
          </Button>
        </div>

        {requestError ? (
          <Alert variant="error" title="Unable to load requests" description={requestError} />
        ) : requestLoading ? (
          <div className="flex min-h-[24vh] items-center justify-center">
            <Spinner />
          </div>
        ) : requests.length === 0 ? (
          <Alert
            variant="info"
            title="No pending requests"
            description="Club creation submissions awaiting approval will appear here."
          />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-slate-900/70 text-xs uppercase tracking-[0.18em] text-slate-400">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left font-semibold">
                    Requester
                  </th>
                  <th scope="col" className="px-6 py-4 text-left font-semibold">
                    Club details
                  </th>
                  <th scope="col" className="px-6 py-4 text-left font-semibold">
                    Submitted
                  </th>
                  <th scope="col" className="px-6 py-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-slate-900/30 text-slate-200">
                {requests.map((request) => {
                  const isProcessing = pendingRequestId === request.id;
                  return (
                    <tr key={request.id} className="transition hover:bg-slate-900/60">
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-white">
                            {request.requester?.fullName || request.requester?.username || "Unknown requester"}
                          </span>
                          {request.requester?.username ? (
                            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                              @{request.requester.username}
                            </span>
                          ) : null}
                          {request.requester?.email ? (
                            <span className="text-xs text-slate-400">{request.requester.email}</span>
                          ) : null}
                          {request.requester?.phoneNumber ? (
                            <span className="text-xs text-slate-500">{request.requester.phoneNumber}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-col gap-1 text-slate-300">
                          <span className="font-medium text-white">{request.requestedName}</span>
                          {request.requestedDescription ? (
                            <p className="text-xs text-slate-400">{request.requestedDescription}</p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-col gap-1 text-xs text-slate-400">
                          {request.createdAt ? <span>{formatDateTime(request.createdAt)}</span> : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-col items-end gap-2">
                          <Button size="sm" onClick={() => approveRequest(request.id)} disabled={isProcessing}>
                            {isProcessing ? "Approving…" : "Approve"}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => rejectRequest(request.id)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? "Working…" : "Reject"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold text-white">All clubs</h2>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {clubLoading
                  ? "Loading clubs…"
                  : `Showing ${clubs.length} ${clubs.length === 1 ? "club" : "clubs"} (${clubStatusFilter.toLowerCase()} view)`}
              </span>
            </div>
            <Button variant="secondary" size="sm" onClick={handleRefreshClubs} disabled={clubLoading}>
              Refresh
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {CLUB_STATUS_FILTERS.map((option) => {
              const active = clubStatusFilter === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  className={clsx(
                    buttonClasses({ variant: active ? "secondary" : "ghost", size: "sm" }),
                    active ? "bg-slate-900/60 text-white" : ""
                  )}
                  onClick={() => setClubStatusFilter(option.key)}
                  disabled={clubLoading && active}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {clubError ? (
          <Alert variant="error" title="Unable to load clubs" description={clubError} />
        ) : clubLoading ? (
          <div className="flex min-h-[24vh] items-center justify-center">
            <Spinner />
          </div>
        ) : clubs.length === 0 ? (
          <Alert
            variant="info"
            title="No clubs to display"
            description="Approved clubs will appear once they have been created and assigned to an admin."
          />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-slate-900/70 text-xs uppercase tracking-[0.18em] text-slate-400">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left font-semibold">
                    Club
                  </th>
                  <th scope="col" className="px-6 py-4 text-left font-semibold">
                    Admin contact
                  </th>
                  <th scope="col" className="px-6 py-4 text-left font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-slate-900/30 text-slate-200">
                {clubs.map((club) => {
                  const isProcessing = pendingClubId === club.id;
                  return (
                    <tr key={club.id} className="transition hover:bg-slate-900/60">
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-white">{club.name}</span>
                          {club.description ? (
                            <p className="text-xs text-slate-400">{club.description}</p>
                          ) : null}
                          {club.createdAt ? (
                            <span className="text-xs text-slate-500">Created {formatDateTime(club.createdAt)}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-col gap-1 text-slate-300">
                          <span className="font-medium text-white">
                            {club.admin?.fullName || club.admin?.username || "Unassigned"}
                          </span>
                          {club.admin?.username ? (
                            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                              @{club.admin.username}
                            </span>
                          ) : null}
                          {club.admin?.email ? (
                            <span className="text-xs text-slate-400">{club.admin.email}</span>
                          ) : null}
                          {club.admin?.phoneNumber ? (
                            <span className="text-xs text-slate-500">{club.admin.phoneNumber}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <Badge variant={statusBadgeVariant(club.status)}>{club.status}</Badge>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-col items-end gap-2">
                          {club.status !== "ACTIVE" ? (
                            <Button
                              size="sm"
                              onClick={() => updateClubStatus(club.id, "ACTIVE")}
                              disabled={isProcessing}
                            >
                              {isProcessing ? "Updating…" : "Activate"}
                            </Button>
                          ) : null}
                          {club.status === "ACTIVE" ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => updateClubStatus(club.id, "RETIRED")}
                              disabled={isProcessing}
                            >
                              {isProcessing ? "Updating…" : "Retire"}
                            </Button>
                          ) : null}
                          {club.status === "RETIRED" ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => updateClubStatus(club.id, "PENDING")}
                              disabled={isProcessing}
                            >
                              {isProcessing ? "Updating…" : "Set pending"}
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
