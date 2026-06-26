"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildInternalUtilityHubSelectorApiPath,
  readInternalUtilityHubSelectorApiStub,
  type UtilityHubSelectorApiStubStatus
} from "@/lib/utilityhub-selector-api-client";
import type {
  UtilityHubSelectorRequestScope,
  UtilityHubSelectorResource
} from "@/lib/utilityhub-selector-server-client";

type UtilityHubSelectorApiStubStatusProps = {
  label: string;
  resource: UtilityHubSelectorResource;
  scope?: UtilityHubSelectorRequestScope;
};

export function UtilityHubSelectorApiStubStatus({
  label,
  resource,
  scope
}: UtilityHubSelectorApiStubStatusProps) {
  const stableScope = useMemo(
    () => ({
      customerId: scope?.customerId,
      siteId: scope?.siteId,
      tariffYear: scope?.tariffYear,
      referencePeriodStart: scope?.referencePeriodStart,
      referencePeriodEnd: scope?.referencePeriodEnd
    }),
    [
      scope?.customerId,
      scope?.siteId,
      scope?.tariffYear,
      scope?.referencePeriodStart,
      scope?.referencePeriodEnd
    ]
  );
  const path = useMemo(
    () => buildInternalUtilityHubSelectorApiPath({ resource, scope: stableScope }),
    [resource, stableScope]
  );
  const [status, setStatus] = useState<UtilityHubSelectorApiStubStatus>({
    path,
    state: "pending",
    message: "Checking internal selector API stub."
  });

  useEffect(() => {
    let isCurrent = true;

    setStatus({
      path,
      state: "pending",
      message: "Checking internal selector API stub."
    });

    readInternalUtilityHubSelectorApiStub({ resource, scope: stableScope })
      .then((nextStatus) => {
        if (isCurrent) {
          setStatus(nextStatus);
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setStatus({
            path,
            state: "error",
            message:
              error instanceof Error
                ? `Internal selector API check failed: ${error.message}`
                : "Internal selector API check failed."
          });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [path, resource, stableScope]);

  return (
    <div className="rounded-md border border-line bg-white p-3 text-sm">
      <p className="font-medium text-ink/60">{label}</p>
      <p className="mt-1 font-semibold">{status.state}</p>
      <p className="mt-1 text-ink/70">{status.message}</p>
      <p className="mt-2 break-words text-xs text-ink/50">{status.path}</p>
    </div>
  );
}
