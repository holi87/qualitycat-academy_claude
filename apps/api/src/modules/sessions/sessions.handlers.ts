import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { Prisma } from "@prisma/client";
import {
  sessionsQuerySchema,
  createSessionBodySchema,
  type SessionsQuery,
  type CreateSessionBody,
} from "./sessions.schemas.js";

export async function listSessionsHandler(
  this: FastifyInstance,
  request: FastifyRequest<{ Querystring: SessionsQuery }>,
  reply: FastifyReply,
) {
  const { courseId, from, to } = sessionsQuerySchema.parse(request.query);

  const where: Prisma.SessionWhereInput = { courseId };

  if (from || to) {
    where.startsAt = {};
    if (from) where.startsAt.gte = from;
    if (to) where.startsAt.lte = to;
  }

  const sessions = await this.prisma.session.findMany({
    where,
    include: {
      course: { select: { title: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: { startsAt: "asc" },
  });

  return reply.send(sessions);
}

export async function createSessionHandler(
  this: FastifyInstance,
  request: FastifyRequest<{ Body: CreateSessionBody }>,
  reply: FastifyReply,
) {
  const { role } = request.user;

  if (role !== "ADMIN" && role !== "MENTOR") {
    return reply.code(403).send({
      code: "FORBIDDEN",
      message: "Only ADMIN or MENTOR can create sessions",
    });
  }

  const body = createSessionBodySchema.parse(request.body);

  const course = await this.prisma.course.findUnique({
    where: { id: body.courseId },
  });

  if (!course) {
    return reply.code(404).send({
      code: "COURSE_NOT_FOUND",
      message: "Course not found",
    });
  }

  const session = await this.prisma.session.create({
    data: {
      courseId: body.courseId,
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      ...(body.capacity != null && { capacity: body.capacity }),
    },
  });

  return reply.code(201).send(session);
}
