import { useQuery } from "@tanstack/react-query";
import { getSessions } from "../api/sessions";
import SessionCard from "./SessionCard";

export default function SessionList({ courseId }: { courseId: string }) {
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["sessions", courseId],
    queryFn: () => getSessions(courseId),
  });

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading sessions...</p>;
  }

  if (!sessions?.length) {
    return <p className="text-sm text-gray-500">No sessions available.</p>;
  }

  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <SessionCard key={s.id} session={s} />
      ))}
    </div>
  );
}
