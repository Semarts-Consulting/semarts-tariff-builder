"use client";

import { useState } from "react";
import { exportLocalProjectBackup } from "@/lib/project-storage";
import { pullBackupFromSupabase, pushBackupToSupabase } from "@/lib/supabase-sync";

export function CloudSyncPanel() {
  const [status, setStatus] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  async function handlePush() {
    setIsSyncing(true);
    setStatus("");

    try {
      await pushBackupToSupabase(exportLocalProjectBackup());
      setStatus("Local projects pushed to Supabase.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Cloud push failed.");
    } finally {
      setIsSyncing(false);
    }
  }

  async function handlePull() {
    setIsSyncing(true);
    setStatus("");

    try {
      await pullBackupFromSupabase();
      setStatus("Cloud projects restored locally. Refreshing project list...");
      window.setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Cloud restore failed.");
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="mt-4 rounded-md border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold">Cloud sync</h2>
          <p className="mt-1 text-sm text-ink/70">
            Push this browser's projects to Supabase or restore your cloud copy.
          </p>
          {status ? <p className="mt-2 text-sm font-medium text-semarts-dark">{status}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePush}
            disabled={isSyncing}
            className="rounded-md border border-line px-4 py-2 text-sm font-semibold hover:border-semarts disabled:cursor-not-allowed disabled:text-ink/40"
          >
            Push to cloud
          </button>
          <button
            type="button"
            onClick={handlePull}
            disabled={isSyncing}
            className="rounded-md bg-semarts px-4 py-2 text-sm font-semibold text-white hover:bg-semarts-dark disabled:cursor-not-allowed disabled:bg-ink/30"
          >
            Restore from cloud
          </button>
        </div>
      </div>
    </div>
  );
}
