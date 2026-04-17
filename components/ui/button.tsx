import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap transition-all outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Get Easy custom styles (public site)
        default:
          "border-2 border-black bg-black text-green hover:bg-black/90 active:scale-95 rounded-xl font-title cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-80",
        outline:
          "border-2 border-black bg-transparent text-black hover:bg-black hover:text-green active:scale-95 rounded-xl font-title cursor-pointer",
        red:
          "border-2 border-red-500 bg-red-500 text-white hover:bg-red-600 hover:border-red-600 active:scale-95 rounded-xl font-title cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-80",
        ghost:
          "font-sans",
        link: "text-primary underline-offset-4 hover:underline",
        // Shadcn standard styles (admin dashboard)
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 rounded-md text-sm font-medium focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md text-sm font-medium",
        "admin-default":
          "bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "admin-outline":
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium",
        "admin-ghost":
          "hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium",
      },
      size: {
        default: "px-4 py-3 text-base",
        ghost: "p-0",
        xs: "px-3 py-1.5 rounded-lg text-xs",
        sm: "px-3 py-2 rounded-lg text-sm",
        lg: "px-6 py-4 text-base",
        icon: "size-10",
        // Shadcn standard sizes (admin dashboard)
        "admin-default": "h-9 px-4 py-2 has-[>svg]:px-3",
        "admin-xs": "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        "admin-sm": "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        "admin-lg": "h-10 rounded-md px-6 has-[>svg]:px-4",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
