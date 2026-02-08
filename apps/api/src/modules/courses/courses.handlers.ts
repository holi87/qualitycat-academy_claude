import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  coursesQuerySchema,
  courseParamsSchema,
  createCourseBodySchema,
  type CoursesQuery,
  type CourseParams,
  type CreateCourseBody,
} from "./courses.schemas.js";
import { isBugEnabled } from "../../lib/bug-flags.js";

export async function listCoursesHandler(
  this: FastifyInstance,
  request: FastifyRequest<{ Querystring: CoursesQuery }>,
  reply: FastifyReply,
) {
  const { page, limit, level } = coursesQuerySchema.parse(request.query);

  const where = level ? { level } : {};

  // BUG: BUG_PAGINATION_MIXED_BASE — treats page as 0-based, skipping first results on page 1
  const skip = isBugEnabled("BUG_PAGINATION_MIXED_BASE")
    ? page * limit
    : (page - 1) * limit;

  let data;

  // BUG: BUG_NPLUS1_COURSES — fetches sessions in a loop per course instead of a single query with include
  if (isBugEnabled("BUG_NPLUS1_COURSES")) {
    const courses = await this.prisma.course.findMany({
      where,
      skip,
      take: limit,
      include: { author: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });

    data = [];
    for (const course of courses) {
      const sessions = await this.prisma.session.findMany({
        where: { courseId: course.id },
      });
      data.push({ ...course, sessions });
    }
  } else {
    data = await this.prisma.course.findMany({
      where,
      skip,
      take: limit,
      include: {
        author: { select: { name: true, email: true } },
        sessions: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  const total = await this.prisma.course.count({ where });

  return reply.send({ data, meta: { page, limit, total } });
}

export async function getCourseHandler(
  this: FastifyInstance,
  request: FastifyRequest<{ Params: CourseParams }>,
  reply: FastifyReply,
) {
  const { id } = courseParamsSchema.parse(request.params);

  const course = await this.prisma.course.findUnique({
    where: { id },
    include: {
      author: { select: { name: true, email: true } },
      sessions: true,
    },
  });

  if (!course) {
    return reply.code(404).send({
      code: "COURSE_NOT_FOUND",
      message: "Course not found",
    });
  }

  return reply.send(course);
}

export async function createCourseHandler(
  this: FastifyInstance,
  request: FastifyRequest<{ Body: CreateCourseBody }>,
  reply: FastifyReply,
) {
  const { role, userId } = request.user;

  if (role !== "ADMIN" && role !== "MENTOR") {
    return reply.code(403).send({
      code: "FORBIDDEN",
      message: "Only ADMIN or MENTOR can create courses",
    });
  }

  const body = createCourseBodySchema.parse(request.body);

  const course = await this.prisma.course.create({
    data: {
      title: body.title,
      description: body.description,
      level: body.level,
      createdBy: userId,
    },
  });

  return reply.code(201).send(course);
}
