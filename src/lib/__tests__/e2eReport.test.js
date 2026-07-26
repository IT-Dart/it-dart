import { describe, it, expect, vi } from "vitest";
import { createJsPdfMock } from "./jspdfMock.js";

vi.mock("../supabaseClient.js", () => ({ supabase: {} }));

const { jsPDF, instances } = createJsPdfMock();
vi.mock("jspdf", () => ({ jsPDF }));

const { generateE2EReport } = await import("../e2eReport.js");

describe("generateE2EReport", () => {
  it("handles a fully populated run without throwing", async () => {
    await expect(generateE2EReport({
      id: 1,
      created_at: "2026-07-20T10:00:00Z",
      report: {
        summary: { total: 3, ok: 2, error: 1 },
        findings: [{ symptom: "Login schlägt fehl", status: "FEHLER" }],
        results_by_role: [{ role: "Admin", status: "OK" }],
        incidents: [{ title: "Timeout beim Speichern" }],
        open_items: [{ title: "Rate-Limit noch nicht getestet" }],
        test_accounts: [{ email: "test@it-dart.de", role: "Trainer" }],
      },
    })).resolves.toBeUndefined();
  });

  it("doesn't throw when report is entirely missing", async () => {
    await expect(generateE2EReport({ id: 2, created_at: null })).resolves.toBeUndefined();
  });

  it("doesn't throw when array fields are the wrong shape", async () => {
    await expect(generateE2EReport({
      id: 3,
      report: { findings: null, results_by_role: "nope", incidents: undefined, open_items: 5, test_accounts: {} },
    })).resolves.toBeUndefined();
    expect(instances.length).toBeGreaterThan(0);
  });
});
