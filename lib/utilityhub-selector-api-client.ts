import type {
  UtilityHubSelectorRequestScope,
  UtilityHubSelectorResource
} from "@/lib/utilityhub-selector-server-client";

export type UtilityHubSelectorApiClientRequest = {
  resource: UtilityHubSelectorResource;
  scope?: UtilityHubSelectorRequestScope;
};

export function buildInternalUtilityHubSelectorApiPath(
  request: UtilityHubSelectorApiClientRequest
): string {
  const path = `/api/utilityhub/selectors/${request.resource}`;
  const params = new URLSearchParams();
  const scope = request.scope;

  if (!scope) {
    return path;
  }

  if (scope.customerId) params.set("customerId", scope.customerId);
  if (scope.siteId) params.set("siteId", scope.siteId);
  if (scope.tariffYear !== undefined) params.set("tariffYear", String(scope.tariffYear));
  if (scope.referencePeriodStart) params.set("referencePeriodStart", scope.referencePeriodStart);
  if (scope.referencePeriodEnd) params.set("referencePeriodEnd", scope.referencePeriodEnd);

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
