import { describe, expect, test } from "bun:test";
import * as stylex from "@stylexjs/stylex";
import { classNames, styles } from "@/ui.stylex";
import { joinClasses } from "./classes";
import { cn } from "./utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

describe("class composition", () => {
  test("flattens nested conditions without sorting or deduplicating names", () => {
    expect(
      joinClasses("first", [null, false, "repeat", [0, -2, undefined]], {
        selected: true,
        hidden: false,
        repeat: 1,
      }),
    ).toBe("first repeat -2 selected repeat");
    expect(joinClasses(undefined, null, false, true, 0, NaN, "")).toBe("");
    expect(joinClasses(" two  names ", ["last"])).toBe(" two  names  last");
    expect(joinClasses("a", { "": true }, "b")).toBe("a b");
    expect(joinClasses({ a: true, "": true, b: true })).toBe("a  b");
    expect(joinClasses(1n, 0n)).toBe("");
    const large = Array.from({ length: 100_000 }, () => "name");
    expect(joinClasses(large)).toBe(large.join(" "));
  });

  test("supports inherited enumerable and prototype-free conditions", () => {
    const inherited = Object.assign(Object.create({ inherited: true }), { own: 1 });
    const bare = Object.assign(Object.create(null), { bare: true, absent: false });
    expect(joinClasses(inherited, bare)).toBe("own inherited bare");
  });

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
      joinClasses(classNames.button162, classNames.badge155, classNames.button167),
    );
    expect(buttonVariants({ variant: undefined, size: undefined })).toBe(buttonVariants());
    expect(buttonVariants({ variant: null, size: null })).toBe(classNames.button162);
    expect(badgeVariants()).toBe(joinClasses(classNames.badge154, classNames.badge155));
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
      joinClasses(
        classNames.button162,
        classNames.button163,
        classNames.button173,
        "extra enabled caller",
      ),
    );
    expect(badgeVariants({ variant: "secondary", class: "extra", className: "caller" })).toBe(
      joinClasses(classNames.badge154, classNames.badge156, "extra caller"),
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
