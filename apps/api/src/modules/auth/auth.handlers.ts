import bcrypt from "bcrypt";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { loginBodySchema, type LoginBody } from "./auth.schemas.js";
import { isBugEnabled } from "../../lib/bug-flags.js";

export async function loginHandler(
  this: FastifyInstance,
  request: FastifyRequest<{ Body: LoginBody }>,
  reply: FastifyReply,
) {
  const { email, password } = loginBodySchema.parse(request.body);

  const user = await this.prisma.user.findUnique({ where: { email } });

  if (!user) {
    // BUG: BUG_AUTH_WRONG_STATUS — returns 500 instead of 401 on invalid credentials
    const status = isBugEnabled("BUG_AUTH_WRONG_STATUS") ? 500 : 401;
    return reply.code(status).send({
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password",
    });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    // BUG: BUG_AUTH_WRONG_STATUS — returns 500 instead of 401 on invalid credentials
    const status = isBugEnabled("BUG_AUTH_WRONG_STATUS") ? 500 : 401;
    return reply.code(status).send({
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password",
    });
  }

  const token = this.jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    { expiresIn: "8h" },
  );

  return reply.send({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}

export async function meHandler(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { userId } = request.user;

  const user = await this.prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return reply.code(404).send({
      code: "USER_NOT_FOUND",
      message: "User not found",
    });
  }

  return reply.send({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
}
