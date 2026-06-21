import { describe, expect, it } from "vitest";
import { reconcileAllocationMethodsWithCostPools } from "@/lib/project-storage";
import type { ProjectAllocationMethods, ProjectCostPools } from "@/types/project";

const costPools: ProjectCostPools = {
  projectId: "project",
  assumptions: "",
  lastUpdated: "",
  rows: [
    {
      id: "cost-existing",
      name: "Existing renamed pool",
      category: "Operations",
      annualAmount: 1000,
      recoverablePercent: 100,
      notes: ""
    },
    {
      id: "cost-new",
      name: "New pool",
      category: "Administration",
      annualAmount: 500,
      recoverablePercent: 100,
      notes: ""
    }
  ]
};

const allocationMethods: ProjectAllocationMethods = {
  projectId: "project",
  assumptions: "Allocation assumptions",
  lastUpdated: "",
  rows: [
    {
      id: "allocation-existing",
      costPoolId: "cost-existing",
      costPoolName: "Old pool name",
      basis: "Manual",
      tariffComponent: "Energy",
      classShares: [
        { customerClass: "Residential", percent: 70 },
        { customerClass: "Business", percent: 30 }
      ],
      notes: "Keep this rule"
    },
    {
      id: "allocation-stale",
      costPoolId: "cost-stale",
      costPoolName: "Deleted pool",
      basis: "Manual",
      tariffComponent: "Fixed",
      classShares: [{ customerClass: "Residential", percent: 100 }],
      notes: ""
    }
  ]
};

describe("reconcileAllocationMethodsWithCostPools", () => {
  it("preserves matching allocation rules and refreshes cost pool names", () => {
    const result = reconcileAllocationMethodsWithCostPools(
      "project",
      allocationMethods,
      costPools
    );

    expect(result.rows[0]).toMatchObject({
      id: "allocation-existing",
      costPoolId: "cost-existing",
      costPoolName: "Existing renamed pool",
      basis: "Manual",
      tariffComponent: "Energy",
      notes: "Keep this rule",
      requiresReview: false
    });
    expect(result.rows[0]?.classShares).toEqual([
      { customerClass: "Residential", percent: 70 },
      { customerClass: "Business", percent: 30 }
    ]);
  });

  it("creates allocation rules for new cost pools and drops stale pool references", () => {
    const result = reconcileAllocationMethodsWithCostPools(
      "project",
      allocationMethods,
      costPools
    );

    expect(result.rows).toHaveLength(2);
    expect(result.rows.map((row) => row.costPoolId)).toEqual([
      "cost-existing",
      "cost-new"
    ]);
    expect(result.rows[1]).toMatchObject({
      costPoolId: "cost-new",
      costPoolName: "New pool",
      basis: "Customer count",
      tariffComponent: "Fixed",
      requiresReview: true
    });
  });

  it("preserves existing review flags for matching allocation rows", () => {
    const reviewedAllocationMethods: ProjectAllocationMethods = {
      ...allocationMethods,
      rows: [
        {
          ...allocationMethods.rows[0],
          requiresReview: true
        }
      ]
    };

    const result = reconcileAllocationMethodsWithCostPools(
      "project",
      reviewedAllocationMethods,
      {
        ...costPools,
        rows: [costPools.rows[0]]
      }
    );

    expect(result.rows[0]).toMatchObject({
      costPoolId: "cost-existing",
      requiresReview: true
    });
  });

  it("preserves existing rows that have already been reviewed", () => {
    const reviewedAllocationMethods: ProjectAllocationMethods = {
      ...allocationMethods,
      rows: [
        {
          ...allocationMethods.rows[0],
          requiresReview: false
        }
      ]
    };

    const result = reconcileAllocationMethodsWithCostPools(
      "project",
      reviewedAllocationMethods,
      {
        ...costPools,
        rows: [costPools.rows[0]]
      }
    );

    expect(result.rows[0]).toMatchObject({
      costPoolId: "cost-existing",
      requiresReview: false
    });
  });

  it("defaults missing review flags on existing rows to false", () => {
    const result = reconcileAllocationMethodsWithCostPools(
      "project",
      allocationMethods,
      {
        ...costPools,
        rows: [costPools.rows[0]]
      }
    );

    expect(result.rows[0]).toMatchObject({
      costPoolId: "cost-existing",
      requiresReview: false
    });
  });
});
