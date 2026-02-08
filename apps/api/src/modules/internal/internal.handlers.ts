import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { BUGS_CATALOG } from "./bugs-catalog.js";
import { isBugEnabled, getAllBugFlags } from "../../lib/bug-flags.js";

export async function listBugsHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { role } = request.user;

  if (role !== "TRAINER") {
    return reply.code(403).send({
      code: "FORBIDDEN",
      message: "Only TRAINER can access bug catalog",
    });
  }

  const bugs = BUGS_CATALOG.map((bug) => ({
    ...bug,
    active: isBugEnabled(bug.flag),
  }));

  return reply.send({ bugs });
}

export async function debugFlagsHandler(
  this: FastifyInstance,
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  if (process.env.BUGS !== "on") {
    return reply.code(404).send({
      code: "NOT_FOUND",
      message: "Not found",
    });
  }

  return reply.send(getAllBugFlags());
}
