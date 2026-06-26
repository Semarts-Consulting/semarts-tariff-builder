import {
  fetchUtilityHubSelectorServerClientEnvelope,
  getUtilityHubSelectorServerClientEnvelope,
  type UtilityHubSelectorRequestScope,
  type UtilityHubSelectorResource
} from "@/lib/utilityhub-selector-server-client";
import {
  resolveUtilityHubSelectorClientConfig,
  type UtilityHubSelectorClientConfig
} from "@/lib/utilityhub-selector-client-config";

const selectorResources: UtilityHubSelectorResource[] = [
  "customer-site-context",
  "meters",
  "monthly-consumption",
  "boundary-meters",
  "reference-data"
];

export type UtilityHubSelectorApiRouteResult = {
  status: number;
  body: unknown;
};

export function isUtilityHubSelectorResource(
  value: string
): value is UtilityHubSelectorResource {
  return selectorResources.includes(value as UtilityHubSelectorResource);
}

export function getUtilityHubSelectorScopeFromUrl(url: string): UtilityHubSelectorRequestScope {
  const requestUrl = new URL(url);
  const tariffYear = requestUrl.searchParams.get("tariffYear");

  return {
    customerId: requestUrl.searchParams.get("customerId") ?? undefined,
    siteId: requestUrl.searchParams.get("siteId") ?? undefined,
    userId: requestUrl.searchParams.get("userId") ?? undefined,
    tariffYear: tariffYear ? Number(tariffYear) : undefined,
    periodStart: requestUrl.searchParams.get("periodStart") ?? undefined,
    periodEnd: requestUrl.searchParams.get("periodEnd") ?? undefined,
    referencePeriodStart: requestUrl.searchParams.get("referencePeriodStart") ?? undefined,
    referencePeriodEnd: requestUrl.searchParams.get("referencePeriodEnd") ?? undefined,
    referenceTypes: requestUrl.searchParams.get("referenceTypes") ?? undefined
  };
}

export function createUtilityHubSelectorApiRouteResult(input: {
  resource: string;
  url: string;
  config?: UtilityHubSelectorClientConfig;
}): UtilityHubSelectorApiRouteResult {
  if (!isUtilityHubSelectorResource(input.resource)) {
    return {
      status: 404,
      body: {
        error: `Unknown UtilityHub selector resource: ${input.resource}.`,
        allowedResources: selectorResources
      }
    };
  }

  const config = input.config ?? resolveUtilityHubSelectorClientConfig();
  const result = getUtilityHubSelectorServerClientEnvelope({
    config,
    resource: input.resource,
    scope: getUtilityHubSelectorScopeFromUrl(input.url)
  });

  return {
    status: 200,
    body: {
      resource: input.resource,
      endpoint: result.endpoint,
      envelope: result.envelope
    }
  };
}

export async function createLiveUtilityHubSelectorApiRouteResult(input: {
  resource: string;
  url: string;
  config?: UtilityHubSelectorClientConfig;
  fetcher?: (input: string) => Promise<Response>;
}): Promise<UtilityHubSelectorApiRouteResult> {
  if (!isUtilityHubSelectorResource(input.resource)) {
    return {
      status: 404,
      body: {
        error: `Unknown UtilityHub selector resource: ${input.resource}.`,
        allowedResources: selectorResources
      }
    };
  }

  const config = input.config ?? resolveUtilityHubSelectorClientConfig();
  const result = await fetchUtilityHubSelectorServerClientEnvelope({
    config,
    resource: input.resource,
    scope: getUtilityHubSelectorScopeFromUrl(input.url),
    fetcher: input.fetcher
  });

  return {
    status: 200,
    body: {
      resource: input.resource,
      endpoint: result.endpoint,
      envelope: result.envelope
    }
  };
}
