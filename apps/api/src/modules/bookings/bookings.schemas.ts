import { z } from "zod";

export const createBookingBodySchema = z.object({
  sessionId: z.string().uuid(),
});

export type CreateBookingBody = z.infer<typeof createBookingBodySchema>;
