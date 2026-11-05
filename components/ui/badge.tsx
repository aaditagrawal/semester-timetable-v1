import { classNames } from "@/ui.stylex";
import * as React from "react";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";
import { joinClasses, type ClassValue } from "@/lib/classes";

const variantClasses = {
  default: classNames.badge155,
  secondary: classNames.badge156,
  destructive: classNames.badge157,
  outline: classNames.badge158,
  ghost: classNames.badge159,
  link: classNames.badge160,
};

type BadgeVariants = { variant?: keyof typeof variantClasses | null };

function badgeVariants({
  variant = "default",
  className,
  class: extraClass,
}: BadgeVariants & { className?: ClassValue; class?: ClassValue } = {}) {
  let classes = classNames.badge154;
  if (variant !== null) classes += ` ${variantClasses[variant]}`;
  if (extraClass || className) {
    const caller = joinClasses(extraClass, className);
    if (caller) classes += ` ${caller}`;
  }
  return classes;
}

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & BadgeVariants & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
