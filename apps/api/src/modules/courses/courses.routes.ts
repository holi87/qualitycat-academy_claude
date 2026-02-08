import type { FastifyInstance } from "fastify";
import {
  listCoursesHandler,
  getCourseHandler,
  createCourseHandler,
} from "./courses.handlers.js";

export default async function coursesRoutes(fastify: FastifyInstance) {
  fastify.get("/courses", listCoursesHandler);

  fastify.get("/courses/:id", getCourseHandler);

  fastify.post("/courses", {
    onRequest: [fastify.authenticate],
    handler: createCourseHandler,
  });
}
