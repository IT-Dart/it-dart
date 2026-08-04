import { describe, it, expect } from "vitest";
import { describeError, describeHashError } from "../errorText.js";

describe("describeError", () => {
  it("übersetzt bekannte Supabase-Meldungen ins Deutsche", () => {
    expect(describeError({ message: "Invalid login credentials" })).toBe("E-Mail oder Passwort ist falsch.");
  });

  // To-Do #111: gotrue-js verwirft zu alte URL-Sessions (>120s) lautlos,
  // updateUser() wirft dann nur noch dieses generische "Auth session
  // missing!" -- muss verständlich übersetzt werden statt roh durchzureichen.
  it("übersetzt 'Auth session missing!' als abgelaufenen Link", () => {
    expect(describeError({ message: "Auth session missing!" })).toBe(
      "Dieser Link ist abgelaufen oder wurde bereits verwendet. Bitte fordere einen neuen Link an."
    );
  });

  it("gibt die Rohmeldung zurück, wenn keine Übersetzung bekannt ist", () => {
    expect(describeError({ message: "Some totally unknown error" })).toBe("Some totally unknown error");
  });

  it("gibt den Fallback zurück, wenn kein Error übergeben wird", () => {
    expect(describeError(null)).toBe("Unbekannter Fehler — bitte kurz später erneut versuchen.");
  });
});

describe("describeHashError", () => {
  it("übersetzt otp_expired", () => {
    expect(describeHashError("otp_expired")).toBe(
      "Dieser Link ist abgelaufen oder wurde bereits verwendet. Bitte fordere einen neuen Link an."
    );
  });

  it("nutzt einen generischen Fallback für unbekannte Codes", () => {
    expect(describeHashError("irgendein_neuer_code")).toBe("Dieser Link ist ungültig oder abgelaufen. Bitte fordere einen neuen Link an.");
  });
});
