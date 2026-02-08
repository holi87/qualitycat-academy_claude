import type { FastifyInstance } from "fastify";

export async function buildTestApp(): Promise<FastifyInstance> {
  const { buildApp } = await import("../src/app.js");
  return buildApp({ logger: false });
}

export async function loginAs(
  app: FastifyInstance,
  email: string,
  password: string,
): Promise<string> {
  const res = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: { email, password },
  });
  const body = res.json();
  if (!body.token) {
    throw new Error(
      `Login failed for ${email}: ${res.statusCode} ${JSON.stringify(body)}`,
    );
  }
  return body.token;
}
