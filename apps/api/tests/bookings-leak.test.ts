import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { buildTestApp, loginAs } from "./helpers.js";

describe("Bookings data leak test", () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;
  let studentBId: string;
  let studentBToken: string;

  beforeAll(async () => {
    app = await buildTestApp();
    prisma = new PrismaClient();

    // Create a second student that has NO bookings
    const studentB = await prisma.user.create({
      data: {
        email: "student-b@qualitycat.dev",
        passwordHash: await bcrypt.hash("StudentB123!", 10),
        name: "Student B",
        role: "STUDENT",
      },
    });
    studentBId = studentB.id;

    studentBToken = await loginAs(
      app,
      "student-b@qualitycat.dev",
      "StudentB123!",
    );
  });

  afterAll(async () => {
    await prisma.booking.deleteMany({ where: { userId: studentBId } });
    await prisma.user.delete({ where: { id: studentBId } });
    await prisma.$disconnect();
    await app.close();
  });

  it("GET /bookings/mine should return only own bookings", async () => {
    // Student B has zero bookings — the response should be empty
    const res = await app.inject({
      method: "GET",
      url: "/bookings/mine",
      headers: { authorization: `Bearer ${studentBToken}` },
    });

    expect(res.statusCode).toBe(200);

    const bookings = res.json();
    expect(bookings).toHaveLength(0);
  });
});
