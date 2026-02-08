import client from "./client";

export interface SessionWithCount {
  id: string;
  courseId: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  createdAt: string;
  updatedAt: string;
  course: { title: string };
  _count: { bookings: number };
}

export async function getSessions(
  courseId: string,
  from?: string,
  to?: string,
): Promise<SessionWithCount[]> {
  const params: Record<string, string> = { courseId };
  if (from) params.from = from;
  if (to) params.to = to;
  const { data } = await client.get<SessionWithCount[]>("/sessions", {
    params,
  });
  return data;
}
