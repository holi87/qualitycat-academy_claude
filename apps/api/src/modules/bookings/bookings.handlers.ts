import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  createBookingBodySchema,
  type CreateBookingBody,
} from "./bookings.schemas.js";
import { isBugEnabled } from "../../lib/bug-flags.js";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function createBookingHandler(
  this: FastifyInstance,
  request: FastifyRequest<{ Body: CreateBookingBody }>,
  reply: FastifyReply,
) {
  const { userId } = request.user;
  const { sessionId } = createBookingBodySchema.parse(request.body);

  // 1. Check session exists
  const session = await this.prisma.session.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return reply.code(404).send({
      code: "SESSION_NOT_FOUND",
      message: "Session not found",
    });
  }

  // BUG: BUG_BOOKINGS_PAST_ALLOWED — skips past-date validation, allowing bookings on past sessions
  if (!isBugEnabled("BUG_BOOKINGS_PAST_ALLOWED")) {
    if (session.startsAt <= new Date()) {
      return reply.code(400).send({
        code: "SESSION_IN_PAST",
        message: "Cannot book a session that has already started",
      });
    }
  }

  // 2. Check capacity
  const confirmedCount = await this.prisma.booking.count({
    where: { sessionId, status: "CONFIRMED" },
  });

  if (confirmedCount >= session.capacity) {
    return reply.code(409).send({
      code: "SESSION_FULL",
      message: "Session has reached maximum capacity",
    });
  }

  // BUG: BUG_BOOKINGS_RACE — artificial 200ms delay between capacity check and insert enables race condition
  if (isBugEnabled("BUG_BOOKINGS_RACE")) {
    await sleep(200);
  }

  // 3. Check duplicate
  const existing = await this.prisma.booking.findUnique({
    where: { sessionId_userId: { sessionId, userId } },
  });

  if (existing) {
    return reply.code(409).send({
      code: "ALREADY_BOOKED",
      message: "You have already booked this session",
    });
  }

  // 4. Create booking
  const booking = await this.prisma.booking.create({
    data: {
      sessionId,
      userId,
      status: "CONFIRMED",
    },
  });

  // 5. Return 201
  return reply.code(201).send(booking);
}

export async function myBookingsHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  // BUG: BUG_BOOKINGS_LEAK — returns ALL bookings instead of filtering by authenticated user
  const where = isBugEnabled("BUG_BOOKINGS_LEAK")
    ? {}
    : { userId: request.user.userId };

  const bookings = await this.prisma.booking.findMany({
    where,
    include: {
      session: {
        include: {
          course: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return reply.send(bookings);
}
