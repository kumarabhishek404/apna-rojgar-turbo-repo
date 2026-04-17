"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/auth";
import { useAdminAccess } from "@/components/webapp/admin/useAdminAccess";
import InfiniteScrollSentinel from "@/components/webapp/admin/InfiniteScrollSentinel";

type AdminUser = {
  _id: string;
  name?: string;
  mobile?: string;
  role?: string;
  status?: string;
  registrationSource?: string;
  createdAt?: string;
  updatedAt?: string;
  profilePicture?: string;
  email?: { value?: string; isVerified?: boolean };
  gender?: string;
  age?: string;
  address?: string;
  locale?: { language?: string };
};

export default function AdminUsersPage() {
  const access = useAdminAccess();
  const [rows, setRows] = useState<AdminUser[]>([]);
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
  });
  const limit = 20;
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [selectedSource, setSelectedSource] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchText, setSearchText] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    setRows([]);
    setPages(1);
    setTotal(0);
    setPage(1);
  }, [selectedRole, selectedSource, selectedStatus, searchText]);

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

    apiRequest<{
      data: AdminUser[];
      stats?: {
        total?: number;
        admin?: number;
        workers?: number;
        mediators?: number;
        employers?: number;
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
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load users"))
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  }, [access, page, selectedRole, selectedSource, selectedStatus, searchText]);

  const canLoadMore = page < pages;
  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore || !canLoadMore) return;
    setPage((prev) => prev + 1);
  }, [canLoadMore, loading, loadingMore]);

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
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-5">
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
                          <p className="font-semibold text-slate-800">{user.name || "Unnamed"}</p>
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
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-3"
          onClick={() => setSelectedUser(null)}
          role="presentation"
        >
          <div
            className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="User details"
          >
            <div className="flex items-start justify-between border-b border-slate-200 p-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {selectedUser.name || "Unnamed user"}
                </h3>
                <p className="text-xs text-slate-500">User ID: {selectedUser._id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            <div className="max-h-[calc(92vh-84px)] overflow-y-auto p-4">
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="space-y-3">
                  <SectionTitle title="Identity & Access" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Detail title="Name" value={stringValue((selectedUser as any).name)} />
                    <Detail title="Role" value={stringValue((selectedUser as any).role)} />
                    <Detail title="Status" value={stringValue((selectedUser as any).status)} />
                    <Detail
                      title="Registration source"
                      value={stringValue((selectedUser as any).registrationSource)}
                    />
                    <Detail title="User ID" value={stringValue((selectedUser as any)._id)} className="sm:col-span-2" />
                  </div>
                </div>

                <div className="space-y-3">
                  <SectionTitle title="Contact" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Detail title="Mobile" value={stringValue((selectedUser as any).mobile)} />
                    <Detail title="Country code" value={stringValue((selectedUser as any).countryCode)} />
                    <Detail title="Email" value={stringValue((selectedUser as any).email?.value)} className="sm:col-span-2" />
                    <Detail
                      title="Email verified"
                      value={(selectedUser as any).email?.isVerified ? "Yes" : "No"}
                    />
                    <Detail
                      title="Notification consent"
                      value={(selectedUser as any).notificationConsent === false ? "No" : "Yes"}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <SectionTitle title="Personal Details" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Detail title="Gender" value={stringValue((selectedUser as any).gender)} />
                    <Detail title="Age" value={stringValue((selectedUser as any).age)} />
                    <Detail title="Date of birth" value={stringValue((selectedUser as any).dateOfBirth)} />
                    <Detail title="Aadhaar" value={stringValue((selectedUser as any).aadhaarNumber)} />
                    <Detail title="Language" value={stringValue((selectedUser as any).locale?.language)} />
                    <Detail title="Address" value={stringValue((selectedUser as any).address)} className="sm:col-span-2" />
                  </div>
                </div>

                <div className="space-y-3">
                  <SectionTitle title="Activity Counters" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Detail title="Liked users count" value={countValue((selectedUser as any).likedUsers)} />
                    <Detail title="Liked services count" value={countValue((selectedUser as any).likedServices)} />
                    <Detail title="Liked by count" value={countValue((selectedUser as any).likedBy)} />
                    <Detail title="Booking requests count" value={countValue((selectedUser as any).bookingRequestBy)} />
                    <Detail title="My bookings count" value={countValue((selectedUser as any).myBookings)} />
                    <Detail title="Booked by count" value={countValue((selectedUser as any).bookedBy)} />
                    <Detail title="Skills count" value={countValue((selectedUser as any).skills)} />
                    <Detail title="Saved addresses count" value={countValue((selectedUser as any).savedAddresses)} />
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4">
                <DetailBlock title="Geo Location" data={(selectedUser as any).geoLocation} />
                <DetailBlock title="Skills" data={(selectedUser as any).skills} />
                <DetailBlock title="Work Details" data={(selectedUser as any).workDetails} />
                <DetailBlock title="Service Details" data={(selectedUser as any).serviceDetails} />
                <DetailBlock title="Mediator Details" data={(selectedUser as any).mediatorDetails} />
                <DetailBlock title="Ratings" data={(selectedUser as any).rating} />
                <DetailBlock title="Earnings" data={(selectedUser as any).earnings} />
                <DetailBlock title="Spent" data={(selectedUser as any).spent} />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Detail
                  title="Created"
                  value={
                    (selectedUser as any).createdAt
                      ? new Date((selectedUser as any).createdAt).toLocaleString()
                      : "-"
                  }
                />
                <Detail
                  title="Updated"
                  value={
                    (selectedUser as any).updatedAt
                      ? new Date((selectedUser as any).updatedAt).toLocaleString()
                      : "-"
                  }
                />
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Full raw database object
                </p>
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-700">
                  {JSON.stringify(selectedUser, null, 2)}
                </pre>
              </div>
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

function Detail({
  title,
  value,
  className = "",
}: {
  title: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-slate-50 p-3 ${className}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      {title}
    </p>
  );
}

function DetailBlock({ title, data }: { title: string; data: unknown }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-700">
        {pretty(data)}
      </pre>
    </div>
  );
}

function pretty(value: unknown) {
  if (value == null) return "-";
  if (typeof value === "string") return value || "-";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function stringValue(value: unknown) {
  if (value == null) return "-";
  const normalized = String(value).trim();
  return normalized || "-";
}

function countValue(value: unknown) {
  return Array.isArray(value) ? String(value.length) : "0";
}

