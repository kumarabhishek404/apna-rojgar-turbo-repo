import { notifyAdminsOfError } from "./notifyAdmins.js";

/**
 * Backwards-compatible wrapper — notifies all admins on new error logs.
 */
const notifyAdminOnError = async (payload) => notifyAdminsOfError(payload);

export default notifyAdminOnError;
