import API_CLIENT from "@/app/api";
import type { AppUserRole } from "@/utils/resolveDisplayUserRole";
import type { SaathiSnapshot, UpcomingBooking } from "../suggestions/suggestionTypes";
import { isCoreProfileIncomplete } from "@/constants/functions";
import { normalizePaginatedPage } from "@/utils/paginatedApi";
import moment from "moment";

function hoursUntil(date?: string): number | null {
  if (!date) return null;
  const m = moment(date);
  if (!m.isValid()) return null;
  return m.diff(moment(), "hours", true);
}

function asList(payload: unknown): any[] {
  return normalizePaginatedPage(payload).data;
}

function skillList(user: any): string[] {
  const skills = user?.skills;
  if (!Array.isArray(skills)) return [];
  return skills
    .map((s) => (typeof s === "string" ? s : s?.skill))
    .map((s) => String(s || "").trim())
    .filter(Boolean);
}

async function silentGet(path: string): Promise<any> {
  try {
    const res = await API_CLIENT.makeGetRequest(path);
    return res?.data;
  } catch {
    return null;
  }
}

async function silentPost(path: string, body?: object): Promise<any> {
  try {
    const res = await API_CLIENT.makePostRequest(path, body);
    return res?.data;
  } catch {
    return null;
  }
}

export async function loadSaathiSnapshot(params: {
  user: any;
  role: AppUserRole;
  locale: string;
}): Promise<SaathiSnapshot> {
  const { user, role, locale } = params;
  const skills = skillList(user);
  const primarySkill = skills[0];

  const jobsBody: Record<string, unknown> = {};
  if (primarySkill) jobsBody.skills = [primarySkill];

  const [jobsRes, appliedRes, workerBookingsRes, myServicesRes, bookedWorkersRes, membersRes] =
    await Promise.all([
      silentPost("/service/all?status=ACTIVE&page=1&limit=10", jobsBody),
      role === "WORKER"
        ? silentGet("/worker/applied-services?page=1&limit=10")
        : role === "MEDIATOR"
          ? silentGet("/mediator/applied-services?page=1&limit=10")
          : Promise.resolve(null),
      role === "WORKER"
        ? silentGet("/worker/booking/all?page=1&limit=10")
        : role === "MEDIATOR"
          ? silentGet("/mediator/booking/all?page=1&limit=10")
          : silentGet("/employer/booked-worker/all?page=1&limit=10"),
      role === "EMPLOYER"
        ? silentGet("/employer/my-services?status=HIRING&page=1&limit=10")
        : Promise.resolve(null),
      role === "EMPLOYER"
        ? silentGet("/employer/booked-worker/all?page=1&limit=10")
        : Promise.resolve(null),
      role === "MEDIATOR" && user?._id
        ? silentGet(`/mediator/team/${user._id}/members?category=&page=1&limit=10`)
        : Promise.resolve(null),
    ]);

  const jobs = asList(jobsRes);
  const nearest = jobs
    .map((j) => Number(j?.distance))
    .filter((n) => Number.isFinite(n) && n >= 0)
    .sort((a, b) => a - b)[0];

  const applications = asList(appliedRes);
  let accepted = 0;
  let pending = 0;
  for (const row of applications) {
    const status = String(row?.applicationStatus || row?.status || "").toUpperCase();
    if (status.includes("SELECT") || status.includes("ACCEPT") || status === "BOOKED") {
      accepted += 1;
    } else {
      pending += 1;
    }
  }

  const bookingRows = asList(workerBookingsRes);
  const upcomingBookings: UpcomingBooking[] = bookingRows
    .map((row) => {
      const start = row?.startDate || row?.service?.startDate;
      return {
        id: String(row?._id || ""),
        startDate: start,
        hoursUntil: hoursUntil(start),
        title: row?.type || row?.service?.type,
        address: row?.address || row?.service?.address,
      };
    })
    .filter((b) => b.id)
    .sort((a, b) => (a.hoursUntil ?? 9999) - (b.hoursUntil ?? 9999));

  const posted = asList(myServicesRes).map((s) => {
    const reqs = Array.isArray(s?.requirements) ? s.requirements : [];
    const needed = reqs.reduce((n: number, r: any) => n + (Number(r?.count) || 0), 0);
    return {
      id: String(s?._id || ""),
      status: s?.status,
      type: s?.type,
      appliedCount: Array.isArray(s?.appliedUsers) ? s.appliedUsers.length : 0,
      neededCount: needed || 1,
      selectedCount: Array.isArray(s?.selectedUsers) ? s.selectedUsers.length : 0,
    };
  });

  const locationLabel =
    typeof user?.address === "string" && user.address.trim()
      ? user.address.split(",")[0]?.trim()
      : undefined;

  return {
    role,
    userName: String(user?.name || "").trim().split(/\s+/)[0] || "",
    locale,
    skills,
    primarySkill,
    profileIncomplete: isCoreProfileIncomplete(user),
    locationLabel,
    address:
      typeof user?.address === "string" && user.address.trim()
        ? user.address.trim()
        : undefined,
    geoLocation: user?.geoLocation,
    userId: user?._id ? String(user._id) : undefined,
    upcomingBookings,
    applications: {
      total: applications.length,
      pending,
      accepted,
    },
    applicationRows: applications.slice(0, 5).map((row: any) => ({
      id: String(row?._id || row?.service?._id || ""),
      title: String(row?.type || row?.service?.type || row?.service?.subType || ""),
      status: String(row?.applicationStatus || row?.status || ""),
    })),
    nearbyJobs: {
      count:
        Number(normalizePaginatedPage(jobsRes).pagination?.total ?? jobs.length) ||
        jobs.length,
      nearestKm: nearest != null ? Math.round(nearest * 10) / 10 : null,
      skill: primarySkill,
    },
    postedWorks: posted,
    bookedWorkersCount: asList(bookedWorkersRes).length,
    teamMemberCount:
      Number(
        normalizePaginatedPage(membersRes).pagination?.total ??
          asList(membersRes).length,
      ) || 0,
  };
}

