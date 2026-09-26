import API_CLIENT from ".";
import TOAST from "@/app/hooks/toast";
import {
  getApiErrorMessage,
  isTransientApiError,
  logApiCatch,
} from "@/utils/apiError";

const handleServiceError = (error: unknown, operation: string) => {
  logApiCatch(`[ServiceAPI] ${operation} failed`, error);
  if (!isTransientApiError(error)) {
    TOAST?.error(getApiErrorMessage(error, `Failed to ${operation}`));
  }
  throw error;
};

const getServiceById = async (id: any) => {
  try {
    const { data } = await API_CLIENT.makeGetRequest(
      `/service/service-info/${id}`
    );
    return data;
  } catch (error: unknown) {
    logApiCatch("[ServiceAPI] fetch service details failed", error);
    if (!isTransientApiError(error)) {
      TOAST?.error(
        getApiErrorMessage(error, "An error occurred while fetching service details"),
      );
    }
    throw error;
  }
};

const fetchAllServices = async ({ pageParam, status, payload }: any) => {
  try {
    const data = await API_CLIENT.makePostRequest(
      `/service/all?status=${status}&page=${pageParam}&limit=10`,
      payload
    );
    return data.data;
  } catch (error: any) {
    handleServiceError(error, "fetch services");
  }
};

/** Cities that currently have browsable work, for the listing city dropdown. */
const fetchServiceCities = async (skill = "") => {
  try {
    const query = skill ? `?skill=${encodeURIComponent(skill)}` : "";
    const response = await API_CLIENT.makeGetRequest(`/service/cities${query}`);
    return response?.data?.data ?? [];
  } catch (error: unknown) {
    logApiCatch("[ServiceAPI] fetch service cities failed", error);
    return [];
  }
};

/** Official worker skills required on browsable work, for the listing skill dropdown. */
const fetchServiceSkills = async (city = "") => {
  try {
    const query = city ? `?city=${encodeURIComponent(city)}` : "";
    const response = await API_CLIENT.makeGetRequest(`/service/skills${query}`);
    return response?.data?.data ?? [];
  } catch (error: unknown) {
    logApiCatch("[ServiceAPI] fetch service skills failed", error);
    return [];
  }
};

const fetchServiceCategories = async () => {
  try {
    const data = await API_CLIENT.makeGetRequest("/service/categories");
    return data.data;
  } catch (error: any) {
    handleServiceError(error, "fetch service categories");
  }
};

const fetchMyAppliedWorkers = async ({ pageParam, serviceId }: any) => {
  try {
    const data = await API_CLIENT.makeGetRequest(
      `/service/${serviceId}/applied/users?page=${pageParam}&limit=10`
    );
    return data.data;
  } catch (error: unknown) {
    logApiCatch("[ServiceAPI] fetch applied workers failed", error);
    if (!isTransientApiError(error)) {
      TOAST?.error(
        getApiErrorMessage(error, "An error occurred while fetching all applied workers"),
      );
    }
    throw error;
  }
};

const fetchSelectedWorkers = async ({ pageParam, serviceId }: any) => {
  try {
    const data = await API_CLIENT.makeGetRequest(
      `/service/${serviceId}/selected/users?page=${pageParam}&limit=10`
    );
    return data.data;
  } catch (error: unknown) {
    logApiCatch("[ServiceAPI] fetch selected workers failed", error);
    if (!isTransientApiError(error)) {
      TOAST?.error(
        getApiErrorMessage(
          error,
          "An error occurred while fetching selected workers of service",
        ),
      );
    }
    throw error;
  }
};

const fetchAllVillages = async (payload: any) => {
  try {
    const data = await API_CLIENT.makePostRequest(`/service/villages`, payload);
    return data.data;
  } catch (error: unknown) {
    logApiCatch("[ServiceAPI] fetch villages failed", error);
    throw error;
  }
};

const SERVICE = {
  fetchAllServices,
  fetchServiceCategories,
  fetchServiceCities,
  fetchServiceSkills,
  getServiceById,
  fetchMyAppliedWorkers,
  fetchSelectedWorkers,
  fetchAllVillages,
};

export default SERVICE;
