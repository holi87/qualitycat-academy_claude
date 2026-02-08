import crypto from "node:crypto";
import Fastify from "fastify";
import jwt from "@fastify/jwt";
import sensible from "@fastify/sensible";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { loadEnv } from "./config/env.js";
import corsPlugin from "./plugins/cors.js";
import prismaPlugin from "./plugins/prisma.js";
import authPlugin from "./plugins/auth.js";
import errorHandler from "./plugins/error-handler.js";
import authRoutes from "./modules/auth/auth.routes.js";
import coursesRoutes from "./modules/courses/courses.routes.js";
import sessionsRoutes from "./modules/sessions/sessions.routes.js";
import bookingsRoutes from "./modules/bookings/bookings.routes.js";
import internalRoutes from "./modules/internal/internal.routes.js";

export async function buildApp(options?: { logger?: boolean }) {
  const env = loadEnv();
  const app = Fastify({ logger: options?.logger ?? true });

  // --- x-request-id ---
  app.addHook("onRequest", async (request, reply) => {
    const requestId = crypto.randomUUID();
    request.id = requestId;
    reply.header("x-request-id", requestId);
  });

  // --- Plugins ---
  await app.register(corsPlugin);
  await app.register(sensible);
  await app.register(jwt, { secret: env.JWT_SECRET });
  await app.register(prismaPlugin);
  await app.register(authPlugin);
  await app.register(errorHandler);

  // --- Swagger ---
  await app.register(swagger, {
    openapi: {
      info: {
        title: "QualityCat Academy API",
        version: "1.0.0",
        description: "API for the QualityCat Academy training platform",
      },
    },
  });
  await app.register(swaggerUi, { routePrefix: "/docs" });

  // --- Routes ---
  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

  await app.register(authRoutes);
  await app.register(coursesRoutes);
  await app.register(sessionsRoutes);
  await app.register(bookingsRoutes);
  await app.register(internalRoutes);

  return app;
}
