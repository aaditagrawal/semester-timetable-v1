import { describe, expect, test } from "bun:test";
import * as stylex from "@stylexjs/stylex";
import { classNames, styles } from "@/ui.stylex";
import { clsx } from "clsx";
import { cn } from "./utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

describe("class composition", () => {
  test("keeps StyleX's last-property override and semantic class markers", () => {
    const expected = stylex.props(styles.courseTile231, styles.courseTile232, styles.courseTile233);
    expect(
      cn(classNames.courseTile231, [classNames.courseTile232], {
        [classNames.courseTile233]: true,
        omitted: false,
      }),
    ).toBe(`${expected.className} tt-courseTile231 tt-courseTile232 tt-courseTile233`);
    expect(cn("plain", [false, "last"])).toBe("plain last");
    expect(cn()).toBe("");
    expect(cn(" plain ", ["  last  "])).toBe("plain last");
    expect(cn("  \t\n ")).toBe("");
  });
});

describe("finite control variants", () => {
  test("distinguishes absent defaults from explicit null", () => {
    expect(buttonVariants()).toBe(
      clsx(classNames.button162, classNames.badge155, classNames.button167),
    );
    expect(buttonVariants({ variant: undefined, size: undefined })).toBe(buttonVariants());
    expect(buttonVariants({ variant: null, size: null })).toBe(classNames.button162);
    expect(badgeVariants()).toBe(clsx(classNames.badge154, classNames.badge155));
    expect(badgeVariants({ variant: undefined })).toBe(badgeVariants());
    expect(badgeVariants({ variant: null })).toBe(classNames.badge154);
  });

  test("appends caller classes after both selected button variants", () => {
    expect(
      buttonVariants({
        variant: "outline",
        size: "icon-sm",
        class: ["extra", { enabled: true }],
        className: "caller",
      }),
    ).toBe(
      clsx(
        classNames.button162,
        classNames.button163,
        classNames.button173,
        "extra enabled caller",
      ),
    );
    expect(badgeVariants({ variant: "secondary", class: "extra", className: "caller" })).toBe(
      clsx(classNames.badge154, classNames.badge156, "extra caller"),
    );
  });

  test("preserves native/Slot markup, attributes and caller StyleX overrides", () => {
    const button = renderToStaticMarkup(
      createElement(Button, {
        children: "Continue",
        variant: "outline",
        size: "sm",
        disabled: true,
        "aria-label": "Continue setup",
        className: classNames.button170,
      }),
    );
    expect(button).toContain('data-slot="button"');
    expect(button).toContain('data-variant="outline"');
    expect(button).toContain('data-size="sm"');
    expect(button).toContain('aria-label="Continue setup"');
    expect(button).toContain('disabled=""');
    expect(button).toContain(
      cn(classNames.button162, classNames.button163, classNames.button169, classNames.button170),
    );
    const link = renderToStaticMarkup(
      createElement(Button, {
        asChild: true,
        children: createElement("a", { href: "/export" }, "Export"),
      }),
    );
    expect(link.startsWith("<a ")).toBe(true);
    expect(link).toContain('href="/export"');
    expect(
      renderToStaticMarkup(createElement(Badge, { variant: null, children: "Optional" })),
    ).toContain(cn(classNames.badge154));
  });
});
