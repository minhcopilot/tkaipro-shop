"use client";

import { useEffect } from "react";

// build id generated at build time - changes every deployment
const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID || Date.now().toString();

/**
 * this component handles server action cache mismatch errors that occur after deployment.
 * when users have cached JavaScript from an older deployment, their server action IDs
 * don't match the new server's action IDs, causing "Cannot read properties of undefined
 * (reading 'require')" errors.
 *
 * the solution: intercept failed server action responses and force a page reload.
 */
export function ServerActionRecovery() {
  useEffect(() => {
    // check build version on mount - if mismatch, reload immediately
    const storedBuildId = sessionStorage.getItem("__BUILD_ID__");
    if (storedBuildId && storedBuildId !== BUILD_ID) {
      console.warn(
        `[ServerActionRecovery] Build ID mismatch (stored: ${storedBuildId}, current: ${BUILD_ID}), forcing reload...`
      );
      sessionStorage.setItem("__BUILD_ID__", BUILD_ID);
      // use cache-busting reload
      window.location.href = window.location.href.split("?")[0] + "?_t=" + Date.now();
      return;
    }
    sessionStorage.setItem("__BUILD_ID__", BUILD_ID);

    // store the original fetch
    const originalFetch = window.fetch;

    // track reload to prevent infinite loops
    let hasTriggeredReload = false;

    // override fetch to catch server action errors
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);

        // check if it's a POST request (server actions are always POST)
        const [input] = args;
        const isPost =
          (typeof input === "string" || input instanceof URL) &&
          args[1]?.method?.toUpperCase() === "POST";

        // if it's a failed server action, check the response body
        if (isPost && !response.ok && response.status >= 500 && !hasTriggeredReload) {
          // clone response to read body without consuming it
          const clonedResponse = response.clone();
          try {
            const text = await clonedResponse.text();

            // check for server action not found error patterns
            if (
              text.includes("Failed to find Server Action") ||
              text.includes("Cannot read properties of undefined") ||
              text.includes("older or newer deployment")
            ) {
              hasTriggeredReload = true;
              console.warn(
                "[ServerActionRecovery] Detected stale server action, forcing page reload..."
              );

              // clear the stored build ID to force fresh check
              sessionStorage.removeItem("__BUILD_ID__");

              // small delay to prevent infinite reload loops
              setTimeout(() => {
                // force hard reload with cache busting
                window.location.href = window.location.href.split("?")[0] + "?_t=" + Date.now();
              }, 100);

              // return the original response
              return response;
            }
          } catch {
            // ignore parse errors
          }
        }

        return response;
      } catch (error) {
        // rethrow the error
        throw error;
      }
    };

    // also listen for unhandled errors that might be server action related
    const handleError = (event: ErrorEvent) => {
      if (hasTriggeredReload) return;

      const message = event.message || "";
      if (
        message.includes("Failed to find Server Action") ||
        message.includes("Cannot read properties of undefined")
      ) {
        hasTriggeredReload = true;
        console.warn(
          "[ServerActionRecovery] Caught unhandled server action error, forcing reload..."
        );
        event.preventDefault();
        sessionStorage.removeItem("__BUILD_ID__");
        setTimeout(() => {
          window.location.href = window.location.href.split("?")[0] + "?_t=" + Date.now();
        }, 100);
      }
    };

    // listen for unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (hasTriggeredReload) return;

      const reason = String(event.reason || "");
      if (
        reason.includes("Failed to find Server Action") ||
        reason.includes("Cannot read properties of undefined")
      ) {
        hasTriggeredReload = true;
        console.warn(
          "[ServerActionRecovery] Caught unhandled rejection, forcing reload..."
        );
        event.preventDefault();
        sessionStorage.removeItem("__BUILD_ID__");
        setTimeout(() => {
          window.location.href = window.location.href.split("?")[0] + "?_t=" + Date.now();
        }, 100);
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      // restore original fetch on cleanup
      window.fetch = originalFetch;
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
