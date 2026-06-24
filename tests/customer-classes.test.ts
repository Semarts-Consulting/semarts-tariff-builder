import { describe, expect, it } from "vitest";
import {
  addCustomerClass,
  parseCustomerClasses,
  removeCustomerClass,
  renameCustomerClass
} from "@/lib/customer-classes";

describe("customer class helpers", () => {
  it("parses comma-separated customer classes with whitespace and duplicate normalisation", () => {
    expect(parseCustomerClasses(" Residential, Small business, residential , Common area ")).toEqual(
      ["Residential", "Small business", "Common area"]
    );
  });

  it("adds unique non-empty customer classes", () => {
    expect(addCustomerClass(["Residential"], " Small business ")).toEqual([
      "Residential",
      "Small business"
    ]);
    expect(addCustomerClass(["Residential"], "residential")).toEqual(["Residential"]);
    expect(addCustomerClass(["Residential"], " ")).toEqual(["Residential"]);
  });

  it("renames a customer class without creating duplicates", () => {
    expect(renameCustomerClass(["Residential", "Commercial"], "Residential", "Domestic")).toEqual(
      ["Domestic", "Commercial"]
    );
    expect(renameCustomerClass(["Residential", "Commercial"], "Residential", "commercial")).toEqual(
      ["Residential", "Commercial"]
    );
  });

  it("prevents removing the last customer class", () => {
    expect(removeCustomerClass(["Residential", "Commercial"], "Residential")).toEqual([
      "Commercial"
    ]);
    expect(removeCustomerClass(["Residential"], "Residential")).toEqual(["Residential"]);
  });
});
