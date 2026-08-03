"use client";

import { useEffect } from "react";
import { Button } from "~/ui/primitives/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // log error details for debugging
    console.error("[Admin Error Boundary]", {
      name: error.name,
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h2 className="mb-4 text-2xl font-bold text-red-600">
          Đã xảy ra lỗi!
        </h2>
        <div className="mb-4 rounded-lg bg-gray-100 p-4 text-left text-sm">
          <p className="font-medium">Error Details:</p>
          <p className="text-gray-600">Name: {error.name}</p>
          <p className="text-gray-600">Message: {error.message}</p>
          {error.digest && (
            <p className="text-gray-600">Digest: {error.digest}</p>
          )}
          <details className="mt-2">
            <summary className="cursor-pointer text-blue-600">
              Stack trace
            </summary>
            <pre className="mt-2 overflow-auto whitespace-pre-wrap text-xs text-gray-500">
              {error.stack}
            </pre>
          </details>
        </div>
        <Button onClick={reset}>Thử lại</Button>
      </div>
    </div>
  );
}
