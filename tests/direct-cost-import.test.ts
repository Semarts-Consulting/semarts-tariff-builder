import { describe, expect, it } from "vitest";
import {
  createDirectCostFingerprint,
  directCostHeaders,
  mergeDirectCostRows,
  parseDirectCostRows,
  validateDirectCostHeaders
} from "@/lib/direct-cost-import";
import type { DirectCostInput } from "@/types/project";

function createWorkbookRow(overrides: Partial<{
  description: string;
  costByType: string;
  annualValue: number | string;
}> = {}) {
  return [
    overrides.description ?? "Maintenance contractor",
    overrides.costByType ?? "Repairs",
    overrides.annualValue ?? 25000
  ];
}

function createDirectCostRow(overrides: Partial<DirectCostInput> = {}): DirectCostInput {
  const baseRow = {
    description: overrides.description ?? "Maintenance contractor",
    costByType: overrides.costByType ?? "Repairs",
    annualValue: overrides.annualValue ?? 25000
  };

  return {
    id: overrides.id ?? "direct-cost-1",
    ...baseRow,
    comment: overrides.comment ?? "",
    sourceFileName: overrides.sourceFileName ?? "direct-costs.xlsx",
    uploadedAt: overrides.uploadedAt ?? "2026-06-21T10:00:00.000Z",
    importBatchId: overrides.importBatchId ?? "direct-cost-batch-1",
    rowFingerprint: overrides.rowFingerprint ?? createDirectCostFingerprint(baseRow)
  };
}

describe("direct cost import", () => {
  it("validates the expected template headers", () => {
    expect(validateDirectCostHeaders(directCostHeaders)).toBe(true);
    expect(validateDirectCostHeaders([" description ", "COST BY TYPE", " annual value "])).toBe(true);
    expect(validateDirectCostHeaders(["Cost by Type", "Description", "Annual Value"])).toBe(false);
  });

  it("parses valid workbook rows", () => {
    const result = parseDirectCostRows(
      [directCostHeaders, createWorkbookRow({ annualValue: "25,000" })],
      "direct-costs.xlsx",
      "2026-06-21T10:00:00.000Z",
      "direct-cost-batch-1"
    );

    expect(result.errors).toEqual([]);
    expect(result.parsedRows).toHaveLength(1);
    expect(result.parsedRows[0]).toMatchObject({
      description: "Maintenance contractor",
      costByType: "Repairs",
      annualValue: 25000,
      comment: "",
      sourceFileName: "direct-costs.xlsx",
      importBatchId: "direct-cost-batch-1"
    });
  });

  it("skips blank workbook rows without changing later row numbers", () => {
    const result = parseDirectCostRows(
      [
        directCostHeaders,
        ["", "", ""],
        createWorkbookRow({ description: "", annualValue: "not a number" }),
        createWorkbookRow({ description: "Security contractor", annualValue: "12,500.50" })
      ],
      "direct-costs.xlsx",
      "2026-06-21T10:00:00.000Z",
      "direct-cost-batch-1"
    );

    expect(result.parsedRows).toHaveLength(1);
    expect(result.parsedRows[0]).toMatchObject({
      description: "Security contractor",
      annualValue: 12500.5
    });
    expect(result.errors).toContain("Row 3: Description is required.");
    expect(result.errors).toContain("Row 3: Annual Value must be zero or greater.");
  });

  it("returns row-level errors without importing invalid rows", () => {
    const result = parseDirectCostRows(
      [
        directCostHeaders,
        createWorkbookRow({ description: "", costByType: "", annualValue: -1 }),
        createWorkbookRow({ description: "Bad numeric", annualValue: "not a number" })
      ],
      "direct-costs.xlsx",
      "2026-06-21T10:00:00.000Z",
      "direct-cost-batch-1"
    );

    expect(result.parsedRows).toHaveLength(0);
    expect(result.errors).toContain("Row 2: Description is required.");
    expect(result.errors).toContain("Row 2: Cost by Type is required.");
    expect(result.errors).toContain("Row 2: Annual Value must be zero or greater.");
    expect(result.errors).toContain("Row 3: Annual Value must be zero or greater.");
  });

  it("replaces changed rows by cost key while skipping identical duplicates", () => {
    const existingRow = createDirectCostRow();
    const duplicateRow = createDirectCostRow({ id: "direct-cost-2" });
    const replacementRow = createDirectCostRow({
      id: "direct-cost-3",
      annualValue: 30000
    });

    const result = mergeDirectCostRows([existingRow], [duplicateRow, replacementRow]);

    expect(result.added).toBe(0);
    expect(result.replaced).toBe(1);
    expect(result.skippedDuplicates).toBe(1);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.annualValue).toBe(30000);
  });
});
