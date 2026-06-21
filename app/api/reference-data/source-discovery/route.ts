import { NextResponse } from "next/server";
import { discoverUkpnSourceLinks } from "@/lib/supply-reference-source-discovery";

type SourceDiscoveryRequest = {
  distributorId?: string;
  sourceUrl?: string;
};

function isSourceDiscoveryRequest(value: unknown): value is SourceDiscoveryRequest {
  return typeof value === "object" && value !== null;
}

export async function POST(request: Request) {
  const body: unknown = await request.json();

  if (!isSourceDiscoveryRequest(body) || !body.distributorId || !body.sourceUrl) {
    return NextResponse.json(
      { error: "Distributor ID and source URL are required." },
      { status: 400 }
    );
  }

  if (!["10", "12", "19"].includes(body.distributorId)) {
    return NextResponse.json(
      { error: "Source discovery is currently only available for UKPN network areas." },
      { status: 400 }
    );
  }

  const response = await fetch(body.sourceUrl, {
    headers: {
      "User-Agent": "Semarts Tariff Builder source discovery"
    }
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: `Source page fetch failed with status ${response.status}.` },
      { status: 502 }
    );
  }

  const html = await response.text();
  return NextResponse.json(discoverUkpnSourceLinks(html, body.sourceUrl));
}
