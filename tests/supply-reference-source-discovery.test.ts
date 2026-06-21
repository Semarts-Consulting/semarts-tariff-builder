import { describe, expect, it } from "vitest";
import { discoverUkpnSourceLinks } from "@/lib/supply-reference-source-discovery";

describe("discoverUkpnSourceLinks", () => {
  it("extracts relevant UKPN charging links", () => {
    const result = discoverUkpnSourceLinks(
      `
        <a href="/documents/general">General document</a>
        <a href="/documents/duos-charges-2026-27.pdf">DUoS Charges 2026/27</a>
        <a href="https://example.com/statement.pdf">Charging Statement</a>
      `,
      "https://www.ukpowernetworks.co.uk/our-company/distribution-use-of-system-charges"
    );

    expect(result.matchedLinks).toHaveLength(2);
    expect(result.matchedLinks.map((link) => link.title)).toEqual([
      "Charging Statement",
      "DUoS Charges 2026/27"
    ]);
    expect(result.notes).toContain("UKPN source discovery found 2");
  });

  it("returns a manual review note when no links match", () => {
    const result = discoverUkpnSourceLinks(
      `<a href="/documents/general">General document</a>`,
      "https://www.ukpowernetworks.co.uk/our-company/distribution-use-of-system-charges"
    );

    expect(result.matchedLinks).toHaveLength(0);
    expect(result.notes).toContain("review the source page manually");
  });
});
