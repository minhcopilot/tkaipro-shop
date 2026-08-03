import type * as React from "react";

import { cn } from "~/lib/cn";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        `
          flex h-10 w-full min-w-0 rounded-xl border border-input
          bg-background px-3 py-1 text-base outline-none transition-colors
          selection:bg-primary selection:text-primary-foreground
          file:inline-flex file:h-7 file:border-0 file:bg-transparent
          file:text-sm file:font-medium file:text-foreground
          placeholder:text-muted-foreground
          disabled:pointer-events-none disabled:cursor-not-allowed
          disabled:opacity-50
          md:text-sm
        `,
        `
          focus-visible:border-ring focus-visible:outline-2
          focus-visible:outline-offset-2 focus-visible:outline-ring
        `,
        `
          aria-invalid:border-destructive
        `,
        className,
      )}
      data-slot="input"
      type={type}
      {...props}
    />
  );
}

export { Input };
