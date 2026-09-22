"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/auth";
import { useAdminAccess } from "@/components/webapp/admin/useAdminAccess";
import InfiniteScrollSentinel from "@/components/webapp/admin/InfiniteScrollSentinel";
import AdminUserDetailsView, {
  type AdminUserRecord,
} from "@/components/webapp/admin/AdminUserDetailsView";
import VerifiedBadge from "@/components/commons/VerifiedBadge";
import {
  normalizeVerification,
  VERIFICATION_STATUS,
  type VerificationStatus,
} from "@/lib/userVerification";

export default function AdminUsersPage() {
  const access = useAdminAccess();
  const [rows, setRows] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    admin: 0,
    workers: 0,
    mediators: 0,
    employers: 0,
    verification: { pending: 0, applied: 0, completed: 0 },
  });
  const limit = 20;
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [selectedSource, setSelectedSource] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedVerification, setSelectedVerification] = useState("ALL");
  const [searchText, setSearchText] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);
  const [verificationSaving, setVerificationSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    setRows([]);
    setPages(1);
    setTotal(0);
    setPage(1);
  }, [selectedRole, selectedSource, selectedStatus, selectedVerification, searchText]);

  useEffect(() => {
    if (access !== "allowed") return;
    setLoading(page === 1);
    setLoadingMore(page > 1);
    const params = new URLSearchParams();
    params.set("status", selectedStatus);
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (selectedRole !== "ALL") params.set("role", selectedRole);
    if (selectedSource !== "ALL") params.set("source", selectedSource);
    const q = searchText.trim();
    if (q) params.set("search", q);
    if (selectedVerification !== "ALL") params.set("verification", selectedVerification);

    apiRequest<{
      data: AdminUserRecord[];
      stats?: {
        total?: number;
        admin?: number;
        workers?: number;
        mediators?: number;
        employers?: number;
        verification?: { pending?: number; applied?: number; completed?: number };
      };
      pagination?: { total?: number; page?: number; pages?: number };
    }>(`/admin/all-users?${params.toString()}`)
      .then((res) => {
        setRows((prev) => (page === 1 ? res?.data || [] : [...prev, ...(res?.data || [])]));
        setPages(res?.pagination?.pages || 1);
        setTotal(res?.pagination?.total || 0);
        setStats({
          total: res?.stats?.total || 0,
          admin: res?.stats?.admin || 0,
          workers: res?.stats?.workers || 0,
          mediators: res?.stats?.mediators || 0,
          employers: res?.stats?.employers || 0,
          verification: {
            pending: res?.stats?.verification?.pending || 0,
            applied: res?.stats?.verification?.applied || 0,
            completed: res?.stats?.verification?.completed || 0,
          },
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load users"))
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  }, [access, page, selectedRole, selectedSource, selectedStatus, selectedVerification, searchText]);

  const canLoadMore = page < pages;
  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore || !canLoadMore) return;
    setPage((prev) => prev + 1);
  }, [canLoadMore, loading, loadingMore]);

  useEffect(() => {
    if (!selectedUser) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedUser(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedUser]);

  useEffect(() => {
    setActionMessage("");
  }, [selectedUser?._id]);

  const handleVerificationChange = async (verification: VerificationStatus) => {
    if (!selectedUser?._id) return;
    setVerificationSaving(true);
    setActionMessage("");
    try {
      await apiRequest(`/admin/users/${selectedUser._id}/verification`, {
        method: "PATCH",
        body: JSON.stringify({ verification }),
      });
      const nextUser = { ...selectedUser, verification };
      setSelectedUser(nextUser);
      setRows((prev) =>
        prev.map((row) => (row._id === nextUser._id ? nextUser : row)),
      );
      setActionMessage(
        verification === VERIFICATION_STATUS.COMPLETED
          ? "User is now verified."
          : `Verification updated to ${verification}.`,
      );
    } catch (e) {
      setActionMessage(e instanceof Error ? e.message : "Failed to update verification");
    } finally {
      setVerificationSaving(false);
    }
  };

  if (access === "loading") return <section className="rounded-2xl bg-white p-6">Checking admin access...</section>;
  if (access === "denied") return null;

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-r from-[#1e3a8a] to-[#22409a] p-6 text-white shadow-sm">
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="mt-1 text-sm text-blue-100">Live active users overview from backend `User` model.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat title="Total" value={stats.total} />
        <Stat title="Admins" value={stats.admin} />
        <Stat title="Workers" value={stats.workers} />
        <Stat title="Mediators" value={stats.mediators} />
        <Stat title="Employers" value={stats.employers} />
        <Stat title="Verified" value={stats.verification.completed} />
        <Stat title="Applied" value={stats.verification.applied} />
        <Stat title="Pending verification" value={stats.verification.pending} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-6">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Search user
            </label>
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Name, mobile, or email"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none ring-[#22409a] focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none ring-[#22409a] focus:ring-2"
            >
              <option value="ALL">All roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="WORKER">WORKER</option>
              <option value="MEDIATOR">MEDIATOR</option>
              <option value="EMPLOYER">EMPLOYER</option>
              <option value="-">Unassigned</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none ring-[#22409a] focus:ring-2"
            >
              <option value="ALL">All status</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="PENDING">PENDING</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="DISABLED">DISABLED</option>
              <option value="DELETED">DELETED</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Source
            </label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none ring-[#22409a] focus:ring-2"
            >
              <option value="ALL">All sources</option>
              <option value="web">web</option>
              <option value="android">android</option>
              <option value="ios">ios</option>
              <option value="-">unknown</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Verification
            </label>
            <select
              value={selectedVerification}
              onChange={(e) => setSelectedVerification(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none ring-[#22409a] focus:ring-2"
            >
              <option value="ALL">All verification</option>
              <option value="Pending">Pending</option>
              <option value="Applied">Applied</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? <p className="p-4 text-sm text-slate-500">Loading users...</p> : null}
        {error ? <p className="p-4 text-sm text-red-600">{error}</p> : null}
        {!loading && !error ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Mobile</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Verification</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((user) => (
                  <tr key={user._id} className="border-t border-slate-100 transition hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.name || "User"}
                            className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#22409a] text-xs font-bold text-white">
                            {(user.name || "U").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <span>{user.name || "Unnamed"}</span>
                            <VerifiedBadge user={user} size="sm" />
                          </p>
                          <p className="text-xs text-slate-500">{user.email?.value || "No email"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.mobile || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="rounded-full bg-[#eef3ff] px-2.5 py-1 text-xs font-semibold text-[#22409a]">
                        {user.role || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        {user.status || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          normalizeVerification(user.verification) === VERIFICATION_STATUS.COMPLETED
                            ? "bg-emerald-50 text-emerald-700"
                            : normalizeVerification(user.verification) === VERIFICATION_STATUS.APPLIED
                              ? "bg-sky-50 text-sky-700"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {normalizeVerification(user.verification)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.registrationSource || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedUser(user)}
                        className="rounded-lg border border-[#22409a]/25 bg-white px-3 py-1.5 text-xs font-semibold text-[#22409a] transition hover:bg-[#eef3ff]"
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {!loading && !error && rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
          No users found for selected filters.
        </div>
      ) : null}
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
        Loaded <span className="font-semibold text-slate-800">{rows.length}</span>
        {total ? ` of ${total}` : ""} users
      </div>
      {loadingMore ? (
        <p className="text-center text-sm text-slate-500">Loading more users...</p>
      ) : null}
      <InfiniteScrollSentinel
        enabled={canLoadMore && !loading}
        loading={loadingMore}
        onLoadMore={handleLoadMore}
      />
      {!canLoadMore && rows.length > 0 ? (
        <p className="text-center text-xs text-slate-500">You reached the end of users list.</p>
      ) : null}

      {selectedUser ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm"
          onClick={() => setSelectedUser(null)}
          role="presentation"
        >
          <div
            className="relative max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-white/20 bg-white shadow-[0_20px_80px_rgba(15,23,42,0.35)]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="User details"
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-[#f7f9ff] to-[#eef3ff] px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#22409a]/80">
                  User details
                </p>
                <h3 className="text-base font-bold text-[#16264f]">
                  {selectedUser.name || "Unnamed user"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            <div className="max-h-[calc(92vh-4.25rem)] overflow-y-auto p-4 md:p-5">
              {actionMessage ? (
                <p className="mb-3 rounded-xl border border-[#22409a]/15 bg-[#f7f9ff] px-3 py-2 text-sm font-medium text-[#22409a]">
                  {actionMessage}
                </p>
              ) : null}
              <AdminUserDetailsView
                user={selectedUser}
                onVerificationChange={handleVerificationChange}
                verificationSaving={verificationSaving}
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-[#1e3a8a]">{value}</p>
    </div>
  );
}

