import { pullBackupFromSupabase } from "@/lib/supabase-sync";

const restoreFlag = "semarts.cloud-restored";

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function clearCloudRestoreFlag() {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.removeItem(restoreFlag);
}

export async function restoreCloudOncePerSession() {
  if (!canUseSessionStorage()) {
    return false;
  }

  if (window.sessionStorage.getItem(restoreFlag) === "true") {
    return false;
  }

  await pullBackupFromSupabase();
  window.sessionStorage.setItem(restoreFlag, "true");
  return true;
}
