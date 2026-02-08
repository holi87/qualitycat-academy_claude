import client from "./client";

export interface Booking {
  id: string;
  sessionId: string;
  userId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  session: {
    id: string;
    courseId: string;
    startsAt: string;
    endsAt: string;
    capacity: number;
    course: {
      id: string;
      title: string;
      level: string;
    };
  };
}

export async function createBooking(sessionId: string) {
  const { data } = await client.post("/bookings", { sessionId });
  return data;
}

export async function getMyBookings(): Promise<Booking[]> {
  const { data } = await client.get<Booking[]>("/bookings/mine");
  return data;
}
