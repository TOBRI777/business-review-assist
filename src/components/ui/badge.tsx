import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-3 py-1 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-primary text-primary-foreground shadow-md hover:shadow-lg",
        secondary:
          "border-transparent bg-surface-secondary text-text-primary hover:bg-surface-elevated",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90",
        outline: 
          "border-primary/20 text-text-primary bg-surface/50 backdrop-blur-sm hover:border-primary/40 hover:bg-primary/5",
        success:
          "border-transparent bg-success text-success-foreground shadow-md hover:bg-success/90",
        warning:
          "border-transparent bg-warning text-warning-foreground shadow-md hover:bg-warning/90",
        accent:
          "border-transparent bg-accent text-accent-foreground shadow-md hover:bg-accent/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
