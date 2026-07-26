import { describe, it, expect, vi, beforeEach } from "vitest";
import { createJsPdfMock } from "./jspdfMock.js";

const insertMock = vi.fn(() => Promise.resolve({ data: null, error: null }));
const fromMock = vi.fn(() => ({ insert: insertMock }));
vi.mock("../supabaseClient.js", () => ({ supabase: { from: fromMock } }));

const { jsPDF } = createJsPdfMock();
vi.mock("jspdf", () => ({ jsPDF }));

const { zoneForPercent, seededAngleDeg, blendRGB, logLernnachweis, generateLernnachweis } = await import("../lernnachweis.js");

describe("zoneForPercent", () => {
  it("maps the documented boundaries to the right zone", () => {
    expect(zoneForPercent(100).key).toBe("bullseye");
    expect(zoneForPercent(95).key).toBe("bullseye");
    expect(zoneForPercent(94).key).toBe("hervorragend");
    expect(zoneForPercent(85).key).toBe("hervorragend");
    expect(zoneForPercent(84).key).toBe("gut");
    expect(zoneForPercent(70).key).toBe("gut");
    expect(zoneForPercent(69).key).toBe("besser");
    expect(zoneForPercent(50).key).toBe("besser");
    expect(zoneForPercent(49).key).toBe("fehlwurf");
    expect(zoneForPercent(0).key).toBe("fehlwurf");
  });
});

describe("seededAngleDeg", () => {
  it("is deterministic for the same score/total", () => {
    expect(seededAngleDeg(8, 10)).toBe(seededAngleDeg(8, 10));
  });

  it("always returns a value in [0, 360)", () => {
    for (const [score, total] of [[0, 0], [10, 10], [3, 7], [100, 100], [1, 1000]]) {
      const angle = seededAngleDeg(score, total);
      expect(angle).toBeGreaterThanOrEqual(0);
      expect(angle).toBeLessThan(360);
    }
  });
});

describe("blendRGB", () => {
  it("returns the first color at t=0 and the second at t=1", () => {
    const a = [10, 20, 30], b = [110, 120, 130];
    expect(blendRGB(a, b, 0)).toEqual(a);
    expect(blendRGB(a, b, 1)).toEqual(b);
  });

  it("returns the midpoint at t=0.5", () => {
    expect(blendRGB([0, 0, 0], [100, 200, 40], 0.5)).toEqual([50, 100, 20]);
  });
});

describe("logLernnachweis", () => {
  beforeEach(() => { insertMock.mockClear(); fromMock.mockClear(); });

  it("does nothing without a user", () => {
    const result = logLernnachweis({ user: null, kind: "quiz", score: 5, total: 10 });
    expect(result).toBeUndefined();
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("computes percent and badge, and inserts into lernnachweise", () => {
    logLernnachweis({ user: { id: "u1" }, kind: "quiz", title: "Modul G", score: 9, total: 10, topics: ["a"] });
    expect(fromMock).toHaveBeenCalledWith("lernnachweise");
    const row = insertMock.mock.calls[0][0];
    expect(row.user_id).toBe("u1");
    expect(row.percent).toBe(90);
    expect(row.badge).toBe("hervorragend");
  });

  it("doesn't divide by zero when total is 0", () => {
    logLernnachweis({ user: { id: "u1" }, kind: "quiz", score: 0, total: 0 });
    const row = insertMock.mock.calls[0][0];
    expect(row.percent).toBe(0);
    expect(row.badge).toBe("fehlwurf");
  });
});

describe("generateLernnachweis", () => {
  it("doesn't throw for a normal result, with or without topics", async () => {
    await expect(generateLernnachweis({ user: { id: "u1" }, kind: "quiz", title: "Modul G", score: 8, total: 10, skipLog: true })).resolves.toBeUndefined();
    await expect(generateLernnachweis({ user: { id: "u1" }, kind: "quiz", title: "Modul G", score: 8, total: 10, topics: undefined, skipLog: true })).resolves.toBeUndefined();
  });
});
