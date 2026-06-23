import { describe, expect, it } from "vitest";
import {
  createDefaultSupplyReferenceData,
  getDnoNetworkAreaForMpan
} from "@/lib/project-storage";

describe("getDnoNetworkAreaForMpan", () => {
  it("normalises formatted MPANs before matching the distributor ID", () => {
    const referenceData = createDefaultSupplyReferenceData();

    const networkArea = getDnoNetworkAreaForMpan("10 0000 0000 000", referenceData);

    expect(networkArea).toMatchObject({
      distributorId: "10",
      dnoName: "UK Power Networks",
      networkArea: "Eastern England",
      operatorCode: "EPN"
    });
  });

  it("returns undefined for incomplete MPANs", () => {
    const referenceData = createDefaultSupplyReferenceData();

    expect(getDnoNetworkAreaForMpan("1", referenceData)).toBeUndefined();
  });

  it("returns undefined for distributor prefixes outside configured network areas", () => {
    const referenceData = createDefaultSupplyReferenceData();

    expect(getDnoNetworkAreaForMpan("9900000000000", referenceData)).toBeUndefined();
  });
});
