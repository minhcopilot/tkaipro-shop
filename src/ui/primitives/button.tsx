import type * as React from "react";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/cn";

const buttonVariants = cva(
  `
    inline-flex shrink-0 items-center justify-center gap-2 border border-transparent
    text-sm font-semibold whitespace-nowrap outline-none transition-all duration-200
    ease-out
    focus-visible:outline-2 focus-visible:outline-offset-2
    focus-visible:outline-ring
    disabled:pointer-events-none disabled:opacity-50
    aria-invalid:border-destructive
    [&_svg]:pointer-events-none [&_svg]:shrink-0
    [&_svg:not([class*='size-'])]:size-4
  `,
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: `
          h-10 rounded-xl px-4 py-2
          has-[>svg]:px-3
        `,
        icon: "size-10 rounded-xl",
        lg: `
          h-12 rounded-full px-8 text-base
          has-[>svg]:px-6
        `,
        sm: `
          h-8 gap-1.5 rounded-lg px-3
          has-[>svg]:px-2.5
        `,
      },
      variant: {
        default: `
          bg-primary text-primary-foreground shadow-soft-sm
          hover:brightness-110 hover:shadow-soft
          active:brightness-95
        `,
        destructive: `
          bg-destructive text-destructive-foreground shadow-soft-sm
          hover:brightness-110 hover:shadow-soft
          active:brightness-95
        `,
        ghost: `
          bg-transparent shadow-none
          hover:bg-accent hover:text-accent-foreground
        `,
        link: `
          bg-transparent text-primary shadow-none
          underline-offset-4
          hover:underline
        `,
        outline: `
          border-border bg-background text-foreground shadow-soft-sm
          hover:border-primary/40 hover:bg-accent hover:shadow-soft
        `,
        secondary: `
          bg-secondary text-secondary-foreground shadow-soft-sm
          hover:brightness-110 hover:shadow-soft
          active:brightness-95
        `,
      },
    },
  },
);

function Button({
  asChild = false,
  className,
  size,
  variant,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonVariants({ className, size, variant }))}
      data-slot="button"
      {...props}
    />
  );
}

export { Button, buttonVariants };
