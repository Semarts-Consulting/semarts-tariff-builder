import { describe, expect, it } from "vitest";
import { calculateTariffs } from "@/lib/calculation-engine";
import { calculateLossAdjustedHalfHourlyConsumption } from "@/lib/loss-adjusted-consumption";
import { applyMeterResponsibilityAllocationRule } from "@/lib/meter-responsibility-rules";
import {
  getConsumptionTotalByMeter,
  validateRequiredTransmissionLossMultipliers,
  validateSiteSubmeters,
  validateSubmeterConsumption
} from "@/lib/site-submeter-inputs";
import { reconcileSubmeterConsumptionToBoundary } from "@/lib/submeter-reconciliation";
import {
  privateNetworkAllocationRows,
  privateNetworkAllConsumptionRows,
  privateNetworkBoundaryMeterRows,
  privateNetworkCostPoolRows,
  privateNetworkDataInputRows,
  privateNetworkExpected,
  privateNetworkProjectId,
  privateNetworkSiteSubmeters,
  privateNetworkTransmissionLossMultipliers,
  privateNetworkValidConsumptionRows
} from "@/tests/fixtures/private-network-e2e-scenario";

describe("private network end-to-end scenario", () => {
  it("keeps submeter evidence traceable without changing aggregate tariff outputs", () => {
    expect(validateSiteSubmeters(privateNetworkSiteSubmeters)).toEqual([]);
    expect(
      validateSubmeterConsumption(
        privateNetworkValidConsumptionRows,
        privateNetworkSiteSubmeters
      )
    ).toEqual([]);

    const allConsumptionIssues = validateSubmeterConsumption(
      privateNetworkAllConsumptionRows,
      privateNetworkSiteSubmeters
    );
    expect(allConsumptionIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "Unknown meter",
          rowId: "consumption-unknown-meter",
          meter: "MTR-UNKNOWN-A"
        })
      ])
    );

    const consumptionByMeter = getConsumptionTotalByMeter(
      privateNetworkValidConsumptionRows
    );
    expect(consumptionByMeter).toEqual(
      expect.arrayContaining([
        { meter: "MTR-RETAIL-A", totalKwh: 48 },
        { meter: "MTR-PLANT-A", totalKwh: 24 },
        { meter: "MTR-LANDLORD-A", totalKwh: 36 },
        { meter: "MTR-NETOPS-A", totalKwh: 12 }
      ])
    );

    const reconciliation = reconcileSubmeterConsumptionToBoundary({
      boundaryMeterRows: privateNetworkBoundaryMeterRows,
      submeterRows: privateNetworkSiteSubmeters,
      consumptionRows: privateNetworkAllConsumptionRows
    });
    expect(reconciliation.boundaryMeterImportTotalKwh).toBe(
      privateNetworkExpected.boundaryKwh
    );
    expect(reconciliation.totalSubmeterConsumptionKwh).toBe(
      privateNetworkExpected.validSubmeterKwh
    );
    expect(reconciliation.varianceKwh).toBe(0);
    expect(reconciliation.status).toBe("Green");
    expect(reconciliation.excludedRecords).toEqual([
      expect.objectContaining({
        id: "consumption-unknown-meter",
        source: "Submeter consumption",
        reason: "Unknown meter"
      })
    ]);
    expect(reconciliation.auditTrace).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Boundary meter import total",
          value: privateNetworkExpected.boundaryKwh
        }),
        expect.objectContaining({
          label: "Included submeter consumption",
          value: privateNetworkExpected.validSubmeterKwh
        })
      ])
    );

    expect(
      validateRequiredTransmissionLossMultipliers(
        privateNetworkValidConsumptionRows,
        privateNetworkTransmissionLossMultipliers,
        "_A"
      )
    ).toEqual([]);

    const lossAdjusted = calculateLossAdjustedHalfHourlyConsumption({
      consumptionRows: privateNetworkValidConsumptionRows,
      multipliers: privateNetworkTransmissionLossMultipliers,
      gspGroup: "_A"
    });
    expect(lossAdjusted.warnings).toEqual([]);
    expect(lossAdjusted.rawConsumptionKwh).toBe(
      privateNetworkExpected.validSubmeterKwh
    );
    expect(lossAdjusted.lossAdjustedConsumptionKwh).toBeCloseTo(
      privateNetworkExpected.lossAdjustedKwh,
      4
    );
    expect(lossAdjusted.adjustedPeriods).toHaveLength(192);

    const tenantMeter = privateNetworkSiteSubmeters.find(
      (row) => row.meter === "MTR-RETAIL-A"
    );
    const networkOperatorMeter = privateNetworkSiteSubmeters.find(
      (row) => row.meter === "MTR-NETOPS-A"
    );

    expect(tenantMeter).toBeDefined();
    expect(networkOperatorMeter).toBeDefined();

    const tenantTreatment = applyMeterResponsibilityAllocationRule({
      submeter: tenantMeter ?? privateNetworkSiteSubmeters[0],
      sourceRecordIds: ["consumption-retail-a"]
    });
    const networkOperatorTreatment = applyMeterResponsibilityAllocationRule({
      submeter: networkOperatorMeter ?? privateNetworkSiteSubmeters[0],
      sourceRecordIds: ["consumption-network-ops-a"]
    });

    expect(tenantTreatment.includedSourceRecordIds).toEqual(["consumption-retail-a"]);
    expect(networkOperatorTreatment.excludedSourceRecordIds).toEqual([
      "consumption-network-ops-a"
    ]);

    const tariffResult = calculateTariffs({
      projectId: privateNetworkProjectId,
      dataInputRows: privateNetworkDataInputRows,
      costPoolRows: privateNetworkCostPoolRows,
      allocationRows: privateNetworkAllocationRows
    });

    expect(tariffResult.validationIssues).toEqual([]);
    expect(tariffResult.revenueRequirement).toBe(
      privateNetworkExpected.revenueRequirement
    );
    expect(tariffResult.allocatedCost).toBeCloseTo(
      privateNetworkExpected.revenueRequirement,
      2
    );
    expect(tariffResult.unallocatedCost).toBeCloseTo(0, 2);
    expect(tariffResult.isRevenueRecovered).toBe(true);

    Object.entries(privateNetworkExpected.classTotals).forEach(
      ([customerClass, expectedTotal]) => {
        const classResult = tariffResult.classResults.find(
          (row) => row.customerClass === customerClass
        );

        expect(classResult?.totalAllocatedCost).toBeCloseTo(expectedTotal, 2);
      }
    );

    const aggregateInputSourceIds = privateNetworkDataInputRows.map((row) => row.id);
    const auditTrace = tariffResult.auditTrace ?? [];
    const classTotalSourceIds = auditTrace
      .filter((entry) => entry.stage === "Class total")
      .flatMap((entry) => entry.sourceRowIds);

    expect(classTotalSourceIds).toEqual(
      expect.arrayContaining(aggregateInputSourceIds)
    );
    expect(classTotalSourceIds).not.toContain("consumption-retail-a");
    expect(classTotalSourceIds).not.toContain("consumption-network-ops-a");
  });
});
