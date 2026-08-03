import type * as React from "react";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/cn";

const badgeVariants = cva(
  `
    inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden
    rounded-md border border-transparent px-2 py-0.5 text-xs font-semibold
    whitespace-nowrap transition-colors
    focus-visible:outline-2 focus-visible:outline-offset-2
    focus-visible:outline-ring
    aria-invalid:border-destructive
    [&>svg]:pointer-events-none [&>svg]:size-3
  `,
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        default: `
          bg-primary text-primary-foreground
          [a&]:hover:brightness-95
        `,
        destructive: `
          bg-destructive text-destructive-foreground
          [a&]:hover:brightness-95
        `,
        outline: `
          border-border bg-background text-foreground
          [a&]:hover:bg-accent [a&]:hover:border-primary/40
        `,
        secondary: `
          bg-secondary text-secondary-foreground
          [a&]:hover:brightness-95
        `,
      },
    },
  },
);

function Badge({
  asChild = false,
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      className={cn(badgeVariants({ variant }), className)}
      data-slot="badge"
      {...props}
    />
  );
}

export { Badge, badgeVariants };
