import type {
  UtilityHubSelectorEnvelope,
  UtilityHubSelectorPermissionStatus
} from "@/lib/utilityhub-customer-site-selector-adapter";

export type UtilityHubSelectorClientMode =
  | "local-contract-envelope"
  | "live-missing-endpoint"
  | "live-configured-not-implemented"
  | "live";

export type UtilityHubSelectorClientEnv = {
  NEXT_PUBLIC_UTILITYHUB_SELECTOR_MODE?: string;
  NEXT_PUBLIC_UTILITYHUB_SELECTOR_BASE_URL?: string;
};

export type UtilityHubSelectorClientConfig = {
  mode: UtilityHubSelectorClientMode;
  baseUrl?: string;
  message: string;
};

export function resolveUtilityHubSelectorClientConfig(
  env: UtilityHubSelectorClientEnv = {
    NEXT_PUBLIC_UTILITYHUB_SELECTOR_MODE: process.env.NEXT_PUBLIC_UTILITYHUB_SELECTOR_MODE,
    NEXT_PUBLIC_UTILITYHUB_SELECTOR_BASE_URL:
      process.env.NEXT_PUBLIC_UTILITYHUB_SELECTOR_BASE_URL
  }
): UtilityHubSelectorClientConfig {
  const requestedMode = env.NEXT_PUBLIC_UTILITYHUB_SELECTOR_MODE?.trim().toLowerCase();
  const baseUrl = env.NEXT_PUBLIC_UTILITYHUB_SELECTOR_BASE_URL?.trim();

  if (requestedMode !== "live") {
    return {
      mode: "local-contract-envelope",
      message: "UtilityHub selector client is running in local contract-envelope mode."
    };
  }

  if (!baseUrl) {
    return {
      mode: "live-missing-endpoint",
      message:
        "UtilityHub selector live mode is requested, but no selector base URL is configured."
    };
  }

  return {
    mode: "live",
    baseUrl,
    message: "UtilityHub selector live endpoint is configured."
  };
}

export function createUnavailableSelectorEnvelope<TItem>(input: {
  message: string;
  retrievedAt?: string;
  permissionStatus?: UtilityHubSelectorPermissionStatus;
}): UtilityHubSelectorEnvelope<TItem> {
  return {
    contractVersion: "utilityhub-tariff-selectors.v1",
    state: "unavailable",
    permissionStatus: input.permissionStatus ?? "read_only",
    retrievedAt: input.retrievedAt ?? new Date().toISOString(),
    message: input.message,
    items: []
  };
}
