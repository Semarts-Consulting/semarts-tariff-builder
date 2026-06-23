import { describe, expect, it, vi } from "vitest";
import {
  createImportedRowId,
  normaliseImportHeader,
  parseRequiredImportNumber,
  validateImportHeaders
} from "@/lib/import-utils";

describe("import utils", () => {
  it("normalises import headers by trimming and lowercasing values", () => {
    expect(normaliseImportHeader(" Annual Value ")).toBe("annual value");
    expect(normaliseImportHeader(null)).toBe("");
    expect(normaliseImportHeader(undefined)).toBe("");
  });

  it("validates expected headers with case and whitespace tolerance", () => {
    expect(
      validateImportHeaders(
        ["Description", "Annual Value"],
        [" description ", "ANNUAL VALUE"]
      )
    ).toBe(true);
    expect(validateImportHeaders(["Description", "Annual Value"], ["Annual Value"])).toBe(
      false
    );
  });

  it("parses required import numbers with commas and decimals", () => {
    expect(parseRequiredImportNumber("12,500.75")).toBe(12500.75);
    expect(parseRequiredImportNumber(100)).toBe(100);
    expect(parseRequiredImportNumber("")).toBeNull();
    expect(parseRequiredImportNumber(null)).toBeNull();
    expect(parseRequiredImportNumber("not numeric")).toBeNull();
  });

  it("creates imported row IDs with prefix, timestamp, index, and random suffix", () => {
    vi.spyOn(Date, "now").mockReturnValue(123456789);
    vi.spyOn(Math, "random").mockReturnValue(0.123456789);

    expect(createImportedRowId("asset-import", 3)).toBe("asset-import-21i3v9-3-4fzzzx");
  });
});
