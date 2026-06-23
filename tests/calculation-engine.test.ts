import { describe, expect, it } from "vitest";
import { calculateTariffs } from "@/lib/calculation-engine";
import type { AllocationMethodRow, CostPoolRow, DataInputRow } from "@/types/project";

const dataInputRows: DataInputRow[] = [
  {
    id: "input-residential",
    customerClass: "Residential",
    customerCount: 80,
    annualKwh: 120000,
    peakDemandKw: 300,
    notes: ""
  },
  {
    id: "input-business",
    customerClass: "Business",
    customerCount: 20,
    annualKwh: 80000,
    peakDemandKw: 200,
    notes: ""
  }
];

const costPoolRows: CostPoolRow[] = [
  {
    id: "fixed-cost",
    name: "Fixed costs",
    category: "Administration",
    annualAmount: 10000,
    recoverablePercent: 100,
    notes: ""
  },
  {
    id: "energy-cost",
    name: "Energy costs",
    category: "Network services",
    annualAmount: 20000,
    recoverablePercent: 50,
    notes: ""
  },
  {
    id: "demand-cost",
    name: "Demand costs",
    category: "Asset recovery",
    annualAmount: 15000,
    recoverablePercent: 100,
    notes: ""
  },
  {
    id: "pass-through-cost",
    name: "Pass-through costs",
    category: "Taxes and levies",
    annualAmount: 5000,
    recoverablePercent: 100,
    notes: ""
  }
];

const balancedAllocationRows: AllocationMethodRow[] = [
  {
    id: "allocation-fixed",
    costPoolId: "fixed-cost",
    costPoolName: "Fixed costs",
    basis: "Customer count",
    tariffComponent: "Fixed",
    classShares: [
      { customerClass: "Residential", percent: 80 },
      { customerClass: "Business", percent: 20 }
    ],
    notes: ""
  },
  {
    id: "allocation-energy",
    costPoolId: "energy-cost",
    costPoolName: "Energy costs",
    basis: "Annual kWh",
    tariffComponent: "Energy",
    classShares: [
      { customerClass: "Residential", percent: 60 },
      { customerClass: "Business", percent: 40 }
    ],
    notes: ""
  },
  {
    id: "allocation-demand",
    costPoolId: "demand-cost",
    costPoolName: "Demand costs",
    basis: "Peak demand",
    tariffComponent: "Demand",
    classShares: [
      { customerClass: "Residential", percent: 60 },
      { customerClass: "Business", percent: 40 }
    ],
    notes: ""
  },
  {
    id: "allocation-pass-through",
    costPoolId: "pass-through-cost",
    costPoolName: "Pass-through costs",
    basis: "Manual",
    tariffComponent: "Pass-through",
    classShares: [
      { customerClass: "Residential", percent: 50 },
      { customerClass: "Business", percent: 50 }
    ],
    notes: ""
  }
];

