import type * as React from "react";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/cn";

const buttonVariants = cva(
  `
    inline-flex shrink-0 items-center justify-center gap-2 border-2 border-border
    text-sm font-bold whitespace-nowrap outline-none transition-all duration-150
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
          h-10 rounded-md px-4 py-2
          has-[>svg]:px-3
        `,
        icon: "size-10 rounded-md",
        lg: `
          h-12 rounded-full px-8 text-base
          has-[>svg]:px-6
        `,
        sm: `
          h-8 gap-1.5 rounded-md px-3
          has-[>svg]:px-2.5
        `,
      },
      variant: {
        default: `
          bg-primary text-primary-foreground shadow-hard
          hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg
          active:translate-x-0 active:translate-y-0 active:shadow-hard-sm
        `,
        destructive: `
          bg-destructive text-destructive-foreground shadow-hard
          hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg
          active:translate-x-0 active:translate-y-0 active:shadow-hard-sm
        `,
        ghost: `
          border-transparent bg-transparent shadow-none
          hover:bg-accent hover:text-accent-foreground hover:border-border
        `,
        link: `
          border-transparent bg-transparent text-secondary shadow-none
          underline-offset-4
          hover:underline
        `,
        outline: `
          bg-background text-foreground shadow-hard
          hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg
          active:translate-x-0 active:translate-y-0 active:shadow-hard-sm
        `,
        secondary: `
          bg-secondary text-secondary-foreground shadow-hard
          hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg
          active:translate-x-0 active:translate-y-0 active:shadow-hard-sm
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
