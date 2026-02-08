const KNOWN_FLAGS = [
  "BUG_AUTH_WRONG_STATUS",
  "BUG_PAGINATION_MIXED_BASE",
  "BUG_NPLUS1_COURSES",
  "BUG_BOOKINGS_PAST_ALLOWED",
  "BUG_BOOKINGS_RACE",
  "BUG_BOOKINGS_LEAK",
  "BUG_CORS_MISCONFIG",
] as const;

export type BugFlag = (typeof KNOWN_FLAGS)[number];

export function isBugEnabled(flagName: string): boolean {
  return process.env.BUGS === "on" && process.env[flagName] === "1";
}

export function getAllBugFlags(): Record<string, boolean> {
  const flags: Record<string, boolean> = {};
  for (const flag of KNOWN_FLAGS) {
    flags[flag] = isBugEnabled(flag);
  }
  return flags;
}
