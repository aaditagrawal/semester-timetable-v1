import { classNames } from "@/ui.stylex";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(classNames.button162, {
  variants: {
    variant: {
      default: classNames.badge155,
      outline: classNames.button163,
      secondary: classNames.button164,
      ghost: classNames.button165,
      destructive: classNames.button166,
      link: classNames.badge160,
    },
    size: {
      default: classNames.button167,
      xs: classNames.button168,
      sm: classNames.button169,
      lg: classNames.button170,
      icon: classNames.button171,
      "icon-xs": classNames.button172,
      "icon-sm": classNames.button173,
      "icon-lg": classNames.button174,
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
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
