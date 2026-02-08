import fp from "fastify-plugin";
import type { FastifyInstance, FastifyError } from "fastify";

export default fp(async (fastify: FastifyInstance) => {
  fastify.setErrorHandler((error: FastifyError, _request, reply) => {
    fastify.log.error(error);

    const statusCode = error.statusCode ?? 500;

    const response: { code: string; message: string; details?: unknown } = {
      code: error.code ?? "INTERNAL_ERROR",
      message:
        statusCode >= 500
          ? "Internal server error"
          : error.message || "An error occurred",
    };

    if (statusCode < 500 && error.validation) {
      response.details = error.validation;
    }

    reply.status(statusCode).send(response);
  });
});
