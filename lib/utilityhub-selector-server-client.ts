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
  tariffYear?: number;
  referencePeriodStart?: string;
  referencePeriodEnd?: string;
};

export type UtilityHubSelectorServerClientResult<TItem> = {
  endpoint?: string;
  envelope: UtilityHubSelectorEnvelope<TItem>;
};

const resourcePaths: Record<UtilityHubSelectorResource, string> = {
  "customer-site-context": "tariff-selectors/customer-site-context",
  meters: "tariff-selectors/meters",
  "monthly-consumption": "tariff-selectors/monthly-consumption",
  "boundary-meters": "tariff-selectors/boundary-meters",
  "reference-data": "tariff-selectors/reference-data"
};

function appendQuery(url: URL, scope: UtilityHubSelectorRequestScope) {
  if (scope.customerId) url.searchParams.set("customerId", scope.customerId);
  if (scope.siteId) url.searchParams.set("siteId", scope.siteId);
  if (scope.tariffYear !== undefined) url.searchParams.set("tariffYear", String(scope.tariffYear));
  if (scope.referencePeriodStart) {
    url.searchParams.set("referencePeriodStart", scope.referencePeriodStart);
  }
  if (scope.referencePeriodEnd) url.searchParams.set("referencePeriodEnd", scope.referencePeriodEnd);
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
