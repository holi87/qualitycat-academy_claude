import { useQuery } from "@tanstack/react-query";
import { getMyBookings } from "../api/bookings";
import LevelBadge from "../components/LevelBadge";

const statusColors: Record<string, string> = {
  CONFIRMED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-500",
  PENDING: "bg-yellow-100 text-yellow-700",
};

export default function MyBookingsPage() {
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["myBookings"],
    queryFn: getMyBookings,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>

      {isLoading ? (
        <p className="mt-6 text-sm text-gray-500">Loading...</p>
      ) : !bookings?.length ? (
        <p className="mt-6 text-sm text-gray-500">No bookings yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {bookings.map((b) => {
            const startsAt = new Date(b.session.startsAt);
            const endsAt = new Date(b.session.endsAt);
            return (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-5 py-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">
                      {b.session.course.title}
                    </p>
                    <LevelBadge level={b.session.course.level} />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
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
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[b.status] ?? "bg-gray-100 text-gray-700"}`}
                >
                  {b.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
