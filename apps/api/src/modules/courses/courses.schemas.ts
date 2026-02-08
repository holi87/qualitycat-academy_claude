import { z } from "zod";

export const coursesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
});

export type CoursesQuery = z.infer<typeof coursesQuerySchema>;

export const courseParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CourseParams = z.infer<typeof courseParamsSchema>;

export const createCourseBodySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
});

export type CreateCourseBody = z.infer<typeof createCourseBodySchema>;
