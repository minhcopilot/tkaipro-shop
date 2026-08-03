import * as React from "react";

import { cn } from "~/lib/cn";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        `
          flex field-sizing-content min-h-16 w-full rounded-md border
          border-input bg-background px-3 py-2 text-base outline-none
          transition-colors
          placeholder:text-muted-foreground
          focus-visible:border-primary focus-visible:outline-2
          focus-visible:outline-offset-2 focus-visible:outline-ring
          aria-invalid:border-destructive
          disabled:cursor-not-allowed disabled:opacity-50
          md:text-sm
        `,
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
