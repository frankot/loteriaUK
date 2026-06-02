/**
 * Max tickets a user can buy in a single transaction.
 * Override via NEXT_PUBLIC_MAX_TICKETS_PER_TRANSACTION env var (client+server safe).
 * Falls back to 50.
 */
export const MAX_TICKETS_PER_TRANSACTION = Math.max(
  1,
  parseInt(process.env.NEXT_PUBLIC_MAX_TICKETS_PER_TRANSACTION || "50", 10) || 50
);
