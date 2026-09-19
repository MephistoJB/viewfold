import { describe, expect, it } from "vitest";
import { coversLabel, normalizeLocale } from "../src/i18n";
import { hassFixture } from "./fixtures";

describe("internationalization", () => {
  it("prefers the native Home Assistant translation", () => {
    expect(coversLabel(hassFixture([], { nativeLabel: "Stores" }))).toBe(
      "Stores",
    );
  });

  it("provides English, German, French and English fallback", () => {
    expect(coversLabel(hassFixture([], { locale: "en-US" }))).toBe("Covers");
    expect(coversLabel(hassFixture([], { locale: "de-DE" }))).toBe(
      "Rollläden & Beschattung",
    );
    expect(coversLabel(hassFixture([], { locale: "fr-FR" }))).toBe(
      "Volets et protections solaires",
    );
    expect(coversLabel(hassFixture([], { locale: "ar" }))).toBe("Covers");
    expect(normalizeLocale("FR_ca")).toBe("fr");
  });
});
