import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "./helpers.js";

describe("Auth status code test", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /auth/login with wrong password → 401", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "student@qualitycat.dev",
        password: "WrongPassword123!",
      },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json()).toMatchObject({ code: "INVALID_CREDENTIALS" });
  });

  it("POST /auth/login with non-existent email → 401", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "nobody@qualitycat.dev",
        password: "Whatever123!",
      },
    });

    expect(res.statusCode).toBe(401);
  });

  it("POST /auth/login with valid credentials → 200 with token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "student@qualitycat.dev",
        password: "Student123!",
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty("token");
    expect(res.json()).toHaveProperty("user.email", "student@qualitycat.dev");
  });
});
