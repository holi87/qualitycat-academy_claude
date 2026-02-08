import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "./helpers.js";

describe("Pagination consistency test", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("pages 1 and 2 should cover all courses without gaps or duplicates", async () => {
    // Get all courses in a single page to know the full set
    const allRes = await app.inject({
      method: "GET",
      url: "/courses?page=1&limit=100",
    });
    const allIds: string[] = allRes
      .json()
      .data.map((c: { id: string }) => c.id);

    expect(allIds.length).toBeGreaterThanOrEqual(4);

    // Get page 1
    const page1Res = await app.inject({
      method: "GET",
      url: "/courses?page=1&limit=2",
    });
    const page1Ids: string[] = page1Res
      .json()
      .data.map((c: { id: string }) => c.id);

    // Get page 2
    const page2Res = await app.inject({
      method: "GET",
      url: "/courses?page=2&limit=2",
    });
    const page2Ids: string[] = page2Res
      .json()
      .data.map((c: { id: string }) => c.id);

    // No duplicates between pages
    const combined = [...page1Ids, ...page2Ids];
    const unique = new Set(combined);
    expect(combined.length).toBe(unique.size);

    // Combined pages should cover all courses (seed has 4, limit=2 × 2 pages = 4)
    expect(combined.sort()).toEqual(allIds.slice(0, 4).sort());
  });
});
