import API_CLIENT from ".";
import TOAST from "@/app/hooks/toast";
import { t } from "@/utils/translationHelper";
import { getUserIdFromToken } from "@/utils/authStorage";

const getUserInfo = async () => {
  try {
    const response = await API_CLIENT.makeGetRequest(`/user/info`);
    return response?.data;
  } catch (error: any) {
    console.error(
      `[Users] [userService] An error occurred while refreshing user details  : `,
      error,
    );
    TOAST?.error(
      error?.response?.data?.message ||
        "An error occurred while getting user details",
    );
    throw error;
  }
};

const formDataHasField = (formData: FormData, key: string): boolean => {
  const parts = (formData as { _parts?: [string, unknown][] })._parts;
  if (!Array.isArray(parts)) return false;
  return parts.some(([fieldKey]) => fieldKey === key);
};

const formDataHasProfileImage = (formData: FormData): boolean => {
  const parts = (formData as { _parts?: [string, unknown][] })._parts;
  if (!Array.isArray(parts)) return false;
  return parts.some(([key, value]) => {
    if (key !== "profileImage") return false;
    return (
      value != null &&
      typeof value === "object" &&
      "uri" in value &&
      typeof (value as { uri?: unknown }).uri === "string"
    );
  });
};

const withAuthenticatedUserId = async (payload: Record<string, unknown>) => {
  if (payload._id) return payload;
  const userId = await getUserIdFromToken();
  return userId ? { ...payload, _id: userId } : payload;
};

const formDataToPlainObject = (formData: FormData): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  const parts = (formData as { _parts?: [string, unknown][] })._parts;
  if (!Array.isArray(parts)) return result;

  for (const [key, value] of parts) {
    if (value == null) continue;
    if (typeof value === "string") {
      result[key] = value;
    }
  }
  return result;
};

const updateUserById = async (payload: any) => {
  try {
    const isFormData =
      typeof FormData !== "undefined" && payload instanceof FormData;

    // Role/locale/name updates: JSON PATCH (backend skips multer for non-multipart).
    // Profile photo: multipart FormData with a file part.
    if (isFormData && formDataHasProfileImage(payload)) {
      const userId = await getUserIdFromToken();
      if (userId && !formDataHasField(payload, "_id")) {
        payload.append("_id", userId);
      }
      return await API_CLIENT.makePatchRequestFormData(`/user/info`, payload);
    }

    const body = await withAuthenticatedUserId(
      isFormData ? formDataToPlainObject(payload) : (payload ?? {}),
    );
    return await API_CLIENT.makePatchRequest(`/user/info`, body);
  } catch (error: any) {
    console.error(
      `[userService] An error occurred while updating user : `,
      error?.response?.data,
    );
    TOAST?.error(
      error?.response?.data?.message || "An error occurred while updating user",
    );
    throw error;
  }
};

const updateSkills = async (payload: any) => {
  try {
    const data = await API_CLIENT.makePostRequest("/user/add-skill", payload);
    return data.data;
  } catch (error: any) {
    console.error(
      `[userService] An error occurred while adding skills in the worker : `,
      error?.response?.data?.message,
    );
    TOAST?.error(
      error?.response?.data?.message ||
        "An error occurred while adding skills in the worker",
    );
    throw error;
  }
};

const removeSkill = async (payload: any) => {
  try {
    const data = await API_CLIENT.makePostRequest(
      "/user/remove-skill",
      payload,
    );
    return data.data;
  } catch (error: any) {
    console.error(
      `[userService] An error occurred while remove skill from the user profile : `,
      error?.response?.data?.message,
    );
    TOAST?.error(
      error?.response?.data?.message ||
        "An error occurred while remove skill from the user profile",
    );
    throw error;
  }
};

const disableAccount = async () => {
  try {
    const data = await API_CLIENT.makeDeleteRequest(`/user/disable-account`);
    return data;
  } catch (error: any) {
    console.log(`An error occured while disabling account : `, error);
    TOAST?.error(
      error?.response?.data?.message ||
        "An error occurred while disabling account",
    );
    throw error;
  }
};

const deleteAccount = async () => {
  try {
    const data = await API_CLIENT.makeDeleteRequest(`/user/delete-account`);
    return data;
  } catch (error: any) {
    console.log(`An error occured while deleting account : `, error);
    TOAST?.error(
      error?.response?.data?.message ||
        "An error occurred while deleting account",
    );
    throw error;
  }
};

const enableAccount = async () => {
  try {
    const data = await API_CLIENT.makePatchRequest(`/user/enable-account`);
    return data;
  } catch (error: any) {
    console.log(
      `[Forget Password] [userService] An error occured while enabling account : `,
      error,
    );
    TOAST?.error(
      error?.response?.data?.message ||
        "An error occurred while enabling account",
    );
    throw error;
  }
};

