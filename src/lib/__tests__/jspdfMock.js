// Shared jsPDF mock for the PDF-generator tests. Real jsPDF rendering isn't
// the risk area here — these generators are almost entirely imperative
// drawing calls. The actual risk is null/undefined access on malformed
// report data (missing summary, empty arrays, etc.), so the mock just needs
// to be chainable and non-throwing, with `save` spy-able to assert on the
// generated filename.
import { vi } from "vitest";

export function createJsPdfMock() {
  const instances = [];

  function jsPDF() {
    let pageCount = 1;
    const doc = {
      setFont: vi.fn().mockReturnThis(),
      setFontSize: vi.fn().mockReturnThis(),
      setTextColor: vi.fn().mockReturnThis(),
      setDrawColor: vi.fn().mockReturnThis(),
      setFillColor: vi.fn().mockReturnThis(),
      setLineWidth: vi.fn().mockReturnThis(),
      text: vi.fn().mockReturnThis(),
      line: vi.fn().mockReturnThis(),
      circle: vi.fn().mockReturnThis(),
      triangle: vi.fn().mockReturnThis(),
      rect: vi.fn().mockReturnThis(),
      roundedRect: vi.fn().mockReturnThis(),
      ellipse: vi.fn().mockReturnThis(),
      setGState: vi.fn().mockReturnThis(),
      GState: vi.fn(),
      lines: vi.fn().mockReturnThis(),
      addPage: vi.fn(() => { pageCount += 1; return doc; }),
      setPage: vi.fn().mockReturnThis(),
      splitTextToSize: vi.fn((text) => String(text).split("\n")),
      save: vi.fn(),
      internal: {
        getNumberOfPages: () => pageCount,
      },
    };
    instances.push(doc);
    return doc;
  }

  return { jsPDF, instances };
}
