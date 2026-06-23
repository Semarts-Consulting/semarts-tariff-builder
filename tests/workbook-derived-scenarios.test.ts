import { describe, expect, it } from "vitest";
import { calculateTariffs } from "@/lib/calculation-engine";
import {
  wb001AirportScenarioAllocationRows,
  wb001AirportScenarioCostPoolRows,
  wb001AirportScenarioDataInputRows,
  wb001AirportScenarioEvidenceItems,
  wb001AirportScenarioExpected,
  wb002TlmLocalLossEvidenceRows,
  wb002TlmLocalLossScenarioAllocationRows,
  wb002TlmLocalLossScenarioCostPoolRows,
  wb002TlmLocalLossScenarioDataInputRows,
  wb002TlmLocalLossScenarioExpected,
  wb003PortTenantRecoveryRows,
  wb003PortTenantScenarioAllocationRows,
  wb003PortTenantScenarioCostPoolRows,
  wb003PortTenantScenarioDataInputRows,
  wb003PortTenantScenarioExpected,
  wb004GenerationExportEvidenceRows,
  wb004GenerationExportScenarioAllocationRows,
  wb004GenerationExportScenarioCostPoolRows,
  wb004GenerationExportScenarioDataInputRows,
  wb004GenerationExportScenarioExpected,
  wb006WeakMappingScenarioAllocationRows,
  wb006WeakMappingScenarioCostPoolRows,
  wb006WeakMappingScenarioDataInputRows,
  wb006WeakMappingScenarioExpected,
  wb006WeakMappingScenarioMappingRows
} from "@/tests/fixtures/workbook-derived-scenarios";

const sumBy = <TItem>(
  items: TItem[],
  selector: (item: TItem) => number
): number => items.reduce((total, item) => total + selector(item), 0);