const fetchAllUsers = async ({
  pageParam,
  payload,
  /** Backend supports WORKER | MEDIATOR | EMPLOYER; default preserves existing callers. */
  role = "WORKER",
}: any) => {
  try {
    const data = await API_CLIENT.makePostRequest(
      `/user/all?role=${role}&page=${pageParam}&limit=10`,
      payload,
    );
    return data.data;
  } catch (error: any) {
    console.error(
      `[userService] An error occurred while fetching users : `,
      error?.response?.data?.message,
    );
    TOAST?.error(
      error?.response?.data?.message ||
        "An error occurred while fetching users",
    );
    throw error;
  }
};

const getUserDetails = async (id: any) => {
  try {
    const response = await API_CLIENT.makeGetRequest(`/user/detail/${id}`);
    return response?.data;
  } catch (error: any) {
    console.error(
      `[Users] [userService] An error occurred while fetching user details : `,
      error,
    );
    TOAST?.error(
      error?.response?.data?.message ||
        "An error occurred while getting user details",
    );
    throw error;
  }
};

const likeUser = async (payload: any) => {
  try {
    const data = await API_CLIENT.makePostRequest(
      `/user/like/${payload?.userId}`,
    );
    return data.data;
  } catch (error: any) {
    console.error(
      `[userService] An error occurred while liking user : `,
      error?.response?.data?.message,
    );
    TOAST?.error(
      error?.response?.data?.message || "An error occurred while liking user",
    );
    throw error;
  }
};

const unlikeUser = async ({ userId }: any) => {
  try {
    const data = await API_CLIENT.makeDeleteRequest(`/user/unlike/${userId}`);
    return data.data;
  } catch (error: any) {
    console.error(
      `[userService] An error occurred while unliking user : `,
      error?.response?.data?.message,
    );
    TOAST?.error(
      error?.response?.data?.message || "An error occurred while unliking user",
    );
    throw error;
  }
};

const fetchAllLikedUsers = async ({ pageParam, skill }: any) => {
  console.log("all liked users --", pageParam, skill);

  try {
    const data = await API_CLIENT.makeGetRequest(
      `/user/all-liked?skill=${skill}&page=${pageParam}&limit=10`,
    );
    return data?.data;
  } catch (error: any) {
    console.error(
      `[userService] An error occurred while fetching liked users : `,
      error?.response?.data?.message,
    );
    TOAST?.error(
      error?.response?.data?.message ||
        "An error occurred while fetching liked users",
    );
    throw error;
  }
};

const likeService = async (payload: any) => {
  try {
    const data = await API_CLIENT.makePostRequest(
      "/user/like-service",
      payload,
    );
    return data.data;
  } catch (error: any) {
    console.error(
      `[userService] An error occurred while liking service : `,
      error?.response?.data?.message,
    );
    TOAST?.error(
      error?.response?.data?.message ||
        "An error occurred while liking services",
    );
    throw error;
  }
};

const unLikeService = async (payload: any) => {
  try {
    const data = await API_CLIENT.makePostRequest(
      "/user/unlike-service",
      payload,
    );
    return data.data;
  } catch (error: any) {
    console.error(
      `[userService] An error occurred while unliking service : `,
      error?.response?.data?.message,
    );
    TOAST?.error(
      error?.response?.data?.message ||
        "An error occurred while fetching services",
    );
    throw error;
  }
};

const fetchAllLikedServices = async ({ pageParam }: any) => {
  try {
    const data = await API_CLIENT.makeGetRequest(
      `/user/all-liked-services?page${pageParam}&limit=10`,
    );
    return data?.data;
  } catch (error: any) {
    console.error(
      `[userService] An error occurred while fetching services : `,
      error?.response?.data?.message,
    );
    TOAST?.error(
      error?.response?.data?.message ||
        "An error occurred while fetching services",
    );
    throw error;
  }
};

const addAppFeedback = async (payload: any) => {
  try {
    const data = await API_CLIENT.makePostRequest("/feedback/submit", payload);
    TOAST?.success(t("feedbackSubmittedSuccessfully"));
    return data;
  } catch (error: any) {
    console.error(
      `[userService] An error occurred while adding app feedback : `,
      error?.response?.data?.data?.errors,
    );
    TOAST?.error(
      error?.response?.data?.message ||
        "An error occurred while adding app feedback",
    );
    throw error;
  }
};

const USER = {
  getUserInfo,
  updateUserById,
  updateSkills,
  removeSkill,
  deleteAccount,
  disableAccount,
  enableAccount,
  fetchAllUsers,
  getUserDetails,
  likeUser,
  unlikeUser,
  fetchAllLikedUsers,
  likeService,
  unLikeService,
  fetchAllLikedServices,
  addAppFeedback,
};

export default USER;
