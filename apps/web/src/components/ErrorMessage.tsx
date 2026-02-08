import { AxiosError } from "axios";
import { isBugEnabled } from "../config/bug-flags";

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "Nieprawidłowy email lub hasło",
  UNAUTHORIZED: "Sesja wygasła, zaloguj się ponownie",
  FORBIDDEN: "Brak dostępu",
  COURSE_NOT_FOUND: "Kurs nie został znaleziony",
  SESSION_NOT_FOUND: "Sesja nie została znaleziona",
  SESSION_FULL: "Brak wolnych miejsc",
  SESSION_IN_PAST: "Nie można zarezerwować przeszłej sesji",
  ALREADY_BOOKED: "Już masz rezerwację na tę sesję",
  USER_NOT_FOUND: "Użytkownik nie został znaleziony",
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (!error.response) {
      return "Problem z połączeniem";
    }

    const code = error.response.data?.code as string | undefined;
    if (code && ERROR_MESSAGES[code]) {
      return ERROR_MESSAGES[code];
    }

    const status = error.response.status;
    if (status === 401) return "Sesja wygasła, zaloguj się ponownie";
    if (status === 403) return "Brak dostępu";

    // BUG: VITE_BUG_ERROR_MESSAGE — shows "no connection" instead of "server error" for 500
    if (status >= 500) {
      return isBugEnabled("VITE_BUG_ERROR_MESSAGE")
        ? "Problem z połączeniem"
        : "Błąd serwera";
    }

    return error.response.data?.message ?? "Wystąpił błąd";
  }

  return "Wystąpił nieoczekiwany błąd";
}

export default function ErrorMessage({ error }: { error: unknown }) {
  return (
    <div className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
      {getErrorMessage(error)}
    </div>
  );
}
