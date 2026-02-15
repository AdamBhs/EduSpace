import * as React from "react";
import { CheckIcon } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";

import { cn } from "@/shared/lib/utils";

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        // Base box styling
        "peer w-4.5 h-4.5 rounded-[4px] border border-[#728298] bg-[#1E293B] shadow-none transition-none outline-none",
        // Remove checked, hover, focus color changes
        "data-[state=checked]:bg-[#1E293B] data-[state=checked]:border-[#728298]",
        "hover:bg-[#1E293B] focus-visible:ring-0 focus-visible:border-[#728298]",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-white"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
