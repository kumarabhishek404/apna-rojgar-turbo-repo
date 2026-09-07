/**
 * Mobile feature toggles. Flip to `true` when ready to ship again.
 */
export const FEATURE_FLAGS = {
  /** Profile "Verify email" → /auth/send-email-code (Gmail SMTP). */
  EMAIL_VERIFICATION: false,
} as const;
