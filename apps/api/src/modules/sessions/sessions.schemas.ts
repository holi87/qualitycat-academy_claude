import { z } from "zod";

export const sessionsQuerySchema = z.object({
  courseId: z.string().uuid(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type SessionsQuery = z.infer<typeof sessionsQuerySchema>;

export const createSessionBodySchema = z
  .object({
    courseId: z.string().uuid(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    capacity: z.number().int().min(1).optional(),
  })
  .refine((data) => data.endsAt > data.startsAt, {
    message: "endsAt must be after startsAt",
    path: ["endsAt"],
  });

export type CreateSessionBody = z.infer<typeof createSessionBodySchema>;
