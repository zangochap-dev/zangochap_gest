"use client";

const STALE_SERVER_ACTION_RELOAD_KEY = "zangochap_stale_server_action_reload";

export function reloadOnStaleServerAction(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  const isStaleServerAction =
    message.includes("Failed to find Server Action") ||
    message.includes("older or newer deployment");

  if (!isStaleServerAction || typeof window === "undefined") return false;

  const alreadyReloaded = sessionStorage.getItem(STALE_SERVER_ACTION_RELOAD_KEY) === "1";
  if (alreadyReloaded) return false;

  sessionStorage.setItem(STALE_SERVER_ACTION_RELOAD_KEY, "1");
  window.location.reload();
  return true;
}

export function clearStaleServerActionReloadFlag() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STALE_SERVER_ACTION_RELOAD_KEY);
}
