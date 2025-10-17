"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/providers/session-provider";

const ROLE_OPTIONS = ["STUDENT", "CLUB_ADMIN", "ADMIN"] as const;

type AdminRole = (typeof ROLE_OPTIONS)[number];

interface AdminUser {
  id: number;
  username: string;
  email: string;
  fullName?: string | null;
  phoneNumber?: string | null;
  role: AdminRole;
  createdAt?: string | null;
}

interface BannerState {
  variant: "success" | "error";
  message: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roleDrafts, setRoleDrafts] = useState<Record<number, AdminRole>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);

  const isAdmin = useMemo(() => user?.role === "ADMIN", [user]);

  const loadUsers = useCallback(async () => {
    if (!isAdmin) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<AdminUser[]>("/api/admin/users");
      setUsers(data);
      setRoleDrafts(
        data.reduce<Record<number, AdminRole>>((acc, current) => {
          const nextRole = ROLE_OPTIONS.includes(current.role) ? current.role : "STUDENT";
          acc[current.id] = nextRole;
          return acc;
        }, {})
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!sessionLoading) {
      if (!isAdmin) {
        router.replace("/app/events");
        return;
      }
      loadUsers().catch(() => {
        // errors handled in loadUsers
      });
    }
  }, [sessionLoading, isAdmin, loadUsers, router]);

  const handleRefresh = () => {
    setBanner(null);
    loadUsers().catch(() => {
      // errors handled in loadUsers
    });
  };

  const handleRoleChange = (id: number, role: AdminRole) => {
    setRoleDrafts((prev) => ({ ...prev, [id]: role }));
  };

  const updateUserRole = async (id: number) => {
    const nextRole = roleDrafts[id];
    if (!nextRole) {
      return;
    }

    setPendingUserId(id);
    setBanner(null);

    try {
      await apiFetch(`/api/admin/users/${id}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: nextRole }),
      });
      await loadUsers();
      setBanner({ variant: "success", message: "User role updated successfully." });
    } catch (err) {
      setBanner({
        variant: "error",
        message: err instanceof Error ? err.message : "Unable to update user role.",
      });
    } finally {
      setPendingUserId(null);
    }
  };

  const promoteToClubAdmin = async (id: number) => {
    setPendingUserId(id);
    setBanner(null);

    try {
      await apiFetch(`/api/admin/promote-club-admin/${id}`, {
        method: "POST",
      });
      await loadUsers();
      setBanner({ variant: "success", message: "User promoted to club admin." });
    } catch (err) {
      setBanner({
        variant: "error",
        message: err instanceof Error ? err.message : "Unable to promote user.",
      });
    } finally {
      setPendingUserId(null);
    }
  };

  if (sessionLoading || (!isAdmin && loading)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 sm:px-10">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold text-white">Admin · Manage users</h1>
        <p className="text-sm text-slate-300">
          View all registered users, promote standout students, and adjust access levels across the platform.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
          {loading ? "Loading users…" : `Showing ${users.length} ${users.length === 1 ? "user" : "users"}`}
        </span>
        <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={loading}>
          Refresh
        </Button>
      </div>

      {banner ? (
        <Alert
          variant={banner.variant}
          title={banner.variant === "success" ? "Success" : "Something went wrong"}
          description={banner.message}
        />
      ) : null}

      {error ? (
        <Alert variant="error" title="Unable to load users" description={error} />
      ) : loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner />
        </div>
      ) : users.length === 0 ? (
        <Alert
          variant="info"
          title="No users to display"
          description="Registrations will appear here once new members join the community."
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-slate-900/70 text-xs uppercase tracking-[0.18em] text-slate-400">
              <tr>
                <th scope="col" className="px-6 py-4 text-left font-semibold">
                  Name
                </th>
                <th scope="col" className="px-6 py-4 text-left font-semibold">
                  Contact
                </th>
                <th scope="col" className="px-6 py-4 text-left font-semibold">
                  Role
                </th>
                <th scope="col" className="px-6 py-4 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-slate-900/30 text-slate-200">
              {users.map((record) => {
                const isPending = pendingUserId === record.id;
                const roleDraft = roleDrafts[record.id] ?? record.role;
                const canPromote = record.role === "STUDENT";
                const isSelf = record.id === user?.id;

                return (
                  <tr key={record.id} className="transition hover:bg-slate-900/60">
                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-white">{record.fullName || record.username}</span>
                        <span className="text-xs uppercase tracking-[0.2em] text-slate-500">@{record.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-col gap-1 text-slate-300">
                        <span>{record.email}</span>
                        {record.phoneNumber ? <span className="text-xs text-slate-500">{record.phoneNumber}</span> : null}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-col gap-2">
                        <Badge variant={record.role === "ADMIN" ? "warning" : record.role === "CLUB_ADMIN" ? "info" : "default"}>
                          {record.role.replace("_", " ")}
                        </Badge>
                        <label className="text-xs text-slate-400">
                          <span className="sr-only">Update role for {record.username}</span>
                          <select
                            className="w-full rounded-full border border-white/10 bg-slate-950 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-slate-200 focus:border-sky-400 focus:outline-none"
                            value={roleDraft}
                            onChange={(event) => handleRoleChange(record.id, event.target.value as AdminRole)}
                            disabled={isPending || isSelf}
                          >
                            {ROLE_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option.replace("_", " ")}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-col items-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateUserRole(record.id)}
                          disabled={isPending || isSelf || roleDraft === record.role}
                        >
                          {isPending ? "Saving…" : "Save changes"}
                        </Button>
                        {canPromote ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => promoteToClubAdmin(record.id)}
                            disabled={isPending}
                          >
                            {isPending ? "Working…" : "Promote to club admin"}
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
    </div>
  );
}
