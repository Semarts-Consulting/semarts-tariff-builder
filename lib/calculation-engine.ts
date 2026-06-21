import type {
  AllocationMethodRow,
  CostPoolRow,
  DataInputRow,
  TariffCalculationClassResult,
  TariffCalculationResult,
  TariffCalculationValidationIssue
} from "@/types/project";

type CalculationInputs = {
  projectId: string;
  dataInputRows: DataInputRow[];
  costPoolRows: CostPoolRow[];
  allocationRows: AllocationMethodRow[];
};

const revenueRecoveryTolerance = 0.01;

function recoverableAmount(row: CostPoolRow) {
  return row.annualAmount * (row.recoverablePercent / 100);
}

function safeDivide(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0;
}

function shareTotal(row: AllocationMethodRow) {
  return row.classShares.reduce((total, share) => total + share.percent, 0);
}

function hasNegativeDataInput(row: DataInputRow) {
  return row.customerCount < 0 || row.annualKwh < 0 || row.peakDemandKw < 0;
}

function createInputValidationIssues(
  dataInputRows: DataInputRow[],
  costPoolRows: CostPoolRow[]
): TariffCalculationValidationIssue[] {
  const seenCustomerClasses = new Set<string>();
  const duplicateCustomerClassIssues = dataInputRows.flatMap<TariffCalculationValidationIssue>(
    (row) => {
      const customerClass = row.customerClass.trim();

      if (!customerClass) {
        return [
          {
            code: "Missing customer class",
            severity: "Error",
            message: "Customer class is required for tariff calculations.",
            rowId: row.id
          }
        ];
      }

      if (seenCustomerClasses.has(customerClass)) {
        return [
          {
            code: "Duplicate customer class",
            severity: "Error",
            message: "Customer class names must be unique for tariff calculations.",
            rowId: row.id,
            customerClass
          }
        ];
      }

      seenCustomerClasses.add(customerClass);
      return [];
    }
  );
  const dataInputIssues = dataInputRows
    .filter(hasNegativeDataInput)
    .map<TariffCalculationValidationIssue>((row) => ({
      code: "Negative data input",
      severity: "Error",
      message: "Customer counts, annual kWh, and peak demand must not be negative.",
      rowId: row.id,
      customerClass: row.customerClass
    }));
  const costPoolIssues = costPoolRows.flatMap<TariffCalculationValidationIssue>((row) => {
    const issues: TariffCalculationValidationIssue[] = [];

    if (row.annualAmount < 0) {
      issues.push({
        code: "Negative cost pool",
        severity: "Error",
        message: "Annual cost pool amounts must not be negative.",
        rowId: row.id,
        costPoolId: row.id
      });
    }

    if (row.recoverablePercent < 0 || row.recoverablePercent > 100) {
      issues.push({
        code: "Recoverable percentage outside range",
        severity: "Error",
        message: "Recoverable percentage must be between 0% and 100%.",
        rowId: row.id,
        costPoolId: row.id
      });
    }

    return issues;
  });

  return [...duplicateCustomerClassIssues, ...dataInputIssues, ...costPoolIssues];
}

function createClassResultMap(dataInputRows: DataInputRow[]) {
  const classResults = new Map<string, TariffCalculationClassResult>();

  dataInputRows.forEach((row) => {
    const customerClass = row.customerClass.trim();

    if (!customerClass || classResults.has(customerClass)) {
      return;
    }

    classResults.set(customerClass, createEmptyClassResult(row));
  });

  return classResults;
}

