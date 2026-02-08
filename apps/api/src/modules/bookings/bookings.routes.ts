import type { FastifyInstance } from "fastify";
import {
  createBookingHandler,
  myBookingsHandler,
} from "./bookings.handlers.js";

export default async function bookingsRoutes(fastify: FastifyInstance) {
  fastify.post("/bookings", {
    onRequest: [fastify.authenticate],
    handler: createBookingHandler,
  });

  fastify.get("/bookings/mine", {
    onRequest: [fastify.authenticate],
    handler: myBookingsHandler,
  });
}
