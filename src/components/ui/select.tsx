import * as React from "react"
import { cn } from "../../lib/utils"
import { ChevronDown } from "lucide-react"

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative inline-block w-full">
        <select
          className={cn(
            "flex h-9 w-full appearance-none rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 pr-8 text-xs font-medium text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all cursor-pointer shadow-sm",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-zinc-400 opacity-70" />
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
