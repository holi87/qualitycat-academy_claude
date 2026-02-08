import type { FastifyInstance } from "fastify";
import {
  listSessionsHandler,
  createSessionHandler,
} from "./sessions.handlers.js";

export default async function sessionsRoutes(fastify: FastifyInstance) {
  fastify.get("/sessions", listSessionsHandler);

  fastify.post("/sessions", {
    onRequest: [fastify.authenticate],
    handler: createSessionHandler,
  });
}
