import {
  createUnavailableSelectorEnvelope,
  type UtilityHubSelectorClientConfig
} from "@/lib/utilityhub-selector-client-config";
import type { UtilityHubSelectorEnvelope } from "@/lib/utilityhub-customer-site-selector-adapter";

export type UtilityHubSelectorResource =
  | "customer-site-context"
  | "meters"
  | "monthly-consumption"
  | "boundary-meters"
  | "reference-data";

export type UtilityHubSelectorRequestScope = {
  customerId?: string;
  siteId?: string;
  userId?: string;
  tariffYear?: number;
  periodStart?: string;
  periodEnd?: string;
  referencePeriodStart?: string;
  referencePeriodEnd?: string;
  referenceTypes?: string;
};

export type UtilityHubSelectorServerClientResult<TItem> = {
  endpoint?: string;
  envelope: UtilityHubSelectorEnvelope<TItem>;
};

const resourcePaths: Record<UtilityHubSelectorResource, string> = {
  "customer-site-context": "customer-site-context",
  meters: "meters",
  "monthly-consumption": "monthly-consumption",
  "boundary-meters": "boundary-meters",
  "reference-data": "reference-data"
};

function appendQuery(url: URL, scope: UtilityHubSelectorRequestScope) {
  if (scope.customerId) url.searchParams.set("customerId", scope.customerId);
  if (scope.siteId) url.searchParams.set("siteId", scope.siteId);
  if (scope.userId) url.searchParams.set("userId", scope.userId);
  if (scope.tariffYear !== undefined) url.searchParams.set("tariffYear", String(scope.tariffYear));
  if (scope.periodStart) url.searchParams.set("periodStart", scope.periodStart);
  if (scope.periodEnd) url.searchParams.set("periodEnd", scope.periodEnd);
  if (scope.referencePeriodStart) {
    url.searchParams.set("referencePeriodStart", scope.referencePeriodStart);
  }
  if (scope.referencePeriodEnd) url.searchParams.set("referencePeriodEnd", scope.referencePeriodEnd);
  if (scope.referenceTypes) url.searchParams.set("referenceTypes", scope.referenceTypes);
}

export function buildUtilityHubSelectorEndpoint(input: {
  baseUrl: string;
  resource: UtilityHubSelectorResource;
  scope?: UtilityHubSelectorRequestScope;
}): string {
  const baseUrl = input.baseUrl.endsWith("/") ? input.baseUrl : `${input.baseUrl}/`;
  const url = new URL(resourcePaths[input.resource], baseUrl);
  appendQuery(url, input.scope ?? {});
  return url.toString();
}

export function getUtilityHubSelectorServerClientEnvelope<TItem>(input: {
  config: UtilityHubSelectorClientConfig;
  resource: UtilityHubSelectorResource;
  scope?: UtilityHubSelectorRequestScope;
  retrievedAt?: string;
}): UtilityHubSelectorServerClientResult<TItem> {
  if (input.config.mode === "local-contract-envelope") {
    return {
      envelope: createUnavailableSelectorEnvelope<TItem>({
        message:
          "UtilityHub selector server client is in local contract-envelope mode; no live endpoint was called.",
        retrievedAt: input.retrievedAt
      })
    };
  }

  if (input.config.mode === "live-missing-endpoint" || !input.config.baseUrl) {
    return {
      envelope: createUnavailableSelectorEnvelope<TItem>({
        message: input.config.message,
        retrievedAt: input.retrievedAt
      })
    };
  }

  const endpoint = buildUtilityHubSelectorEndpoint({
    baseUrl: input.config.baseUrl,
    resource: input.resource,
    scope: input.scope
  });

  return {
    endpoint,
    envelope: createUnavailableSelectorEnvelope<TItem>({
      message:
        "UtilityHub selector endpoint was resolved, but live network retrieval is intentionally not implemented yet.",
      retrievedAt: input.retrievedAt
    })
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSelectorEnvelope<TItem>(value: unknown): value is UtilityHubSelectorEnvelope<TItem> {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.contractVersion === "utilityhub-tariff-selectors.v1" &&
    typeof value.state === "string" &&
    typeof value.permissionStatus === "string" &&
    typeof value.retrievedAt === "string" &&
    Array.isArray(value.items)
  );
}

export async function fetchUtilityHubSelectorServerClientEnvelope<TItem>(input: {
  config: UtilityHubSelectorClientConfig;
  resource: UtilityHubSelectorResource;
  scope?: UtilityHubSelectorRequestScope;
  retrievedAt?: string;
  fetcher?: (input: string) => Promise<Response>;
}): Promise<UtilityHubSelectorServerClientResult<TItem>> {
  if (input.config.mode !== "live" || !input.config.baseUrl) {
    return getUtilityHubSelectorServerClientEnvelope(input);
  }

  const endpoint = buildUtilityHubSelectorEndpoint({
    baseUrl: input.config.baseUrl,
    resource: input.resource,
    scope: input.scope
  });
  const fetcher = input.fetcher ?? fetch;

  try {
    const response = await fetcher(endpoint);

    if (!response.ok) {
      return {
        endpoint,
        envelope: createUnavailableSelectorEnvelope<TItem>({
          message: `UtilityHub selector fetch failed with status ${response.status}.`,
          retrievedAt: input.retrievedAt
        })
      };
    }

    const body: unknown = await response.json();

    if (!isSelectorEnvelope<TItem>(body)) {
      return {
        endpoint,
        envelope: createUnavailableSelectorEnvelope<TItem>({
          message: "UtilityHub selector response did not match the expected envelope contract.",
          retrievedAt: input.retrievedAt
        })
      };
    }

    return {
      endpoint,
      envelope: body
    };
  } catch (error) {
    return {
      endpoint,
      envelope: createUnavailableSelectorEnvelope<TItem>({
        message:
          error instanceof Error
            ? `UtilityHub selector fetch failed: ${error.message}`
            : "UtilityHub selector fetch failed.",
        retrievedAt: input.retrievedAt
      })
    };
  }
}
