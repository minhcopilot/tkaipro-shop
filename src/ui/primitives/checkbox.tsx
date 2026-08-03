"use client";

import type * as React from "react";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "~/lib/cn";

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        `
          peer size-4 shrink-0 cursor-pointer rounded-[2px] border-2
          border-border bg-background outline-none transition-colors
          focus-visible:outline-2 focus-visible:outline-offset-2
          focus-visible:outline-ring
          disabled:cursor-not-allowed disabled:opacity-50
          aria-invalid:border-destructive
          data-[state=checked]:border-border data-[state=checked]:bg-primary
          data-[state=checked]:text-primary-foreground
        `,
        className,
      )}
      data-slot="checkbox"
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={`
          flex items-center justify-center text-current transition-none
        `}
        data-slot="checkbox-indicator"
      >
        <Check className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
