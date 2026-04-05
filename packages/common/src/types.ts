import type { UserRole } from "./constants.js";

export type ApiHealthResponse = {
  ok: true;
  service: string;
  timestamp: string;
};

export type UserProfile = {
  id: string;
  role: UserRole;
};
