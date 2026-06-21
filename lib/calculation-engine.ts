import type {
  AllocationMethodRow,
  CostPoolRow,
  DataInputRow,
  TariffCalculationClassResult,
  TariffCalculationResult,
  TariffCalculationTraceEntry,
  TariffCalculationTraceUnit,
  TariffCalculationTraceValue,
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

function traceValue(
  label: string,
  value: number,
  unit: TariffCalculationTraceUnit
): TariffCalculationTraceValue {
  return { label, value, unit };
}

function sourceRowIds(...rowIds: string[]) {
  return Array.from(new Set(rowIds.filter(Boolean)));
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
  const dataInputRowByCustomerClass = new Map(
    dataInputRows
      .filter((row) => row.customerClass.trim())
      .map((row) => [row.customerClass.trim(), row])
  );
  const classSourceRowIds = new Map<string, Set<string>>();
  const auditTrace: TariffCalculationTraceEntry[] = [];
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

  costPoolRows.forEach((costPool) => {
    const recoverableCost = recoverableAmount(costPool);

    auditTrace.push({
      id: `revenue-requirement:${costPool.id}`,
      stage: "Revenue requirement",
      label: `${costPool.name || costPool.id} recoverable cost`,
      formula: "annualAmount * recoverablePercent / 100",
      inputs: [
        traceValue("Annual amount", costPool.annualAmount, "GBP"),
        traceValue("Recoverable percent", costPool.recoverablePercent, "Percent")
      ],
      result: traceValue("Recoverable cost", recoverableCost, "GBP"),
      sourceRowIds: [costPool.id],
      costPoolId: costPool.id
    });
  });

  allocationRows.forEach((allocationRow) => {
    if (allocationRow.requiresReview === true) {
      validationIssues.push({
        code: "Allocation method requires review",
        severity: "Warning",
        message:
          "Allocation method was created automatically for a cost pool and should be reviewed before approval.",
        rowId: allocationRow.id,
        costPoolId: allocationRow.costPoolId
      });
    }

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
      const existingSourceRowIds =
        classSourceRowIds.get(result.customerClass) ?? new Set<string>();

      existingSourceRowIds.add(costPool.id);
      existingSourceRowIds.add(allocationRow.id);
      classSourceRowIds.set(result.customerClass, existingSourceRowIds);

      auditTrace.push({
        id: `allocation:${allocationRow.id}:${result.customerClass}:${auditTrace.length}`,
        stage: "Cost allocation",
        label: `${costPool.name || costPool.id} allocated to ${result.customerClass}`,
        formula: "recoverableCost * allocationPercent / 100",
        inputs: [
          traceValue("Recoverable cost", recoverableCost, "GBP"),
          traceValue("Allocation percent", share.percent, "Percent")
        ],
        result: traceValue("Allocated cost", allocatedShare, "GBP"),
        sourceRowIds: sourceRowIds(costPool.id, allocationRow.id),
        costPoolId: costPool.id,
        allocationMethodId: allocationRow.id,
        customerClass: result.customerClass,
        tariffComponent: allocationRow.tariffComponent
      });

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
    const dataInputRow = dataInputRowByCustomerClass.get(result.customerClass);
    const classTraceSourceRowIds = sourceRowIds(
      dataInputRow?.id ?? "",
      ...(Array.from(classSourceRowIds.get(result.customerClass) ?? []))
    );

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

    const finalResult = {
      ...result,
      totalAllocatedCost,
      fixedChargePerCustomer: safeDivide(result.fixedCost, result.customerCount),
      energyChargePerKwh: safeDivide(result.energyCost + result.passThroughCost, result.annualKwh),
      demandChargePerKw: safeDivide(result.demandCost, result.peakDemandKw)
    };

    auditTrace.push({
      id: `class-total:${result.customerClass}`,
      stage: "Class total",
      label: `${result.customerClass} total allocated cost`,
      formula: "fixedCost + energyCost + demandCost + passThroughCost",
      inputs: [
        traceValue("Fixed cost", result.fixedCost, "GBP"),
        traceValue("Energy cost", result.energyCost, "GBP"),
        traceValue("Demand cost", result.demandCost, "GBP"),
        traceValue("Pass-through cost", result.passThroughCost, "GBP")
      ],
      result: traceValue("Total allocated cost", finalResult.totalAllocatedCost, "GBP"),
      sourceRowIds: classTraceSourceRowIds,
      dataInputRowId: dataInputRow?.id,
      customerClass: result.customerClass
    });

    auditTrace.push(
      {
        id: `rate:${result.customerClass}:fixed`,
        stage: "Rate derivation",
        label: `${result.customerClass} fixed charge per customer`,
        formula: "fixedCost / customerCount",
        inputs: [
          traceValue("Fixed cost", result.fixedCost, "GBP"),
          traceValue("Customer count", result.customerCount, "Customers")
        ],
        result: traceValue(
          "Fixed charge per customer",
          finalResult.fixedChargePerCustomer,
          "GBP per customer"
        ),
        sourceRowIds: classTraceSourceRowIds,
        dataInputRowId: dataInputRow?.id,
        customerClass: result.customerClass,
        tariffComponent: "Fixed"
      },
      {
        id: `rate:${result.customerClass}:energy`,
        stage: "Rate derivation",
        label: `${result.customerClass} energy charge per kWh`,
        formula: "(energyCost + passThroughCost) / annualKwh",
        inputs: [
          traceValue("Energy cost", result.energyCost, "GBP"),
          traceValue("Pass-through cost", result.passThroughCost, "GBP"),
          traceValue("Annual kWh", result.annualKwh, "kWh")
        ],
        result: traceValue(
          "Energy charge per kWh",
          finalResult.energyChargePerKwh,
          "GBP per kWh"
        ),
        sourceRowIds: classTraceSourceRowIds,
        dataInputRowId: dataInputRow?.id,
        customerClass: result.customerClass,
        tariffComponent: "Energy"
      },
      {
        id: `rate:${result.customerClass}:demand`,
        stage: "Rate derivation",
        label: `${result.customerClass} demand charge per kW`,
        formula: "demandCost / peakDemandKw",
        inputs: [
          traceValue("Demand cost", result.demandCost, "GBP"),
          traceValue("Peak demand kW", result.peakDemandKw, "kW")
        ],
        result: traceValue(
          "Demand charge per kW",
          finalResult.demandChargePerKw,
          "GBP per kW"
        ),
        sourceRowIds: classTraceSourceRowIds,
        dataInputRowId: dataInputRow?.id,
        customerClass: result.customerClass,
        tariffComponent: "Demand"
      }
    );

    return finalResult;
  });
  const unallocatedCost = revenueRequirement - allocatedCost;

  auditTrace.push({
    id: `revenue-recovery:${projectId}`,
    stage: "Revenue recovery",
    label: "Revenue recovery reconciliation",
    formula: "revenueRequirement - allocatedCost",
    inputs: [
      traceValue("Revenue requirement", revenueRequirement, "GBP"),
      traceValue("Allocated cost", allocatedCost, "GBP"),
      traceValue("Revenue recovery tolerance", revenueRecoveryTolerance, "GBP")
    ],
    result: traceValue("Unallocated cost", unallocatedCost, "GBP"),
    sourceRowIds: sourceRowIds(
      ...costPoolRows.map((row) => row.id),
      ...allocationRows.map((row) => row.id)
    )
  });

  return {
    projectId,
    revenueRequirement,
    allocatedCost,
    unallocatedCost,
    unbalancedAllocationCount,
    isRevenueRecovered: Math.abs(unallocatedCost) <= revenueRecoveryTolerance,
    validationIssues,
    auditTrace,
    classResults: finalClassResults
  };
}
