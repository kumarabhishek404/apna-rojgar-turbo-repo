export const USER_ROLE = {
  JOB_SEEKER: "job_seeker",
  EMPLOYER: "employer",
  ADMIN: "admin",
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];
