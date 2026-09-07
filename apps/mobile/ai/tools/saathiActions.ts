import API_CLIENT from "@/app/api";
import moment from "moment";
import { MIN_PAY_PER_DAY } from "@/utils/serviceRequirements";
import { mapSkillToWorkCategory } from "./workTypeMap";

export async function postWorkFromSaathi(params: {
  skill: string;
  quantity: number;
  payPerDay: number;
  duration: number;
  startDate: string;
  address: string;
  geoLocation?: unknown;
  description?: string;
  type?: string;
  subType?: string;
}): Promise<{ ok: boolean; message?: string; serviceId?: string }> {
  if (params.payPerDay < MIN_PAY_PER_DAY) {
    return { ok: false, message: "pay_low" };
  }
  const mapped = mapSkillToWorkCategory(params.skill);
  const type = params.type || mapped.type;
  const subType = params.subType || mapped.subType;
  try {
    const res = await API_CLIENT.makePostRequest("/employer/add-service/metadata", {
      type,
      subType,
      description: params.description || "",
      address: params.address,
      geoLocation: JSON.stringify(params.geoLocation || {}),
      startDate: params.startDate,
      duration: String(params.duration),
      bookingType: "byService",
      requirements: JSON.stringify([
        {
          name: params.skill,
          count: params.quantity,
          payPerDay: params.payPerDay,
        },
      ]),
      facilities: JSON.stringify({
        food: false,
        living: false,
        esi_pf: false,
        travelling: false,
      }),
    });
    const service = res?.data?.data;
    const id = service?._id ? String(service._id) : undefined;
    if (!id) return { ok: false, message: res?.data?.message || "failed" };
    return { ok: true, serviceId: id };
  } catch (error: any) {
    return {
      ok: false,
      message: error?.response?.data?.message || error?.message || "failed",
    };
  }
}

export async function applyToJobFromSaathi(params: {
  serviceId: string;
  skill: string;
  workerIds?: string[];
}): Promise<{ ok: boolean; message?: string }> {
  try {
    const workerIds = (params.workerIds || []).filter(Boolean);
    const body: Record<string, unknown> =
      workerIds.length > 0
        ? {
            serviceId: params.serviceId,
            workers: workerIds,
            skills: Object.fromEntries(
              workerIds.map((id) => [id, params.skill]),
            ),
          }
        : {
            serviceId: params.serviceId,
            skills: params.skill,
            workers: [],
          };
    await API_CLIENT.makePostRequest("/worker/apply", body);
    return { ok: true };
  } catch (error: any) {
    return {
      ok: false,
      message: error?.response?.data?.message || error?.message || "failed",
    };
  }
}

export async function sendBookingRequestFromSaathi(params: {
  workerUserId: string;
  skill: string;
  pricePerDay?: number;
  quantity: number;
  duration: number;
  startDate: string;
  address: string;
  location?: unknown;
  description?: string;
  type?: string;
  subType?: string;
}): Promise<{ ok: boolean; message?: string }> {
  try {
    await API_CLIENT.makePostRequestFormData("/employer/booking/invitations/send", {
      userId: params.workerUserId,
      startDate: params.startDate,
      duration: String(params.duration),
      description: params.description || "",
      address: params.address,
      location: params.location || {},
      requiredNumberOfWorkers: String(params.quantity),
      type: params.type || "",
      subType: params.subType || "",
      facilities: {
        food: false,
        living: false,
        esi_pf: false,
        travelling: false,
      },
      appliedSkill: {
        skill: params.skill,
        pricePerDay: params.pricePerDay ?? null,
      },
    });
    return { ok: true };
  } catch (error: any) {
    return {
      ok: false,
      message: error?.response?.data?.message || error?.message || "failed",
    };
  }
}

export function resolveStartDate(hint?: string): string {
  if (hint === "today" || hint === "aaj") {
    return moment().format("YYYY-MM-DD");
  }
  if (hint === "tomorrow" || hint === "kal" || !hint) {
    return moment().add(1, "day").format("YYYY-MM-DD");
  }
  const m = moment(hint);
  if (m.isValid()) return m.format("YYYY-MM-DD");
  return moment().add(1, "day").format("YYYY-MM-DD");
}
