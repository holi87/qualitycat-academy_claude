import fp from "fastify-plugin";
import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";
import { isBugEnabled } from "../lib/bug-flags.js";

export default fp(async (fastify: FastifyInstance) => {
  const origin = process.env.CORS_ORIGIN || "http://localhost:5173";

  // BUG: BUG_CORS_MISCONFIG — omits "Authorization" from allowedHeaders, blocking JWT preflight requests
  await fastify.register(cors, {
    origin,
    allowedHeaders: isBugEnabled("BUG_CORS_MISCONFIG")
      ? ["Content-Type"]
      : ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });
});