export async function searchJobs(options?: {
  skills?: string[];
  status?: string;
  page?: number;
}): Promise<any[]> {
  const status = options?.status || "ACTIVE";
  const page = Math.max(1, options?.page || 1);
  const body: Record<string, unknown> = {};
  if (options?.skills?.length) body.skills = options.skills;
  const res = await silentPost(
    `/service/all?status=${status}&page=${page}&limit=8`,
    body,
  );
  const first = asList(res);
  if (first.length || !options?.skills?.length || page > 1) return first;
  const all = await silentPost(
    `/service/all?status=${status}&page=${page}&limit=8`,
    {},
  );
  return asList(all);
}

export async function searchWorkers(options?: {
  skill?: string;
  distanceKm?: number;
  page?: number;
}): Promise<any[]> {
  const page = Math.max(1, options?.page || 1);
  const payload: Record<string, unknown> = { sortBy: "nearest" };
  if (options?.skill) payload.skills = [options.skill];
  if (options?.distanceKm != null) {
    if (options.distanceKm <= 10) payload.distance = "within_10km";
    else if (options.distanceKm <= 50) payload.distance = "within_50km";
    else payload.distance = "within_100km";
  }

  const res = await silentPost(
    `/user/all?role=WORKER&page=${page}&limit=8`,
    payload,
  );
  let rows = asList(res);
  if (rows.length || page > 1) return rows;

  if (options?.skill) {
    const withoutSkill = { ...payload };
    delete withoutSkill.skills;
    rows = asList(
      await silentPost(
        `/user/all?role=WORKER&page=${page}&limit=8`,
        withoutSkill,
      ),
    );
    if (rows.length) return rows;
  }

  rows = asList(
    await silentPost(`/user/all?role=WORKER&page=${page}&limit=8`, {
      sortBy: "nearest",
    }),
  );
  return rows;
}

export async function fetchTeamMembers(userId?: string): Promise<any[]> {
  if (!userId) return [];
  const res = await silentGet(
    `/mediator/team/${userId}/members?category=&page=1&limit=40`,
  );
  return asList(res);
}
