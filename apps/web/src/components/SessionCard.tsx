import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SessionWithCount } from "../api/sessions";
import { createBooking } from "../api/bookings";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "./ErrorMessage";
import { isBugEnabled } from "../config/bug-flags";

export default function SessionCard({
  session,
}: {
  session: SessionWithCount;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => createBooking(session.id),
    onSuccess: () => {
      // BUG: VITE_BUG_CACHE_STALE — skip query invalidation, stale free-seat count stays on screen
      if (!isBugEnabled("VITE_BUG_CACHE_STALE")) {
        queryClient.invalidateQueries({
          queryKey: ["sessions", session.courseId],
        });
      }
    },
  });

  const free = session.capacity - session._count.bookings;

  // BUG: VITE_BUG_TIMEZONE_SHIFT — adds +1 hour to displayed session times
  const timeShift = isBugEnabled("VITE_BUG_TIMEZONE_SHIFT") ? 3600000 : 0;
  const startsAt = new Date(new Date(session.startsAt).getTime() + timeShift);
  const endsAt = new Date(new Date(session.endsAt).getTime() + timeShift);

  // BUG: VITE_BUG_UI_DOUBLE_SUBMIT — button never disabled, allowing rapid double-clicks
  const isButtonDisabled = isBugEnabled("VITE_BUG_UI_DOUBLE_SUBMIT")
    ? free <= 0
    : mutation.isPending || free <= 0;

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
      <div>
        <p className="text-sm font-medium text-gray-900">
          {startsAt.toLocaleDateString("pl-PL")}
          {" \u00B7 "}
          {startsAt.toLocaleTimeString("pl-PL", {
            hour: "2-digit",
            minute: "2-digit",
          })}
          {" \u2013 "}
          {endsAt.toLocaleTimeString("pl-PL", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <p className="text-xs text-gray-500">
          {free}/{session.capacity} available
        </p>
      </div>

      <div className="flex items-center gap-2">
        {mutation.error && (
          <span className="text-xs text-red-600">
            {getErrorMessage(mutation.error)}
          </span>
        )}
        {mutation.isSuccess ? (
          <span className="text-xs font-medium text-green-600">Booked!</span>
        ) : (
          user && (
            <button
              onClick={() => mutation.mutate()}
              disabled={isButtonDisabled}
              className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending ? "..." : "Book"}
            </button>
          )
        )}
      </div>
    </div>
  );
}
