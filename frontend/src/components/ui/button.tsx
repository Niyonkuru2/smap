import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-green-600 text-white hover:bg-green-700",
        destructive:
          "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-200",
        secondary:
          "bg-secondary text-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-secondary/50 hover:text-foreground text-foreground",
        link: "text-green-600 underline-offset-4 hover:underline",
        premium:
    `
    bg-white/5
    border border-white/10
    text-white
    hover:bg-white/10
    hover:border-white/20
    backdrop-blur-md
    shadow-sm
    transition-all
    duration-200
    `,
    outline:
  `
  bg-white/5
  border border-white/10
  text-white
  hover:bg-white/10
  hover:border-white/20
  backdrop-blur-md
  shadow-sm
  transition-all
  duration-200
  `,
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
    }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };

