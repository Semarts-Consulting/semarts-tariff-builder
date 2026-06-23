import { describe, expect, it } from "vitest";
import {
  createEmployeeCostFingerprint,
  employeeCostHeaders,
  mergeEmployeeCostRows,
  parseEmployeeCostRows,
  parseEmployeeRoleType,
  validateEmployeeCostHeaders
} from "@/lib/employee-cost-import";
import type { EmployeeCostInput } from "@/types/project";

function createWorkbookRow(overrides: Partial<{
  role: string;
  roleType: string;
  fte: number | string;
  timePercent: number | string;
}> = {}) {
  return [
    overrides.role ?? "Network Manager",
    overrides.roleType ?? "Manager",
    overrides.fte ?? 2,
    overrides.timePercent ?? 50
  ];
}

function createEmployeeCostRow(overrides: Partial<EmployeeCostInput> = {}): EmployeeCostInput {
  const baseRow = {
    role: overrides.role ?? "Network Manager",
    roleType: overrides.roleType ?? "Manager",
    fte: overrides.fte ?? 2,
    timePercent: overrides.timePercent ?? 50
  };

  return {
    id: overrides.id ?? "employee-cost-1",
    ...baseRow,
    comment: overrides.comment ?? "",
    sourceFileName: overrides.sourceFileName ?? "employee-costs.xlsx",
    uploadedAt: overrides.uploadedAt ?? "2026-06-21T10:00:00.000Z",
    importBatchId: overrides.importBatchId ?? "employee-cost-batch-1",
    rowFingerprint: overrides.rowFingerprint ?? createEmployeeCostFingerprint(baseRow)
  };
}

describe("employee cost import", () => {
  it("validates the expected template headers", () => {
    expect(validateEmployeeCostHeaders(employeeCostHeaders)).toBe(true);
    expect(validateEmployeeCostHeaders([" role ", "ROLE TYPE", " fte ", " % time "])).toBe(true);
    expect(validateEmployeeCostHeaders(["Role Type", "Role", "FTE", "% Time"])).toBe(false);
  });

  it("validates role types", () => {
    expect(parseEmployeeRoleType("Manager")).toBe("Manager");
    expect(parseEmployeeRoleType("Senior Manager")).toBe("Senior Manager");
    expect(parseEmployeeRoleType("Contractor")).toBeNull();
  });

  it("parses valid workbook rows", () => {
    const result = parseEmployeeCostRows(
      [employeeCostHeaders, createWorkbookRow({ fte: "2.5", timePercent: "75" })],
      "employee-costs.xlsx",
      "2026-06-21T10:00:00.000Z",
      "employee-cost-batch-1"
    );

    expect(result.errors).toEqual([]);
    expect(result.parsedRows).toHaveLength(1);
    expect(result.parsedRows[0]).toMatchObject({
      role: "Network Manager",
      roleType: "Manager",
      fte: 2.5,
      timePercent: 75,
      comment: "",
      sourceFileName: "employee-costs.xlsx",
      importBatchId: "employee-cost-batch-1"
    });
  });

  it("skips blank workbook rows while preserving later validation row numbers", () => {
    const result = parseEmployeeCostRows(
      [
        employeeCostHeaders,
        ["", "", "", ""],
        createWorkbookRow({ role: "", fte: "not a number" }),
        createWorkbookRow({ role: "Network Analyst", fte: "1.5", timePercent: "25" })
      ],
      "employee-costs.xlsx",
      "2026-06-21T10:00:00.000Z",
      "employee-cost-batch-1"
    );

    expect(result.parsedRows).toHaveLength(1);
    expect(result.parsedRows[0]).toMatchObject({
      role: "Network Analyst",
      fte: 1.5,
      timePercent: 25
    });
    expect(result.errors).toContain("Row 3: Role is required.");
    expect(result.errors).toContain("Row 3: FTE must be zero or greater.");
  });

  it("returns row-level errors without importing invalid rows", () => {
    const result = parseEmployeeCostRows(
      [
        employeeCostHeaders,
        createWorkbookRow({ role: "", roleType: "Contractor", fte: -1, timePercent: 120 }),
        createWorkbookRow({ role: "Bad numeric", fte: "not a number", timePercent: "" })
      ],
      "employee-costs.xlsx",
      "2026-06-21T10:00:00.000Z",
      "employee-cost-batch-1"
    );

    expect(result.parsedRows).toHaveLength(0);
    expect(result.errors).toContain("Row 2: Role is required.");
    expect(result.errors).toContain(
      "Row 2: Role Type must be Exco, Director, Head, Senior Manager, Manager, Colleague."
    );
    expect(result.errors).toContain("Row 2: FTE must be zero or greater.");
    expect(result.errors).toContain("Row 2: % Time must be between 0 and 100.");
    expect(result.errors).toContain("Row 3: FTE must be zero or greater.");
    expect(result.errors).toContain("Row 3: % Time must be between 0 and 100.");
  });

  it("replaces changed rows by role key while skipping identical duplicates", () => {
    const existingRow = createEmployeeCostRow();
    const duplicateRow = createEmployeeCostRow({ id: "employee-cost-2" });
    const replacementRow = createEmployeeCostRow({
      id: "employee-cost-3",
      fte: 3
    });

    const result = mergeEmployeeCostRows([existingRow], [duplicateRow, replacementRow]);

    expect(result.added).toBe(0);
    expect(result.replaced).toBe(1);
    expect(result.skippedDuplicates).toBe(1);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.fte).toBe(3);
  });
});