describe("calculateTariffs", () => {
  it("calculates recoverable revenue requirement", () => {
    const result = calculateTariffs({
      projectId: "project",
      dataInputRows,
      costPoolRows,
      allocationRows: balancedAllocationRows
    });

    expect(result.revenueRequirement).toBe(40000);
  });

  it("traces recoverable revenue requirement by cost pool", () => {
    const result = calculateTariffs({
      projectId: "project",
      dataInputRows,
      costPoolRows,
      allocationRows: balancedAllocationRows
    });
    const revenueTrace = result.auditTrace?.filter(
      (entry) => entry.stage === "Revenue requirement"
    );

    expect(revenueTrace).toHaveLength(costPoolRows.length);
    expect(revenueTrace?.map((entry) => entry.result.value).reduce((total, value) => total + value, 0)).toBe(
      result.revenueRequirement
    );
    expect(revenueTrace).toContainEqual(
      expect.objectContaining({
        id: "revenue-requirement:energy-cost",
        formula: "annualAmount * recoverablePercent / 100",
        costPoolId: "energy-cost",
        sourceRowIds: ["energy-cost"],
        result: {
          label: "Recoverable cost",
          value: 10000,
          unit: "GBP"
        }
      })
    );
  });

  it("allocates costs by tariff component and customer class", () => {
    const result = calculateTariffs({
      projectId: "project",
      dataInputRows,
      costPoolRows,
      allocationRows: balancedAllocationRows
    });
    const residential = result.classResults.find(
      (row) => row.customerClass === "Residential"
    );
    const business = result.classResults.find((row) => row.customerClass === "Business");

    expect(residential?.fixedCost).toBe(8000);
    expect(residential?.energyCost).toBe(6000);
    expect(residential?.demandCost).toBe(9000);
    expect(residential?.passThroughCost).toBe(2500);
    expect(residential?.totalAllocatedCost).toBe(25500);

    expect(business?.fixedCost).toBe(2000);
    expect(business?.energyCost).toBe(4000);
    expect(business?.demandCost).toBe(6000);
    expect(business?.passThroughCost).toBe(2500);
    expect(business?.totalAllocatedCost).toBe(14500);
  });

  it("traces cost allocation by cost pool, customer class, share, and component", () => {
    const result = calculateTariffs({
      projectId: "project",
      dataInputRows,
      costPoolRows,
      allocationRows: balancedAllocationRows
    });
    const allocationTrace = result.auditTrace?.find(
      (entry) =>
        entry.stage === "Cost allocation" &&
        entry.costPoolId === "fixed-cost" &&
        entry.customerClass === "Residential"
    );

    expect(allocationTrace).toMatchObject({
      formula: "recoverableCost * allocationPercent / 100",
      sourceRowIds: ["fixed-cost", "allocation-fixed"],
      costPoolId: "fixed-cost",
      allocationMethodId: "allocation-fixed",
      customerClass: "Residential",
      tariffComponent: "Fixed",
      result: {
        label: "Allocated cost",
        value: 8000,
        unit: "GBP"
      }
    });
    expect(allocationTrace?.inputs).toEqual([
      { label: "Recoverable cost", value: 10000, unit: "GBP" },
      { label: "Allocation percent", value: 80, unit: "Percent" }
    ]);
  });

  it("calculates indicative fixed, energy, and demand rates", () => {
    const result = calculateTariffs({
      projectId: "project",
      dataInputRows,
      costPoolRows,
      allocationRows: balancedAllocationRows
    });
    const residential = result.classResults.find(
      (row) => row.customerClass === "Residential"
    );
    const business = result.classResults.find((row) => row.customerClass === "Business");

    expect(residential?.fixedChargePerCustomer).toBe(100);
    expect(residential?.energyChargePerKwh).toBeCloseTo(0.070833, 5);
    expect(residential?.demandChargePerKw).toBe(30);

    expect(business?.fixedChargePerCustomer).toBe(100);
    expect(business?.energyChargePerKwh).toBe(0.08125);
    expect(business?.demandChargePerKw).toBe(30);
  });

  it("traces class totals and rate derivation formulas", () => {
    const result = calculateTariffs({
      projectId: "project",
      dataInputRows,
      costPoolRows,
      allocationRows: balancedAllocationRows
    });
    const residentialClassTotal = result.auditTrace?.find(
      (entry) => entry.id === "class-total:Residential"
    );
    const residentialEnergyRate = result.auditTrace?.find(
      (entry) => entry.id === "rate:Residential:energy"
    );

    expect(residentialClassTotal).toMatchObject({
      stage: "Class total",
      formula: "fixedCost + energyCost + demandCost + passThroughCost",
      dataInputRowId: "input-residential",
      customerClass: "Residential",
      result: {
        label: "Total allocated cost",
        value: 25500,
        unit: "GBP"
      }
    });
    expect(residentialEnergyRate).toMatchObject({
      stage: "Rate derivation",
      formula: "(energyCost + passThroughCost) / annualKwh",
      dataInputRowId: "input-residential",
      customerClass: "Residential",
      tariffComponent: "Energy"
    });
    expect(residentialEnergyRate?.inputs).toEqual([
      { label: "Energy cost", value: 6000, unit: "GBP" },
      { label: "Pass-through cost", value: 2500, unit: "GBP" },
      { label: "Annual kWh", value: 120000, unit: "kWh" }
    ]);
    expect(residentialEnergyRate?.result.value).toBeCloseTo(0.070833, 5);
  });

  it("flags unbalanced allocations and preserves the resulting variance", () => {
    const result = calculateTariffs({
      projectId: "project",
      dataInputRows,
      costPoolRows: [costPoolRows[0]],
      allocationRows: [
        {
          ...balancedAllocationRows[0],
          classShares: [
            { customerClass: "Residential", percent: 50 },
            { customerClass: "Business", percent: 25 }
          ]
        }
      ]
    });

    expect(result.unbalancedAllocationCount).toBe(1);
    expect(result.allocatedCost).toBe(7500);
    expect(result.unallocatedCost).toBe(2500);
    expect(result.isRevenueRecovered).toBe(false);
    expect(result.validationIssues).toContainEqual(
      expect.objectContaining({
        code: "Unbalanced allocation",
        rowId: "allocation-fixed"
      })
    );
  });

  it("warns when an allocation method requires review without changing outputs", () => {
    const reviewedResult = calculateTariffs({
      projectId: "project",
      dataInputRows,
      costPoolRows,
      allocationRows: balancedAllocationRows
    });
    const flaggedResult = calculateTariffs({
      projectId: "project",
      dataInputRows,
      costPoolRows,
      allocationRows: [
        {
          ...balancedAllocationRows[0],
          requiresReview: true
        },
        ...balancedAllocationRows.slice(1)
      ]
    });

    expect(flaggedResult.validationIssues).toContainEqual({
      code: "Allocation method requires review",
      severity: "Warning",
      message:
        "Allocation method was created automatically for a cost pool and should be reviewed before approval.",
      rowId: "allocation-fixed",
      costPoolId: "fixed-cost"
    });
    expect(flaggedResult.revenueRequirement).toBe(reviewedResult.revenueRequirement);
    expect(flaggedResult.allocatedCost).toBe(reviewedResult.allocatedCost);
    expect(flaggedResult.unallocatedCost).toBe(reviewedResult.unallocatedCost);
    expect(flaggedResult.isRevenueRecovered).toBe(reviewedResult.isRevenueRecovered);
    expect(flaggedResult.classResults).toEqual(reviewedResult.classResults);
    expect(flaggedResult.auditTrace).toEqual(reviewedResult.auditTrace);
  });

  it("does not infer allocation review warnings from missing or false review flags", () => {
    const result = calculateTariffs({
      projectId: "project",
      dataInputRows,
      costPoolRows,
      allocationRows: [
        {
          ...balancedAllocationRows[0],
          requiresReview: false
        },
        ...balancedAllocationRows.slice(1)
      ]
    });

    expect(result.validationIssues).not.toContainEqual(
      expect.objectContaining({
        code: "Allocation method requires review"
      })
    );
  });

  it("traces revenue recovery reconciliation", () => {
    const result = calculateTariffs({
      projectId: "project",
      dataInputRows,
      costPoolRows: [costPoolRows[0]],
      allocationRows: [
        {
          ...balancedAllocationRows[0],
          classShares: [
            { customerClass: "Residential", percent: 50 },
            { customerClass: "Business", percent: 25 }
          ]
        }
      ]
    });
    const revenueRecoveryTrace = result.auditTrace?.find(
      (entry) => entry.id === "revenue-recovery:project"
    );

    expect(revenueRecoveryTrace).toMatchObject({
      stage: "Revenue recovery",
      formula: "revenueRequirement - allocatedCost",
      result: {
        label: "Unallocated cost",
        value: 2500,
        unit: "GBP"
      }
    });
    expect(revenueRecoveryTrace?.inputs).toEqual([
      { label: "Revenue requirement", value: 10000, unit: "GBP" },
      { label: "Allocated cost", value: 7500, unit: "GBP" },
      { label: "Revenue recovery tolerance", value: 0.01, unit: "GBP" }
    ]);
  });

  it("ignores allocation rows without a matching cost pool", () => {
    const result = calculateTariffs({
      projectId: "project",
      dataInputRows,
      costPoolRows: [costPoolRows[0]],
      allocationRows: [
        balancedAllocationRows[0],
        {
          ...balancedAllocationRows[1],
          costPoolId: "missing"
        }
      ]
    });

    expect(result.revenueRequirement).toBe(10000);
    expect(result.allocatedCost).toBe(10000);
    expect(result.unallocatedCost).toBe(0);
    expect(result.isRevenueRecovered).toBe(true);
    expect(result.validationIssues).toContainEqual(
      expect.objectContaining({
        code: "Missing cost pool",
        costPoolId: "missing"
      })
    );
    expect(result.auditTrace).not.toContainEqual(
      expect.objectContaining({
        stage: "Cost allocation",
        costPoolId: "missing"
      })
    );
  });

  it("validates negative inputs and recoverable percentages", () => {
    const result = calculateTariffs({
      projectId: "project",
      dataInputRows: [
        {
          ...dataInputRows[0],
          customerCount: -1
        }
      ],
      costPoolRows: [
        {
          ...costPoolRows[0],
          annualAmount: -100,
          recoverablePercent: 125
        }
      ],
      allocationRows: []
    });

    expect(result.validationIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "Negative data input" }),
        expect.objectContaining({ code: "Negative cost pool" }),
        expect.objectContaining({ code: "Recoverable percentage outside range" })
      ])
    );
  });

  it("validates unknown customer classes and negative allocation shares", () => {
    const result = calculateTariffs({
      projectId: "project",
      dataInputRows,
      costPoolRows: [costPoolRows[0]],
      allocationRows: [
        {
          ...balancedAllocationRows[0],
          classShares: [
            { customerClass: "Residential", percent: 100 },
            { customerClass: "Unknown", percent: -5 }
          ]
        }
      ]
    });

    expect(result.validationIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "Negative allocation share",
          customerClass: "Unknown"
        }),
        expect.objectContaining({
          code: "Unknown customer class",
          customerClass: "Unknown"
        })
      ])
    );
  });

  it("matches allocation shares to customer classes after trimming whitespace", () => {
    const result = calculateTariffs({
      projectId: "project",
      dataInputRows,
      costPoolRows: [costPoolRows[0]],
      allocationRows: [
        {
          ...balancedAllocationRows[0],
          classShares: [
            { customerClass: " Residential ", percent: 80 },
            { customerClass: "Business", percent: 20 }
          ]
        }
      ]
    });
    const residential = result.classResults.find(
      (row) => row.customerClass === "Residential"
    );

    expect(residential?.fixedCost).toBe(8000);
    expect(result.allocatedCost).toBe(10000);
    expect(result.unallocatedCost).toBe(0);
    expect(result.validationIssues).not.toContainEqual(
      expect.objectContaining({
        code: "Unknown customer class",
        customerClass: " Residential "
      })
    );
  });

  it("validates duplicate customer classes", () => {
    const result = calculateTariffs({
      projectId: "project",
      dataInputRows: [
        dataInputRows[0],
        {
          ...dataInputRows[1],
          id: "duplicate-residential",
          customerClass: "Residential"
        }
      ],
      costPoolRows: [costPoolRows[0]],
      allocationRows: [balancedAllocationRows[0]]
    });

    expect(result.validationIssues).toContainEqual(
      expect.objectContaining({
        code: "Duplicate customer class",
        severity: "Error",
        customerClass: "Residential"
      })
    );
  });

  it("validates duplicate customer classes after trimming whitespace", () => {
    const result = calculateTariffs({
      projectId: "project",
      dataInputRows: [
        dataInputRows[0],
        {
          ...dataInputRows[1],
          id: "duplicate-residential-whitespace",
          customerClass: " Residential "
        }
      ],
      costPoolRows: [costPoolRows[0]],
      allocationRows: [balancedAllocationRows[0]]
    });

    expect(result.classResults.map((row) => row.customerClass)).toEqual(["Residential"]);
    expect(result.validationIssues).toContainEqual(
      expect.objectContaining({
        code: "Duplicate customer class",
        severity: "Error",
        customerClass: "Residential",
        rowId: "duplicate-residential-whitespace"
      })
    );
  });

  it("validates missing customer classes in data inputs", () => {
    const result = calculateTariffs({
      projectId: "project",
      dataInputRows: [
        {
          ...dataInputRows[0],
          id: "blank-customer-class",
          customerClass: " "
        }
      ],
      costPoolRows: [],
      allocationRows: []
    });

    expect(result.classResults).toHaveLength(0);
    expect(result.validationIssues).toContainEqual(
      expect.objectContaining({
        code: "Missing customer class",
        severity: "Error",
        rowId: "blank-customer-class"
      })
    );
  });

  it("validates recoverable cost pools without allocation methods", () => {
    const result = calculateTariffs({
      projectId: "project",
      dataInputRows,
      costPoolRows: [costPoolRows[0], costPoolRows[1]],
      allocationRows: [balancedAllocationRows[0]]
    });

    expect(result.unallocatedCost).toBe(10000);
    expect(result.isRevenueRecovered).toBe(false);
    expect(result.validationIssues).toContainEqual(
      expect.objectContaining({
        code: "Missing allocation method",
        severity: "Error",
        costPoolId: "energy-cost"
      })
    );
  });

  it("validates duplicate allocation methods for the same cost pool", () => {
    const result = calculateTariffs({
      projectId: "project",
      dataInputRows,
      costPoolRows: [costPoolRows[0]],
      allocationRows: [
        balancedAllocationRows[0],
        {
          ...balancedAllocationRows[0],
          id: "allocation-fixed-duplicate"
        }
      ]
    });

    expect(result.allocatedCost).toBe(20000);
    expect(result.unallocatedCost).toBe(-10000);
    expect(result.isRevenueRecovered).toBe(false);
    expect(result.validationIssues).toContainEqual(
      expect.objectContaining({
        code: "Duplicate allocation method",
        severity: "Error",
        rowId: "allocation-fixed-duplicate",
        costPoolId: "fixed-cost"
      })
    );
  });

  it("validates allocation methods without customer-class shares", () => {
    const result = calculateTariffs({
      projectId: "project",
      dataInputRows,
      costPoolRows: [costPoolRows[0]],
      allocationRows: [
        {
          ...balancedAllocationRows[0],
          classShares: []
        }
      ]
    });

    expect(result.unbalancedAllocationCount).toBe(1);
    expect(result.allocatedCost).toBe(0);
    expect(result.unallocatedCost).toBe(10000);
    expect(result.validationIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "Missing allocation shares",
          severity: "Error",
          rowId: "allocation-fixed",
          costPoolId: "fixed-cost"
        }),
        expect.objectContaining({
          code: "Unbalanced allocation",
          severity: "Error",
          rowId: "allocation-fixed",
          costPoolId: "fixed-cost"
        })
      ])
    );
  });

  it("validates missing customer classes in allocation shares", () => {
    const result = calculateTariffs({
      projectId: "project",
      dataInputRows,
      costPoolRows: [costPoolRows[0]],
      allocationRows: [
        {
          ...balancedAllocationRows[0],
          classShares: [{ customerClass: " ", percent: 100 }]
        }
      ]
    });

    expect(result.validationIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "Missing allocation share customer class",
          severity: "Error",
          rowId: "allocation-fixed",
          costPoolId: "fixed-cost"
        }),
        expect.objectContaining({
          code: "Unknown customer class",
          severity: "Error",
          customerClass: " "
        })
      ])
    );
  });

  it("validates duplicate allocation shares after trimming customer-class whitespace", () => {
    const result = calculateTariffs({
      projectId: "project",
      dataInputRows,
      costPoolRows: [costPoolRows[0]],
      allocationRows: [
        {
          ...balancedAllocationRows[0],
          classShares: [
            { customerClass: "Residential", percent: 50 },
            { customerClass: " Residential ", percent: 50 }
          ]
        }
      ]
    });

    expect(result.validationIssues).toContainEqual(
      expect.objectContaining({
        code: "Duplicate allocation share",
        severity: "Error",
        rowId: "allocation-fixed",
        customerClass: "Residential",
        costPoolId: "fixed-cost"
      })
    );
  });

  it("validates duplicate customer-class shares within an allocation method", () => {
    const result = calculateTariffs({
      projectId: "project",
      dataInputRows,
      costPoolRows: [costPoolRows[0]],
      allocationRows: [
        {
          ...balancedAllocationRows[0],
          classShares: [
            { customerClass: "Residential", percent: 50 },
            { customerClass: "Residential", percent: 50 }
          ]
        }
      ]
    });

    expect(result.unbalancedAllocationCount).toBe(0);
    expect(result.allocatedCost).toBe(10000);
    expect(result.validationIssues).toContainEqual(
      expect.objectContaining({
        code: "Duplicate allocation share",
        severity: "Error",
        rowId: "allocation-fixed",
        customerClass: "Residential",
        costPoolId: "fixed-cost"
      })
    );
  });

  it("validates missing denominators for fixed, consumption, and capacity charges", () => {
    const result = calculateTariffs({
      projectId: "project",
      dataInputRows: [
        {
          ...dataInputRows[0],
          customerCount: 0,
          annualKwh: 0,
          peakDemandKw: 0
        }
      ],
      costPoolRows: [costPoolRows[0], costPoolRows[1], costPoolRows[2]],
      allocationRows: [
        {
          ...balancedAllocationRows[0],
          classShares: [{ customerClass: "Residential", percent: 100 }]
        },
        {
          ...balancedAllocationRows[1],
          classShares: [{ customerClass: "Residential", percent: 100 }]
        },
        {
          ...balancedAllocationRows[2],
          classShares: [{ customerClass: "Residential", percent: 100 }]
        }
      ]
    });

    expect(result.validationIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "Missing fixed denominator" }),
        expect.objectContaining({ code: "Missing consumption denominator" }),
        expect.objectContaining({ code: "Missing capacity denominator" })
      ])
    );
    expect(result.auditTrace).toContainEqual(
      expect.objectContaining({
        id: "rate:Residential:fixed",
        result: {
          label: "Fixed charge per customer",
          value: 0,
          unit: "GBP per customer"
        }
      })
    );
  });
});
