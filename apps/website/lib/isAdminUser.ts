type CandidateUser = {
  role?: string | null;
  mobile?: string | number | null;
};

const ADMIN_MOBILE_FALLBACK = "6397308499";

export function isAdminUser(user?: CandidateUser | null): boolean {
  if (!user) return false;
  console.log("user----", user);
  
  if (String(user.role || "").toUpperCase() === "ADMIN") return true;

  const adminMobile =
    process.env.NEXT_PUBLIC_ADMIN_MOBILE?.trim() || ADMIN_MOBILE_FALLBACK;
  return String(user.mobile || "").trim() === adminMobile;
}

