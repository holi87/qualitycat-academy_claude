import type { FastifyInstance } from "fastify";
import { loginHandler, meHandler } from "./auth.handlers.js";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/auth/login", loginHandler);

  fastify.get("/auth/me", { onRequest: [fastify.authenticate] }, meHandler);
}
