"use client";

import { classNames } from "@/ui.stylex";

import * as React from "react";
import { Switch as SwitchPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        classNames.switch147,
        classNames.switch148,
        classNames.switch149,
        classNames.switch150,
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(classNames.switch151, classNames.switch152, classNames.switch153)}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
