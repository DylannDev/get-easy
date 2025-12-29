import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl gap-2 whitespace-nowrap font-title transition-all disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-80 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black",
  {
    variants: {
      variant: {
        default: "bg-black text-green hover:bg-black/90 active:scale-95",
        outline:
          "border-2 border-black bg-transparent text-black hover:bg-black hover:text-green active:scale-95",
        ghost: "font-sans",
      },
      size: {
        default: "px-4 py-3 text-base",
        ghost: "p-0",
        xs: "px-3 py-1.5 rounded-lg text-xs",
        sm: "px-3 py-2 rounded-lg text-sm",
        lg: "px-6 py-4 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
