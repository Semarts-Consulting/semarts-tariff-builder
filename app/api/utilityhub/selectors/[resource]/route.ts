import { NextResponse } from "next/server";
import { createLiveUtilityHubSelectorApiRouteResult } from "@/lib/utilityhub-selector-api-route";

type RouteContext = {
  params: Promise<{
    resource: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const params = await context.params;
  const result = await createLiveUtilityHubSelectorApiRouteResult({
    resource: params.resource,
    url: request.url
  });

  return NextResponse.json(result.body, { status: result.status });
}
