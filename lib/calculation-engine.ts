import type {
  AllocationMethodRow,
  CostPoolRow,
  DataInputRow,
  TariffCalculationClassResult,
  TariffCalculationResult
} from "@/types/project";

type CalculationInputs = {
  projectId: string;
  dataInputRows: DataInputRow[];
  costPoolRows: CostPoolRow[];
  allocationRows: AllocationMethodRow[];
};

function recoverableAmount(row: CostPoolRow) {
  return row.annualAmount * (row.recoverablePercent / 100);
}

function safeDivide(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0;
}

function shareTotal(row: AllocationMethodRow) {
  return row.classShares.reduce((total, share) => total + share.percent, 0);
}

function createEmptyClassResult(row: DataInputRow): TariffCalculationClassResult {
  return {
    customerClass: row.customerClass,
    customerCount: row.customerCount,
    annualKwh: row.annualKwh,
    peakDemandKw: row.peakDemandKw,
    fixedCost: 0,
    energyCost: 0,
    demandCost: 0,
    passThroughCost: 0,
    totalAllocatedCost: 0,
    fixedChargePerCustomer: 0,
    energyChargePerKwh: 0,
    demandChargePerKw: 0
  };
}

export function calculateTariffs({
  projectId,
  dataInputRows,
  costPoolRows,
  allocationRows
}: CalculationInputs): TariffCalculationResult {
  const costPoolById = new Map(costPoolRows.map((row) => [row.id, row]));
  const classResults = new Map(
    dataInputRows
      .filter((row) => row.customerClass.trim())
      .map((row) => [row.customerClass, createEmptyClassResult(row)])
  );
  const revenueRequirement = costPoolRows.reduce(
    (total, row) => total + recoverableAmount(row),
    0
  );
  let allocatedCost = 0;
  let unbalancedAllocationCount = 0;

  allocationRows.forEach((allocationRow) => {
    const costPool = costPoolById.get(allocationRow.costPoolId);
    if (!costPool) {
      return;
    }

    const recoverableCost = recoverableAmount(costPool);
    const totalShare = shareTotal(allocationRow);

    if (Math.abs(totalShare - 100) > 0.01) {
      unbalancedAllocationCount += 1;
    }

    allocationRow.classShares.forEach((share) => {
      const result = classResults.get(share.customerClass);
      if (!result) {
        return;
      }

      const allocatedShare = recoverableCost * (share.percent / 100);
      allocatedCost += allocatedShare;

      if (allocationRow.tariffComponent === "Fixed") {
        result.fixedCost += allocatedShare;
      } else if (allocationRow.tariffComponent === "Energy") {
        result.energyCost += allocatedShare;
      } else if (allocationRow.tariffComponent === "Demand") {
        result.demandCost += allocatedShare;
      } else {
        result.passThroughCost += allocatedShare;
      }
    });
  });

  const finalClassResults = Array.from(classResults.values()).map((result) => {
    const totalAllocatedCost =
      result.fixedCost + result.energyCost + result.demandCost + result.passThroughCost;

    return {
      ...result,
      totalAllocatedCost,
      fixedChargePerCustomer: safeDivide(result.fixedCost, result.customerCount),
      energyChargePerKwh: safeDivide(result.energyCost + result.passThroughCost, result.annualKwh),
      demandChargePerKw: safeDivide(result.demandCost, result.peakDemandKw)
    };
  });

  return {
    projectId,
    revenueRequirement,
    allocatedCost,
    unallocatedCost: revenueRequirement - allocatedCost,
    unbalancedAllocationCount,
    classResults: finalClassResults
  };
}
