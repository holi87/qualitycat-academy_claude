/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_BUGS: string;
  // Backend bug flags (mirrored)
  readonly VITE_BUG_CORS_MISCONFIG: string;
  readonly VITE_BUG_AUTH_WRONG_STATUS: string;
  readonly VITE_BUG_PAGINATION_MIXED_BASE: string;
  readonly VITE_BUG_NPLUS1_COURSES: string;
  readonly VITE_BUG_BOOKINGS_PAST_ALLOWED: string;
  readonly VITE_BUG_BOOKINGS_RACE: string;
  readonly VITE_BUG_BOOKINGS_LEAK: string;
  // Frontend bug flags
  readonly VITE_BUG_UI_DOUBLE_SUBMIT: string;
  readonly VITE_BUG_CACHE_STALE: string;
  readonly VITE_BUG_TIMEZONE_SHIFT: string;
  readonly VITE_BUG_ERROR_MESSAGE: string;
  readonly VITE_BUG_FORM_VALIDATION: string;
  readonly VITE_BUG_XSS_DESCRIPTION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8081";
