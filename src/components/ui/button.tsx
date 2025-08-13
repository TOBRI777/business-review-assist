import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-primary text-primary-foreground shadow-lg hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-lg hover:bg-destructive/90 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
        outline:
          "border border-primary/20 bg-surface/50 backdrop-blur-sm text-text-primary shadow-sm hover:bg-primary/5 hover:border-primary/40 hover:shadow-md",
        secondary:
          "bg-surface-secondary text-text-primary shadow-sm hover:bg-surface-elevated hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
        ghost: 
          "text-text-secondary hover:bg-surface-secondary hover:text-text-primary hover:scale-[1.02] active:scale-[0.98]",
        link: 
          "text-primary underline-offset-4 hover:underline hover:text-primary-glow",
        accent:
          "bg-accent text-accent-foreground shadow-lg hover:bg-accent/90 hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]",
        glass:
          "glass border border-primary/20 text-primary hover:border-primary/40 hover:bg-primary/5 hover:shadow-md backdrop-blur-sm",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
        xl: "h-14 rounded-xl px-10 text-lg",
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
