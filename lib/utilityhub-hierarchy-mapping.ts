import type { SiteSubmeterRecord } from "@/types/project";

export type UtilityhubMeterPlacementLevel = "Site" | "Building" | "Location";

export type UtilityhubHierarchyReference = {
  customerId: string;
  customerName: string;
  siteId: string;
  siteName: string;
  buildingId?: string;
  buildingName?: string;
  locationId?: string;
  locationName?: string;
  meterId?: string;
  meterReference?: string;
  parentMeterId?: string;
  placementLevel: UtilityhubMeterPlacementLevel;
};

export type UtilityhubHierarchyMappingIssue = {
  code:
    | "Missing meter"
    | "Missing location"
    | "Unmapped meter"
    | "Unmapped location"
    | "Missing customer"
    | "Missing site";
  severity: "Error" | "Warning";
  message: string;
  submeterId: string;
  meter?: string;
  location?: string;
};

export type UtilityhubSubmeterMapping = {
  submeterId: string;
  meter: string;
  responsibility: SiteSubmeterRecord["responsibility"];
  tenantName: string;
  hierarchyReference?: UtilityhubHierarchyReference;
  issues: UtilityhubHierarchyMappingIssue[];
};

export type UtilityhubSubmeterMappingInput = {
  submeters: SiteSubmeterRecord[];
  hierarchyReferences: UtilityhubHierarchyReference[];
};

function normaliseKey(value: string) {
  return value.trim().toLowerCase();
}

function hasText(value: string | undefined) {
  return value !== undefined && value.trim() !== "";
}

export function mapSubmetersToUtilityhubHierarchy({
  submeters,
  hierarchyReferences
}: UtilityhubSubmeterMappingInput): UtilityhubSubmeterMapping[] {
  const referencesByMeter = new Map(
    hierarchyReferences
      .filter((reference) => hasText(reference.meterReference))
      .map((reference) => [normaliseKey(reference.meterReference ?? ""), reference])
  );
  const referencesByLocation = new Map(
    hierarchyReferences
      .filter((reference) => hasText(reference.locationName))
      .map((reference) => [normaliseKey(reference.locationName ?? ""), reference])
  );

  return submeters.map((submeter) => {
    const issues: UtilityhubHierarchyMappingIssue[] = [];

    if (!hasText(submeter.meter)) {
      issues.push({
        code: "Missing meter",
        severity: "Error",
        message: "Submeter record is missing a meter reference.",
        submeterId: submeter.id,
        location: submeter.location
      });
    }

    if (!hasText(submeter.location)) {
      issues.push({
        code: "Missing location",
        severity: "Warning",
        message: "Submeter record is missing a location for Utilityhub hierarchy mapping.",
        submeterId: submeter.id,
        meter: submeter.meter
      });
    }

    const reference =
      referencesByMeter.get(normaliseKey(submeter.meter)) ??
      referencesByLocation.get(normaliseKey(submeter.location));

    if (!reference && hasText(submeter.meter)) {
      issues.push({
        code: "Unmapped meter",
        severity: "Warning",
        message: "Submeter meter reference does not currently match a Utilityhub meter.",
        submeterId: submeter.id,
        meter: submeter.meter,
        location: submeter.location
      });
    }

    if (!reference && hasText(submeter.location)) {
      issues.push({
        code: "Unmapped location",
        severity: "Warning",
        message: "Submeter location does not currently match a Utilityhub location.",
        submeterId: submeter.id,
        meter: submeter.meter,
        location: submeter.location
      });
    }

    if (reference && !hasText(reference.customerId)) {
      issues.push({
        code: "Missing customer",
        severity: "Error",
        message: "Matched Utilityhub reference is missing a customer ID.",
        submeterId: submeter.id,
        meter: submeter.meter,
        location: submeter.location
      });
    }

    if (reference && !hasText(reference.siteId)) {
      issues.push({
        code: "Missing site",
        severity: "Error",
        message: "Matched Utilityhub reference is missing a site ID.",
        submeterId: submeter.id,
        meter: submeter.meter,
        location: submeter.location
      });
    }

    return {
      submeterId: submeter.id,
      meter: submeter.meter,
      responsibility: submeter.responsibility,
      tenantName: submeter.tenantName,
      hierarchyReference: reference,
      issues
    };
  });
}

export function getUtilityhubHierarchyMappingIssues(mappings: UtilityhubSubmeterMapping[]) {
  return mappings.flatMap((mapping) => mapping.issues);
}
