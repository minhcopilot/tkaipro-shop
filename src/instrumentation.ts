export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // server-side error logging
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      const errorString = args.map((arg) => String(arg)).join(" ");

      // suppress verbose logging for server action cache mismatch errors
      // these are expected after deployment and handled client-side
      const isServerActionCacheMismatch =
        (errorString.includes("Cannot read properties of undefined") &&
          errorString.includes("require")) ||
        errorString.includes("Failed to find Server Action");

      // suppress NEXT_REDIRECT and NEXT_NOT_FOUND - these are control flow, not real errors
      const isNextControlFlow =
        errorString.includes("NEXT_REDIRECT") ||
        errorString.includes("NEXT_NOT_FOUND");

      if (isServerActionCacheMismatch || isNextControlFlow) {
        // skip verbose debug logging for these expected errors
        return;
      }

      // log other errors normally
      originalConsoleError(...args);
    };

    // global uncaught exception handler
    process.on("uncaughtException", (error) => {
      // skip server action cache mismatch errors
      if (
        error.message.includes("Cannot read properties of undefined") ||
        error.message.includes("Failed to find Server Action")
      ) {
        return;
      }
      console.error(`[UNCAUGHT EXCEPTION ${new Date().toISOString()}]`);
      console.error("Error:", error);
      console.error("Stack:", error.stack);
      if (error.cause) {
        console.error("Cause:", error.cause);
      }
    });

    // global unhandled rejection handler
    process.on("unhandledRejection", (reason, promise) => {
      const reasonStr = String(reason || "");
      // skip server action cache mismatch errors
      if (
        reasonStr.includes("Cannot read properties of undefined") ||
        reasonStr.includes("Failed to find Server Action")
      ) {
        return;
      }
      console.error(`[UNHANDLED REJECTION ${new Date().toISOString()}]`);
      console.error("Reason:", reason);
      console.error("Promise:", promise);
    });

    console.log("[Instrumentation] Server-side error logging enabled");
  }
}

// next.js 15 onRequestError hook - catches more detailed request info
export async function onRequestError(
  error: Error,
  request: {
    method: string;
    path: string;
    headers?: Record<string, string | string[]>;
  },
  context: {
    routerKind: "Pages Router" | "App Router";
    routePath: string;
    routeType: "render" | "route" | "action" | "middleware";
    renderSource?: "react-server-components" | "react-server-components-payload" | string;
    revalidateReason?: "on-demand" | "stale" | "force-cache" | string;
    renderType?: "static" | "dynamic";
  }
) {
  // suppress expected server action errors
  const isServerActionCacheMismatch =
    context.routeType === "action" &&
    (error.message.includes("Cannot read properties of undefined") ||
      error.message.includes("require"));

  // NEXT_REDIRECT is not actually an error - it's how Next.js handles redirects in server actions
  const isNextRedirect = error.message === "NEXT_REDIRECT";

  // NEXT_NOT_FOUND is also not an error - it's how Next.js handles notFound() in server actions
  const isNextNotFound = error.message === "NEXT_NOT_FOUND";

  if (isServerActionCacheMismatch) {
    // silently ignore - these are expected after deployment and flood logs
    return;
  }

  // skip logging for redirect/notFound - these are expected control flow, not errors
  if (isNextRedirect || isNextNotFound) {
    return;
  }

  // log other errors with full details
  const timestamp = new Date().toISOString();
  console.error(`\n[REQUEST ERROR ${timestamp}]`);
  console.error("Request:", {
    method: request.method,
    path: request.path,
  });
  console.error("Context:", context);
  console.error("Error:", {
    name: error.name,
    message: error.message,
    stack: error.stack,
    cause: error.cause,
  });
}
