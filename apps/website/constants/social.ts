/**
 * Public profile URLs for the right social rail.
 * Set NEXT_PUBLIC_SOCIAL_* and optionally NEXT_PUBLIC_PLAY_STORE_URL in .env.local.
 */
export const SOCIAL_NAV_ITEMS = [
  {
    id: "instagram",
    label: "Instagram",
    href: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL ?? "https://www.instagram.com/",
  },
  {
    id: "facebook",
    label: "Facebook",
    href: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK_URL ?? "https://www.facebook.com/",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    href: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN_URL ?? "https://www.linkedin.com/",
  },
  {
    id: "youtube",
    label: "YouTube",
    href: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE_URL ?? "https://www.youtube.com/",
  },
  {
    id: "threads",
    label: "Threads",
    href: process.env.NEXT_PUBLIC_SOCIAL_THREADS_URL ?? "https://www.threads.net/",
  },
  {
    id: "playstore",
    label: "Get the app on Google Play",
    href:
      process.env.NEXT_PUBLIC_PLAY_STORE_URL ??
      "https://play.google.com/store/apps/details?id=com.kumarabhishek404.labourapp",
  },
] as const;
