"use client";

import { useEffect, useState } from "react";
import { restoreCloudOncePerSession } from "@/lib/cloud-bootstrap";
import { supabase } from "@/lib/supabase";

export function CloudRestoreOnProjects() {
  const [status, setStatus] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function restoreProjects() {
      if (!supabase) {
        return;
      }

      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        return;
      }

      try {
        const restored = await restoreCloudOncePerSession();
        if (restored && isMounted) {
          setStatus("Cloud projects restored. Refreshing...");
          window.setTimeout(() => window.location.reload(), 500);
        }
      } catch (error) {
        if (isMounted) {
          setStatus(
            error instanceof Error
              ? `Cloud restore skipped: ${error.message}`
              : "Cloud restore skipped."
          );
        }
      }
    }

    restoreProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!status) {
    return null;
  }

  return (
    <div className="mt-4 rounded-md border border-line bg-white p-4 text-sm font-medium text-semarts-dark shadow-sm">
      {status}
    </div>
  );
}
