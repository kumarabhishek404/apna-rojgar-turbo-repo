import API_CLIENT from ".";
import TOAST from "@/app/hooks/toast";

/**
 * POST /worker/apply — keep mobile payloads compatible with backend:
 * - Mediator: { serviceId, workers: string[], skills: Record<workerId, skill> }
 * - Individual: { serviceId, skills: string, workers: [] } (skills may also be string[] from future clients)
 */
function normalizeApplyPayload(payload: Record<string, unknown>) {
  if (!payload || typeof payload !== "object") return payload;
  const serviceId = payload.serviceId;
  const rawWorkers = payload.workers;
  const workers = Array.isArray(rawWorkers)
    ? rawWorkers.filter((w) => w != null && String(w).trim() !== "")
    : [];
  const skills = payload.skills;

  if (workers.length > 0) {
    return { serviceId, workers, skills };
  }

  return {
    serviceId,
    skills,
    workers: [],
  };
}

const applyService = async (payload: any) => {
  try {
    const body = normalizeApplyPayload(payload as Record<string, unknown>);
    const data = await API_CLIENT.makePostRequest("/worker/apply", body);
    return data.data;
  } catch (error: any) {
    console.error(
      `[userService] An error occurred while applying in service : `,
      error?.response?.data?.message
    );
    TOAST?.error(
      error?.response?.data?.message ||
        "An error occurred while applying in service"
    );
    throw error;
  }
};

const unApplyService = async (payload: any) => {
  try {
    const data = await API_CLIENT.makePostRequest(
      "/worker/cancel-apply",
      payload
    );
    return data.data;
  } catch (error: any) {
    console.error(
      `[userService] An error occurred while cancel applying the service : `,
      error?.response?.data?.message
    );
    TOAST?.error(
      error?.response?.data?.message ||
        "An error occurred while cancel apply service"
    );
    throw error;
  }
};

const fetchMyAppliedServices = async ({ pageParam }: any) => {
  try {
    const data = await API_CLIENT.makeGetRequest(
      `/worker/applied-services?page=${pageParam}&limit=10`
    );
    return data.data;
  } catch (error: any) {
    console.error(
      `[userService] An error occurred while fetching my applied services : `,
      error?.response?.data?.message
    );
    TOAST?.error(
      error?.response?.data?.message ||
        "An error occurred while fetching my applied services"
    );
    throw error;
  }
};

const fetchAllBookingReceivedInvitations = async ({ pageParam }: any) => {
  try {
    const data = await API_CLIENT.makeGetRequest(
      `/worker/booking/invitation/received?page=${pageParam}&limit=10`
    );
    return data?.data;
  } catch (error: any) {
    console.error(
      `[userService] An error occurred while fetching recieved booking requests : `,
      error?.response?.data?.message
    );
    TOAST?.error(
      error?.response?.data?.message ||
        "An error occurred while fetching recieved booking requests"
    );
    throw error;
  }
};

const fetchBookingInvitationsDetails = async (id: any) => {
  console.log("Idd----", id);
  
  try {
    const data = await API_CLIENT.makeGetRequest(
      `/worker/booking/invitation/${id}`
    );
    return data.data;
  } catch (error: any) {
    console.error(
      `[userService] An error occurred while fetching booking requests details : `,
      error?.response?.data?.message
    );
    TOAST?.error(
      error?.response?.data?.message ||
        "An error occurred while fetching booking requests details"
    );
    throw error;
  }
};

const acceptBookingRequest = async (payload: any) => {
  try {
    const data = await API_CLIENT.makePostRequest(
      "/worker/booking/invitation/accept",
      payload
    );
    return data.data;
  } catch (error: any) {
    console.error(
      `[userService] An error occurred while accepting booking request : `,
      error?.response?.data?.message
    );
    TOAST?.error(
      error?.response?.data?.message ||
        "An error occurred while accepting booking request"
    );
    throw error;
  }
};

const rejectBookingRequest = async (payload: any) => {
  try {
    const data = await API_CLIENT.makePostRequest(
      "/worker/booking/invitation/reject",
      payload
    );
    return data.data;
  } catch (error: any) {
    console.error(
      `[userService] An error occurred while rejecting booking request : `,
      error?.response?.data?.message
    );
    TOAST?.error(
      error?.response?.data?.message ||
        "An error occurred while rejecting booking request"
    );
    throw error;
  }
};

const fetchAllMyBookings = async ({ pageParam }: any) => {
  try {
    const data = await API_CLIENT.makeGetRequest(
      `/worker/booking/all?page=${pageParam}&limit=10`
    );
    return data?.data;
  } catch (error: any) {
    console.error(
      `[userService] An error occurred while fetching my bookings : `,
      error?.response?.data?.message
    );
    TOAST?.error(
      error?.response?.data?.message ||
        "An error occurred while fetching my bookings"
    );
    throw error;
  }
};

const cancelBooking = async (payload: any) => {
  try {
    const data = await API_CLIENT.makePostRequest(
      "/worker/booking/cancel",
      payload
    );
    return data.data;
  } catch (error: any) {
    console.error(
      `[userService] An error occurred while removing worker after selection : `,
      error?.response?.data?.message
    );
    TOAST?.error(
      error?.response?.data?.message ||
        "An error occurred while removing worker after selection"
    );
    throw error;
  }
};

const fetchAllRecievedTeamRequests = async ({ pageParam }: any) => {
  try {
    const data = await API_CLIENT.makeGetRequest(
      `/worker/team/request/received/all?page=${pageParam}&limit=10`
    );
    return data?.data;
  } catch (error: any) {
    console.error(
      `[userService] An error occurred while fetching recieved requests : `,
      error?.response
    );
    TOAST?.error(
      error?.response?.data?.message ||
        "An error occurred while fetching recieved requests"
    );
    throw error;
  }
};

const acceptTeamRequest = async (payload: any) => {
  try {
    const data = await API_CLIENT.makePostRequest(
      "/worker/team/request/accept",
      payload
    );
    return data.data;
  } catch (error: any) {
    console.error(
      `[userService] An error occurred while accepting joining request : `,
      error?.response?.data?.message
    );
    TOAST?.error(
      error?.response?.data?.message ||
        "An error occurred while accepting joining request"
    );
    throw error;
  }
};

const rejectTeamRequest = async (payload: any) => {
  try {
    const data = await API_CLIENT.makePostRequest(
      "/worker/team/request/reject",
      payload
    );
    TOAST?.success("Request rejected successfully");
    return data.data;
  } catch (error: any) {
    console.error(
      `[userService] An error occurred while rejecting joining request : `,
      error?.response?.data?.message
    );
    TOAST?.error(
      error?.response?.data?.message ||
        "An error occurred while rejecting joining request"
    );
    throw error;
  }
};

const leftTeam = async (payload: any) => {
  try {
    const data = await API_CLIENT.makePostRequest(
      "/worker/team/leave",
      payload
    );
    return data.data;
  } catch (error: any) {
    console.error(
      `[userService] An error occurred while leaving from team : `,
      error?.response?.data?.message
    );
    TOAST?.error(
      error?.response?.data?.message ||
        "An error occurred while leaving from team"
    );
    throw error;
  }
};

const WORKER = {
  applyService,
  unApplyService,
  fetchMyAppliedServices,
  fetchAllBookingReceivedInvitations,
  fetchBookingInvitationsDetails,
  acceptBookingRequest,
  rejectBookingRequest,
  fetchAllMyBookings,
  cancelBooking,
  fetchAllRecievedTeamRequests,
  acceptTeamRequest,
  rejectTeamRequest,
  leftTeam,
};

export default WORKER;
