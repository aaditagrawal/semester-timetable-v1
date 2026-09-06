import { classNames } from "@/ui.stylex";
import { cn } from "@/lib/utils";

function ExampleWrapper({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={classNames.example306}>
      <div
        data-slot="example-wrapper"
        className={cn(classNames.example307, className)}
        {...props}
      />
    </div>
  );
}

function Example({
  title,
  children,
  className,
  containerClassName,
  ...props
}: React.ComponentProps<"div"> & {
  title: string;
  containerClassName?: string;
}) {
  return (
    <div data-slot="example" className={cn(classNames.example308, containerClassName)} {...props}>
      <div className={classNames.example309}>{title}</div>
      <div data-slot="example-content" className={cn(classNames.example310, className)}>
        {children}
      </div>
    </div>
  );
}

export { ExampleWrapper, Example };
