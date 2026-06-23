import { describe, expect, it } from "vitest";
import {
  getUtilityhubHierarchyMappingIssues,
  mapSubmetersToUtilityhubHierarchy,
  type UtilityhubHierarchyReference
} from "@/lib/utilityhub-hierarchy-mapping";
import type { SiteSubmeterRecord } from "@/types/project";

function submeter(overrides: Partial<SiteSubmeterRecord> = {}): SiteSubmeterRecord {
  return {
    id: overrides.id ?? "submeter-1",
    meter: overrides.meter ?? "MTR-MAN-T1-R1-E",
    location: overrides.location ?? "Terminal 1 Retail Unit 1",
    responsibility: overrides.responsibility ?? "Tenant",
    tenantName: overrides.tenantName ?? "Retail Tenant",
    notes: overrides.notes ?? "",
    sourceFileName: overrides.sourceFileName ?? "manual",
    uploadedAt: overrides.uploadedAt ?? "2026-06-24T00:00:00.000Z",
    importBatchId: overrides.importBatchId ?? "manual",
    rowFingerprint: overrides.rowFingerprint ?? "submeter"
  };
}

const hierarchyReference: UtilityhubHierarchyReference = {
  customerId: "customer-manchester-airport",
  customerName: "Manchester Airport",
  siteId: "site-man-airport",
  siteName: "Manchester Airport Site",
  buildingId: "building-man-terminal-1",
  buildingName: "Terminal 1",
  locationId: "location-man-t1-retail-1",
  locationName: "Terminal 1 Retail Unit 1",
  meterId: "meter-man-t1-r1-elec",
  meterReference: "MTR-MAN-T1-R1-E",
  parentMeterId: "meter-man-boundary",
  placementLevel: "Location"
};

describe("Utilityhub hierarchy mapping", () => {
  it("maps submeters to Utilityhub references by meter reference", () => {
    const [mapping] = mapSubmetersToUtilityhubHierarchy({
      submeters: [submeter()],
      hierarchyReferences: [hierarchyReference]
    });

    expect(mapping.hierarchyReference).toEqual(hierarchyReference);
    expect(mapping.issues).toEqual([]);
  });

  it("falls back to location matching when a meter reference is not available", () => {
    const [mapping] = mapSubmetersToUtilityhubHierarchy({
      submeters: [submeter({ meter: "UNMAPPED-METER" })],
      hierarchyReferences: [hierarchyReference]
    });

    expect(mapping.hierarchyReference?.locationId).toBe("location-man-t1-retail-1");
    expect(mapping.issues).toEqual([]);
  });

  it("flags unmapped meter and location values for review without inferring a customer", () => {
    const [mapping] = mapSubmetersToUtilityhubHierarchy({
      submeters: [submeter({ meter: "UNKNOWN", location: "Unknown kiosk" })],
      hierarchyReferences: [hierarchyReference]
    });

    expect(mapping.hierarchyReference).toBeUndefined();
    expect(mapping.issues.map((issue) => issue.code)).toEqual([
      "Unmapped meter",
      "Unmapped location"
    ]);
  });

  it("surfaces missing required hierarchy identifiers on matched references", () => {
    const mappings = mapSubmetersToUtilityhubHierarchy({
      submeters: [submeter()],
      hierarchyReferences: [
        {
          ...hierarchyReference,
          customerId: "",
          siteId: ""
        }
      ]
    });

    expect(getUtilityhubHierarchyMappingIssues(mappings).map((issue) => issue.code)).toEqual([
      "Missing customer",
      "Missing site"
    ]);
  });
});