describe("workbook-derived tariff scenarios", () => {
  it("WB-001 reconciles an airport customer-class scenario without evidence-only values", () => {
    expect(wb001AirportScenarioDataInputRows).toHaveLength(3);

    const recoverableCostPoolTotal = sumBy(
      wb001AirportScenarioCostPoolRows,
      (row) => row.annualAmount * (row.recoverablePercent / 100)
    );
    expect(recoverableCostPoolTotal).toBe(
      wb001AirportScenarioExpected.revenueRequirement
    );

    wb001AirportScenarioAllocationRows.forEach((allocationRow) => {
      const allocationTotal = sumBy(
        allocationRow.classShares,
        (share) => share.percent
      );
      expect(allocationTotal).toBeCloseTo(100, 8);
    });

    const evidenceOnlyTotal = sumBy(
      wb001AirportScenarioEvidenceItems.filter(
        (item) => item.treatment === "Evidence-only"
      ),
      (item) => item.amount
    );
    const passThroughEvidenceTotal = sumBy(
      wb001AirportScenarioEvidenceItems.filter(
        (item) => item.treatment === "Evidence-only/pass-through"
      ),
      (item) => item.amount
    );
    const excludedPendingReviewTotal = sumBy(
      wb001AirportScenarioEvidenceItems.filter(
        (item) => item.treatment === "Excluded pending review"
      ),
      (item) => item.amount
    );

    expect(evidenceOnlyTotal).toBe(
      wb001AirportScenarioExpected.evidenceOnlyTotal
    );
    expect(passThroughEvidenceTotal).toBe(
      wb001AirportScenarioExpected.passThroughEvidenceTotal
    );
    expect(excludedPendingReviewTotal).toBe(
      wb001AirportScenarioExpected.excludedPendingReviewTotal
    );

    const calculationCostPoolIds = new Set(
      wb001AirportScenarioCostPoolRows.map((row) => row.id)
    );
    const calculationAllocationIds = new Set(
      wb001AirportScenarioAllocationRows.map((row) => row.id)
    );
    wb001AirportScenarioEvidenceItems.forEach((evidenceItem) => {
      expect(calculationCostPoolIds.has(evidenceItem.id)).toBe(false);
      expect(calculationAllocationIds.has(evidenceItem.id)).toBe(false);
    });

    const result = calculateTariffs({
      projectId: "wb-001-airport-customer-class",
      dataInputRows: wb001AirportScenarioDataInputRows,
      costPoolRows: wb001AirportScenarioCostPoolRows,
      allocationRows: wb001AirportScenarioAllocationRows
    });

    expect(result.validationIssues).toEqual([]);
    expect(result.revenueRequirement).toBe(
      wb001AirportScenarioExpected.revenueRequirement
    );
    expect(result.allocatedCost).toBeCloseTo(result.revenueRequirement, 2);
    expect(result.unallocatedCost).toBeCloseTo(0, 2);
    expect(result.isRevenueRecovered).toBe(true);
    expect(result.unbalancedAllocationCount).toBe(0);

    Object.entries(wb001AirportScenarioExpected.classResults).forEach(
      ([customerClass, expected]) => {
        const classResult = result.classResults.find(
          (row) => row.customerClass === customerClass
        );

        expect(classResult).toBeDefined();
        expect(classResult?.fixedCost).toBeCloseTo(expected.fixedCost, 2);
        expect(classResult?.energyCost).toBeCloseTo(expected.energyCost, 2);
        expect(classResult?.demandCost).toBeCloseTo(expected.demandCost, 2);
        expect(classResult?.passThroughCost).toBeCloseTo(
          expected.passThroughCost,
          2
        );
        expect(classResult?.totalAllocatedCost).toBeCloseTo(
          expected.totalAllocatedCost,
          2
        );
        expect(classResult?.fixedChargePerCustomer).toBeCloseTo(
          expected.fixedChargePerCustomer,
          4
        );
        expect(classResult?.energyChargePerKwh).toBeCloseTo(
          expected.energyChargePerKwh,
          4
        );
        expect(classResult?.demandChargePerKw).toBeCloseTo(
          expected.demandChargePerKw,
          4
        );
      }
    );

    const auditTrace = result.auditTrace ?? [];
    expect(
      auditTrace.filter((entry) => entry.stage === "Revenue requirement")
    ).toHaveLength(wb001AirportScenarioCostPoolRows.length);
    expect(
      auditTrace.filter((entry) => entry.stage === "Cost allocation")
    ).toHaveLength(
      wb001AirportScenarioCostPoolRows.length *
        wb001AirportScenarioDataInputRows.length
    );
    expect(auditTrace.filter((entry) => entry.stage === "Class total")).toHaveLength(
      wb001AirportScenarioDataInputRows.length
    );
    expect(
      auditTrace.filter((entry) => entry.stage === "Rate derivation")
    ).toHaveLength(9);
    expect(
      auditTrace.filter((entry) => entry.stage === "Revenue recovery")
    ).toHaveLength(1);

    const terminalRetailDemandTrace = auditTrace.find(
      (entry) =>
        entry.stage === "Rate derivation" &&
        entry.customerClass === "Terminal retail" &&
        entry.tariffComponent === "Demand"
    );
    expect(terminalRetailDemandTrace?.result.unit).toBe("GBP per kW");
    expect(terminalRetailDemandTrace?.result.value).toBeCloseTo(
      wb001AirportScenarioExpected.classResults["Terminal retail"]
        .demandChargePerKw,
      4
    );
  });

  it("WB-006 keeps weak and unresolved workbook mappings outside tariff inputs", () => {
    const calculationInputMappings = wb006WeakMappingScenarioMappingRows.filter(
      (row) => row.treatment === "Calculation input"
    );
    expect(calculationInputMappings).toHaveLength(1);
    expect(calculationInputMappings[0]?.mappingConfidence).toBe("High");

    const excludedMappings = wb006WeakMappingScenarioMappingRows.filter(
      (row) => row.treatment !== "Calculation input"
    );
    const excludedMappingAmount = sumBy(
      excludedMappings,
      (row) => row.normalisedValue ?? 0
    );
    const validationIssueCount = wb006WeakMappingScenarioMappingRows.filter(
      (row) => row.validationIssue !== null
    ).length;

    expect(excludedMappingAmount).toBe(
      wb006WeakMappingScenarioExpected.excludedMappingAmount
    );
    expect(validationIssueCount).toBe(
      wb006WeakMappingScenarioExpected.validationIssueCount
    );
    expect(
      wb006WeakMappingScenarioMappingRows.filter(
        (row) =>
          row.mappingConfidence === "Low" ||
          row.mappingConfidence === "Unresolved"
      )
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ treatment: "Evidence-only" }),
        expect.objectContaining({ treatment: "Excluded pending review" }),
        expect.objectContaining({ treatment: "Manual review required" })
      ])
    );

    const calculationCostPoolNames = new Set(
      wb006WeakMappingScenarioCostPoolRows.map((row) => row.name)
    );
    excludedMappings.forEach((mappingRow) => {
      expect(calculationCostPoolNames.has(mappingRow.sourceLabel)).toBe(false);
    });

    const result = calculateTariffs({
      projectId: "wb-006-weak-mapping-confidence",
      dataInputRows: wb006WeakMappingScenarioDataInputRows,
      costPoolRows: wb006WeakMappingScenarioCostPoolRows,
      allocationRows: wb006WeakMappingScenarioAllocationRows
    });

    expect(result.validationIssues).toEqual([]);
    expect(result.revenueRequirement).toBe(
      wb006WeakMappingScenarioExpected.revenueRequirement
    );
    expect(result.allocatedCost).toBeCloseTo(result.revenueRequirement, 2);
    expect(result.unallocatedCost).toBeCloseTo(0, 2);
    expect(result.isRevenueRecovered).toBe(true);

    Object.entries(wb006WeakMappingScenarioExpected.classResults).forEach(
      ([customerClass, expected]) => {
        const classResult = result.classResults.find(
          (row) => row.customerClass === customerClass
        );

        expect(classResult).toBeDefined();
        expect(classResult?.fixedCost).toBeCloseTo(expected.fixedCost, 2);
        expect(classResult?.energyCost).toBeCloseTo(expected.energyCost, 2);
        expect(classResult?.demandCost).toBeCloseTo(expected.demandCost, 2);
        expect(classResult?.passThroughCost).toBeCloseTo(
          expected.passThroughCost,
          2
        );
        expect(classResult?.totalAllocatedCost).toBeCloseTo(
          expected.totalAllocatedCost,
          2
        );
        expect(classResult?.fixedChargePerCustomer).toBeCloseTo(
          expected.fixedChargePerCustomer,
          4
        );
        expect(classResult?.energyChargePerKwh).toBeCloseTo(
          expected.energyChargePerKwh,
          4
        );
        expect(classResult?.demandChargePerKw).toBeCloseTo(
          expected.demandChargePerKw,
          4
        );
      }
    );

    const auditTrace = result.auditTrace ?? [];
    const revenueRecoveryTrace = auditTrace.find(
      (entry) => entry.stage === "Revenue recovery"
    );
    expect(revenueRecoveryTrace?.result.value).toBeCloseTo(0, 2);
  });

  it("WB-002 keeps TLM and local loss evidence outside tariff volume inputs", () => {
    const calculationAnnualKwh = sumBy(
      wb002TlmLocalLossScenarioDataInputRows,
      (row) => row.annualKwh
    );
    const evidenceOnlyBaseKwh = sumBy(
      wb002TlmLocalLossEvidenceRows.filter(
        (row) => row.treatment === "Evidence-only"
      ),
      (row) => row.baseKwh
    );
    const evidenceOnlyLossAdjustedKwh = sumBy(
      wb002TlmLocalLossEvidenceRows.filter(
        (row) => row.treatment === "Evidence-only"
      ),
      (row) => row.lossAdjustedKwh ?? 0
    );
    const manualReviewIssueCount = wb002TlmLocalLossEvidenceRows.filter(
      (row) => row.validationIssue !== null
    ).length;

    expect(calculationAnnualKwh).toBe(
      wb002TlmLocalLossScenarioExpected.calculationAnnualKwh
    );
    expect(evidenceOnlyBaseKwh).toBe(
      wb002TlmLocalLossScenarioExpected.evidenceOnlyBaseKwh
    );
    expect(evidenceOnlyLossAdjustedKwh).toBe(
      wb002TlmLocalLossScenarioExpected.evidenceOnlyLossAdjustedKwh
    );
    expect(evidenceOnlyLossAdjustedKwh).toBeGreaterThan(calculationAnnualKwh);
    expect(manualReviewIssueCount).toBe(
      wb002TlmLocalLossScenarioExpected.manualReviewIssueCount
    );

    const calculationInputIds = new Set([
      ...wb002TlmLocalLossScenarioDataInputRows.map((row) => row.id),
      ...wb002TlmLocalLossScenarioCostPoolRows.map((row) => row.id),
      ...wb002TlmLocalLossScenarioAllocationRows.map((row) => row.id)
    ]);
    wb002TlmLocalLossEvidenceRows.forEach((lossRow) => {
      expect(calculationInputIds.has(lossRow.id)).toBe(false);
    });

    const result = calculateTariffs({
      projectId: "wb-002-tlm-local-loss-evidence",
      dataInputRows: wb002TlmLocalLossScenarioDataInputRows,
      costPoolRows: wb002TlmLocalLossScenarioCostPoolRows,
      allocationRows: wb002TlmLocalLossScenarioAllocationRows
    });

    expect(result.validationIssues).toEqual([]);
    expect(result.revenueRequirement).toBe(
      wb002TlmLocalLossScenarioExpected.revenueRequirement
    );
    expect(result.allocatedCost).toBeCloseTo(result.revenueRequirement, 2);
    expect(result.unallocatedCost).toBeCloseTo(0, 2);
    expect(result.isRevenueRecovered).toBe(true);

    Object.entries(wb002TlmLocalLossScenarioExpected.classResults).forEach(
      ([customerClass, expected]) => {
        const classResult = result.classResults.find(
          (row) => row.customerClass === customerClass
        );

        expect(classResult).toBeDefined();
        expect(classResult?.annualKwh).toBe(
          wb002TlmLocalLossScenarioDataInputRows.find(
            (row) => row.customerClass === customerClass
          )?.annualKwh
        );
        expect(classResult?.energyCost).toBeCloseTo(expected.energyCost, 2);
        expect(classResult?.totalAllocatedCost).toBeCloseTo(
          expected.totalAllocatedCost,
          2
        );
        expect(classResult?.energyChargePerKwh).toBeCloseTo(
          expected.energyChargePerKwh,
          4
        );
      }
    );
  });

  it("WB-004 keeps generation and export evidence outside tariff recovery inputs", () => {
    const calculationAnnualKwh = sumBy(
      wb004GenerationExportScenarioDataInputRows,
      (row) => row.annualKwh
    );
    const evidenceGenerationKwh = sumBy(
      wb004GenerationExportEvidenceRows,
      (row) => row.generationKwh ?? 0
    );
    const evidenceExportKwh = sumBy(
      wb004GenerationExportEvidenceRows,
      (row) => row.exportKwh ?? 0
    );
    const evidenceCreditAmount = sumBy(
      wb004GenerationExportEvidenceRows,
      (row) => row.creditAmount ?? 0
    );
    const reviewIssueCount = wb004GenerationExportEvidenceRows.filter(
      (row) => row.validationIssue !== null
    ).length;

    expect(calculationAnnualKwh).toBe(
      wb004GenerationExportScenarioExpected.calculationAnnualKwh
    );
    expect(evidenceGenerationKwh).toBe(
      wb004GenerationExportScenarioExpected.evidenceGenerationKwh
    );
    expect(evidenceExportKwh).toBe(
      wb004GenerationExportScenarioExpected.evidenceExportKwh
    );
    expect(evidenceCreditAmount).toBe(
      wb004GenerationExportScenarioExpected.evidenceCreditAmount
    );
    expect(reviewIssueCount).toBe(
      wb004GenerationExportScenarioExpected.reviewIssueCount
    );

    const calculationInputIds = new Set([
      ...wb004GenerationExportScenarioDataInputRows.map((row) => row.id),
      ...wb004GenerationExportScenarioCostPoolRows.map((row) => row.id),
      ...wb004GenerationExportScenarioAllocationRows.map((row) => row.id)
    ]);
    wb004GenerationExportEvidenceRows.forEach((evidenceRow) => {
      expect(calculationInputIds.has(evidenceRow.id)).toBe(false);
      expect(evidenceRow.treatment).not.toBe("Calculation input");
    });

    const result = calculateTariffs({
      projectId: "wb-004-generation-export-evidence",
      dataInputRows: wb004GenerationExportScenarioDataInputRows,
      costPoolRows: wb004GenerationExportScenarioCostPoolRows,
      allocationRows: wb004GenerationExportScenarioAllocationRows
    });

    expect(result.validationIssues).toEqual([]);
    expect(result.revenueRequirement).toBe(
      wb004GenerationExportScenarioExpected.revenueRequirement
    );
    expect(result.allocatedCost).toBeCloseTo(result.revenueRequirement, 2);
    expect(result.unallocatedCost).toBeCloseTo(0, 2);
    expect(result.isRevenueRecovered).toBe(true);

    Object.entries(wb004GenerationExportScenarioExpected.classResults).forEach(
      ([customerClass, expected]) => {
        const classResult = result.classResults.find(
          (row) => row.customerClass === customerClass
        );

        expect(classResult).toBeDefined();
        expect(classResult?.annualKwh).toBe(calculationAnnualKwh);
        expect(classResult?.energyCost).toBeCloseTo(expected.energyCost, 2);
        expect(classResult?.totalAllocatedCost).toBeCloseTo(
          expected.totalAllocatedCost,
          2
        );
        expect(classResult?.energyChargePerKwh).toBeCloseTo(
          expected.energyChargePerKwh,
          4
        );
      }
    );
  });

  it("WB-003 keeps port tenant recovery forecasts outside tariff class inputs", () => {
    const calculationAnnualKwh = sumBy(
      wb003PortTenantScenarioDataInputRows,
      (row) => row.annualKwh
    );
    const evidenceForecastKwh = sumBy(
      wb003PortTenantRecoveryRows,
      (row) => row.forecastKwh ?? 0
    );
    const evidenceForecastRecoveryAmount = sumBy(
      wb003PortTenantRecoveryRows,
      (row) => row.forecastRecoveryAmount ?? 0
    );
    const reviewIssueCount = wb003PortTenantRecoveryRows.filter(
      (row) => row.validationIssue !== null
    ).length;

    expect(calculationAnnualKwh).toBe(
      wb003PortTenantScenarioExpected.calculationAnnualKwh
    );
    expect(evidenceForecastKwh).toBe(
      wb003PortTenantScenarioExpected.evidenceForecastKwh
    );
    expect(evidenceForecastRecoveryAmount).toBe(
      wb003PortTenantScenarioExpected.evidenceForecastRecoveryAmount
    );
    expect(reviewIssueCount).toBe(
      wb003PortTenantScenarioExpected.reviewIssueCount
    );

    const calculationCustomerClasses = new Set(
      wb003PortTenantScenarioDataInputRows.map((row) => row.customerClass)
    );
    wb003PortTenantRecoveryRows.forEach((tenantRow) => {
      expect(calculationCustomerClasses.has(tenantRow.tenantName)).toBe(false);
      expect(tenantRow.treatment).not.toBe("Calculation input");
    });

    const result = calculateTariffs({
      projectId: "wb-003-port-tenant-recovery",
      dataInputRows: wb003PortTenantScenarioDataInputRows,
      costPoolRows: wb003PortTenantScenarioCostPoolRows,
      allocationRows: wb003PortTenantScenarioAllocationRows
    });

    expect(result.validationIssues).toEqual([]);
    expect(result.revenueRequirement).toBe(
      wb003PortTenantScenarioExpected.revenueRequirement
    );
    expect(result.allocatedCost).toBeCloseTo(result.revenueRequirement, 2);
    expect(result.unallocatedCost).toBeCloseTo(0, 2);
    expect(result.isRevenueRecovered).toBe(true);
    expect(result.classResults).toHaveLength(1);

    Object.entries(wb003PortTenantScenarioExpected.classResults).forEach(
      ([customerClass, expected]) => {
        const classResult = result.classResults.find(
          (row) => row.customerClass === customerClass
        );

        expect(classResult).toBeDefined();
        expect(classResult?.annualKwh).toBe(calculationAnnualKwh);
        expect(classResult?.energyCost).toBeCloseTo(expected.energyCost, 2);
        expect(classResult?.totalAllocatedCost).toBeCloseTo(
          expected.totalAllocatedCost,
          2
        );
        expect(classResult?.energyChargePerKwh).toBeCloseTo(
          expected.energyChargePerKwh,
          4
        );
      }
    );
  });
});
