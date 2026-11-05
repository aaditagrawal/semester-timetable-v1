import { classNames } from "@/ui.stylex";
import * as React from "react";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";
import { joinClasses, type ClassValue } from "@/lib/classes";

const variantClasses = {
  default: classNames.badge155,
  outline: classNames.button163,
  secondary: classNames.button164,
  ghost: classNames.button165,
  destructive: classNames.button166,
  link: classNames.badge160,
};
const sizeClasses = {
  default: classNames.button167,
  xs: classNames.button168,
  sm: classNames.button169,
  lg: classNames.button170,
  icon: classNames.button171,
  "icon-xs": classNames.button172,
  "icon-sm": classNames.button173,
  "icon-lg": classNames.button174,
};

type ButtonVariants = {
  variant?: keyof typeof variantClasses | null;
  size?: keyof typeof sizeClasses | null;
};

function buttonVariants({
  variant = "default",
  size = "default",
  className,
  class: extraClass,
}: ButtonVariants & { className?: ClassValue; class?: ClassValue } = {}) {
  let classes = classNames.button162;
  if (variant !== null) classes += ` ${variantClasses[variant]}`;
  if (size !== null) classes += ` ${sizeClasses[size]}`;
  if (extraClass || className) {
    const caller = joinClasses(extraClass, className);
    if (caller) classes += ` ${caller}`;
  }
  return classes;
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  ButtonVariants & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