function createEmptyClassResult(row: DataInputRow): TariffCalculationClassResult {
  return {
    customerClass: row.customerClass.trim(),
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
  const classResults = createClassResultMap(dataInputRows);
  const revenueRequirement = costPoolRows.reduce(
    (total, row) => total + recoverableAmount(row),
    0
  );
  let allocatedCost = 0;
  let unbalancedAllocationCount = 0;
  const allocatedCostPoolIds = new Set<string>();
  const allocationRowsByCostPoolId = new Set<string>();
  const validationIssues: TariffCalculationValidationIssue[] = createInputValidationIssues(
    dataInputRows,
    costPoolRows
  );

  allocationRows.forEach((allocationRow) => {
    const costPool = costPoolById.get(allocationRow.costPoolId);
    if (!costPool) {
      validationIssues.push({
        code: "Missing cost pool",
        severity: "Error",
        message: "Allocation row references a cost pool that is not available for calculation.",
        rowId: allocationRow.id,
        costPoolId: allocationRow.costPoolId
      });
      return;
    }

    const recoverableCost = recoverableAmount(costPool);
    const totalShare = shareTotal(allocationRow);
    if (allocationRow.classShares.length === 0) {
      validationIssues.push({
        code: "Missing allocation shares",
        severity: "Error",
        message: "Allocation methods require at least one customer-class share.",
        rowId: allocationRow.id,
        costPoolId: allocationRow.costPoolId
      });
    }

    if (allocationRowsByCostPoolId.has(allocationRow.costPoolId)) {
      validationIssues.push({
        code: "Duplicate allocation method",
        severity: "Error",
        message: "Each cost pool should have one allocation method to avoid duplicate recovery.",
        rowId: allocationRow.id,
        costPoolId: allocationRow.costPoolId
      });
    }

    allocationRowsByCostPoolId.add(allocationRow.costPoolId);
    allocatedCostPoolIds.add(allocationRow.costPoolId);

    if (Math.abs(totalShare - 100) > 0.01) {
      unbalancedAllocationCount += 1;
      validationIssues.push({
        code: "Unbalanced allocation",
        severity: "Error",
        message: "Allocation class shares must total 100%.",
        rowId: allocationRow.id,
        costPoolId: allocationRow.costPoolId
      });
    }

    const allocationShareCustomerClasses = new Set<string>();

    allocationRow.classShares.forEach((share) => {
      const customerClass = share.customerClass.trim();
      const result = classResults.get(customerClass);
      if (!customerClass) {
        validationIssues.push({
          code: "Missing allocation share customer class",
          severity: "Error",
          message: "Allocation shares require a customer class.",
          rowId: allocationRow.id,
          costPoolId: allocationRow.costPoolId
        });
      }

      if (customerClass && allocationShareCustomerClasses.has(customerClass)) {
        validationIssues.push({
          code: "Duplicate allocation share",
          severity: "Error",
          message: "Each customer class should appear once in an allocation method.",
          rowId: allocationRow.id,
          customerClass,
          costPoolId: allocationRow.costPoolId
        });
      }

      if (customerClass) {
        allocationShareCustomerClasses.add(customerClass);
      }

      if (share.percent < 0) {
        validationIssues.push({
          code: "Negative allocation share",
          severity: "Error",
          message: "Allocation shares must not be negative.",
          rowId: allocationRow.id,
          customerClass: share.customerClass,
          costPoolId: allocationRow.costPoolId
        });
      }

      if (!result) {
        validationIssues.push({
          code: "Unknown customer class",
          severity: "Error",
          message: "Allocation row references a customer class that is not available for calculation.",
          rowId: allocationRow.id,
          customerClass: share.customerClass,
          costPoolId: allocationRow.costPoolId
        });
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

  costPoolRows.forEach((costPool) => {
    if (recoverableAmount(costPool) <= 0 || allocatedCostPoolIds.has(costPool.id)) {
      return;
    }

    validationIssues.push({
      code: "Missing allocation method",
      severity: "Error",
      message: "Recoverable cost pools require an allocation method before tariffs are complete.",
      rowId: costPool.id,
      costPoolId: costPool.id
    });
  });

  const finalClassResults = Array.from(classResults.values()).map((result) => {
    const totalAllocatedCost =
      result.fixedCost + result.energyCost + result.demandCost + result.passThroughCost;

    if (result.fixedCost > 0 && result.customerCount <= 0) {
      validationIssues.push({
        code: "Missing fixed denominator",
        severity: "Error",
        message: "Fixed charges require a customer count greater than zero.",
        customerClass: result.customerClass
      });
    }

    if (result.energyCost + result.passThroughCost > 0 && result.annualKwh <= 0) {
      validationIssues.push({
        code: "Missing consumption denominator",
        severity: "Error",
        message: "Consumption charges require annual kWh greater than zero.",
        customerClass: result.customerClass
      });
    }

    if (result.demandCost > 0 && result.peakDemandKw <= 0) {
      validationIssues.push({
        code: "Missing capacity denominator",
        severity: "Error",
        message: "Capacity charges require peak demand kW greater than zero.",
        customerClass: result.customerClass
      });
    }

    return {
      ...result,
      totalAllocatedCost,
      fixedChargePerCustomer: safeDivide(result.fixedCost, result.customerCount),
      energyChargePerKwh: safeDivide(result.energyCost + result.passThroughCost, result.annualKwh),
      demandChargePerKw: safeDivide(result.demandCost, result.peakDemandKw)
    };
  });
  const unallocatedCost = revenueRequirement - allocatedCost;

  return {
    projectId,
    revenueRequirement,
    allocatedCost,
    unallocatedCost,
    unbalancedAllocationCount,
    isRevenueRecovered: Math.abs(unallocatedCost) <= revenueRecoveryTolerance,
    validationIssues,
    classResults: finalClassResults
  };
}
