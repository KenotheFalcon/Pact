import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold ring-offset-background transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-pact-green text-white shadow-elevated hover:bg-pact-green/90 hover:shadow-float",
        destructive:
          "bg-destructive text-destructive-foreground shadow-elevated hover:bg-destructive/90 hover:shadow-float",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-subtle hover:shadow-card",
        secondary:
          "bg-secondary text-secondary-foreground shadow-elevated hover:bg-secondary/80 hover:shadow-float",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        link:
          "text-pact-green underline-offset-4 hover:underline",
        white:
          "bg-white text-foreground shadow-elevated hover:bg-muted hover:shadow-float",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-10 rounded-full px-3.5 text-xs",
        lg: "h-12 rounded-full px-6 text-base",
        xl: "h-14 rounded-full px-8 text-base font-semibold",
        icon: "h-11 w-11 rounded-full",
        "icon-sm": "h-10 w-10 rounded-full",
        "icon-lg": "h-12 w-12 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }