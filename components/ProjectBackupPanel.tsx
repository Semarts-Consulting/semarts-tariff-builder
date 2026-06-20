"use client";

import { ChangeEvent, useRef, useState } from "react";
import {
  exportLocalProjectBackup,
  importLocalProjectBackup
} from "@/lib/project-storage";
import type { LocalProjectBackup } from "@/types/project";

function downloadBackup() {
  const backup = exportLocalProjectBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `semarts-project-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function ProjectBackupPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const backup = JSON.parse(await file.text()) as LocalProjectBackup;
      importLocalProjectBackup(backup);
      setStatus("Backup restored. Refreshing project list...");
      window.setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The backup could not be restored.");
    } finally {
      event.target.value = "";
    }
  }

  function handleExport() {
    downloadBackup();
    setStatus("Backup downloaded.");
  }

  return (
    <div className="mt-8 rounded-md border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold">Local backup</h2>
          <p className="mt-1 text-sm text-ink/70">
            Export or restore projects stored in this browser.
          </p>
          {status ? <p className="mt-2 text-sm font-medium text-semarts-dark">{status}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-md border border-line px-4 py-2 text-sm font-semibold hover:border-semarts"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-md bg-semarts px-4 py-2 text-sm font-semibold text-white hover:bg-semarts-dark"
          >
            Import JSON
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
