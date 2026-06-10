import * as React from "react";
import { cn } from "@/lib/utils";

const CHEVRON =
  "url(\"data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='24'%20height='24'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%2393a4bc'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='m6%209%206%206%206-6'/%3E%3C/svg%3E\")";

/** Select nativo estilizado, con chevron propio y opciones legibles en tema oscuro. */
const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, style, ...props }, ref) => (
  <select
    ref={ref}
    style={{
      backgroundImage: CHEVRON,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 0.6rem center",
      backgroundSize: "1.05rem",
      ...style,
    }}
    className={cn(
      "inline-flex h-10 w-full cursor-pointer appearance-none truncate rounded-md border border-input bg-background py-2 pl-3 pr-9 text-sm leading-normal ring-offset-background transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-card [&>option]:text-foreground",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export { Select };
