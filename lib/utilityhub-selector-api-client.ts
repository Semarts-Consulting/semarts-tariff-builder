import type {
  UtilityHubSelectorRequestScope,
  UtilityHubSelectorResource
} from "@/lib/utilityhub-selector-server-client";

export type UtilityHubSelectorApiClientRequest = {
  resource: UtilityHubSelectorResource;
  scope?: UtilityHubSelectorRequestScope;
};

export type UtilityHubSelectorApiResponse<TItem> = {
  resource: UtilityHubSelectorResource;
  endpoint?: string;
  envelope: {
    contractVersion: "utilityhub-tariff-selectors.v1";
    state: string;
    permissionStatus: string;
    message?: string;
    retrievedAt: string;
    items: TItem[];
  };
};

export type UtilityHubSelectorApiStubStatus = {
  path: string;
  state: string;
  message: string;
};

type SelectorApiResponse = {
  envelope?: {
    state?: unknown;
    message?: unknown;
  };
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
  if (scope.userId) params.set("userId", scope.userId);
  if (scope.tariffYear !== undefined) params.set("tariffYear", String(scope.tariffYear));
  if (scope.periodStart) params.set("periodStart", scope.periodStart);
  if (scope.periodEnd) params.set("periodEnd", scope.periodEnd);
  if (scope.referencePeriodStart) params.set("referencePeriodStart", scope.referencePeriodStart);
  if (scope.referencePeriodEnd) params.set("referencePeriodEnd", scope.referencePeriodEnd);
  if (scope.referenceTypes) params.set("referenceTypes", scope.referenceTypes);

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export async function readInternalUtilityHubSelectorApi<TItem>(
  request: UtilityHubSelectorApiClientRequest,
  fetcher: (input: string) => Promise<Response> = fetch
): Promise<UtilityHubSelectorApiResponse<TItem>> {
  const path = buildInternalUtilityHubSelectorApiPath(request);
  const response = await fetcher(path);

  if (!response.ok) {
    throw new Error(`Internal selector API returned ${response.status}.`);
  }

  const body: unknown = await response.json();

  if (
    typeof body !== "object" ||
    body === null ||
    !("envelope" in body) ||
    typeof (body as { resource?: unknown }).resource !== "string"
  ) {
    throw new Error("Internal selector API returned an invalid response.");
  }

  return body as UtilityHubSelectorApiResponse<TItem>;
}

function isSelectorApiResponse(value: unknown): value is SelectorApiResponse {
  return typeof value === "object" && value !== null;
}

export async function readInternalUtilityHubSelectorApiStub(
  request: UtilityHubSelectorApiClientRequest,
  fetcher: (input: string) => Promise<Response> = fetch
): Promise<UtilityHubSelectorApiStubStatus> {
  const path = buildInternalUtilityHubSelectorApiPath(request);
  const response = await fetcher(path);

  if (!response.ok) {
    return {
      path,
      state: "error",
      message: `Internal selector API returned ${response.status}.`
    };
  }

  const body: unknown = await response.json();
  const envelope = isSelectorApiResponse(body) ? body.envelope : undefined;

  return {
    path,
    state: typeof envelope?.state === "string" ? envelope.state : "unknown",
    message:
      typeof envelope?.message === "string"
        ? envelope.message
        : "Internal selector API returned no message."
  };
}
