import type { FastifyInstance } from "fastify";
import { listBugsHandler, debugFlagsHandler } from "./internal.handlers.js";

export default async function internalRoutes(fastify: FastifyInstance) {
  fastify.get("/internal/bugs", {
    onRequest: [fastify.authenticate],
    handler: listBugsHandler,
  });

  fastify.get("/__debug/flags", debugFlagsHandler);
}
