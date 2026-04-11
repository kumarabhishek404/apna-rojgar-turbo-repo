/**
 * Marketing display offsets for public platform counters only.
 * Real DB totals are still used internally; these values are added before responding
 * to unauthenticated marketing endpoints (e.g. website hero).
 */
export const PUBLIC_STATS_DISPLAY_OFFSET = {
  totalUsers: 1000,
  totalServices: 100,
};
