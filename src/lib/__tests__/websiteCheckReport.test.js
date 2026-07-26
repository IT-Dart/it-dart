import { describe, it, expect, vi } from "vitest";
import { createJsPdfMock } from "./jspdfMock.js";

// websiteCheckReport.js imports COL from lernnachweis.js, which imports the
// real Supabase client — mock it out so module load doesn't try to construct
// a client from empty env vars in the test environment.
vi.mock("../supabaseClient.js", () => ({ supabase: {} }));

const { jsPDF, instances } = createJsPdfMock();
vi.mock("jspdf", () => ({ jsPDF }));

const { generateWebsiteCheckReport } = await import("../websiteCheckReport.js");

describe("generateWebsiteCheckReport", () => {
  it("handles a fully populated check without throwing", async () => {
    await expect(generateWebsiteCheckReport({
      id: 1,
      url: "https://it-dart.de",
      created_at: "2026-07-20T10:00:00Z",
      report: {
        target: { final_url: "https://it-dart.de", status_code: 200 },
        summary: { total: 5, ok: 4, warn: 1, error: 0, status: "WARN" },
        checks: [{ category: "SEO", label: "Title-Tag", detail: "vorhanden", status: "OK" }],
        findings: [{ symptom: "Fehlendes Meta-Description", ursache: "kein Tag gesetzt", fix: "Tag ergänzen", status: "WARN" }],
      },
    })).resolves.toBeUndefined();
  });

  it("doesn't throw when report/summary/checks/findings are entirely missing", async () => {
    await expect(generateWebsiteCheckReport({ id: 2, url: "https://example.com", created_at: null })).resolves.toBeUndefined();
  });

  it("doesn't throw when report exists but its fields are the wrong shape", async () => {
    await expect(generateWebsiteCheckReport({
      id: 3,
      report: { target: null, summary: null, checks: "not-an-array", findings: null },
    })).resolves.toBeUndefined();
  });

  it("sanitizes the host into the saved filename", async () => {
    await generateWebsiteCheckReport({
      id: 4,
      created_at: "2026-07-20",
      report: { target: { final_url: "https://Ex%20ample.de/path?q=1" } },
    });
    const lastDoc = instances[instances.length - 1];
    const [filename] = lastDoc.save.mock.calls[0];
    expect(filename).toMatch(/^IT-Dart-Website-Analyse_/);
    expect(filename).not.toMatch(/[^a-zA-Z0-9._-]/);
  });
});
