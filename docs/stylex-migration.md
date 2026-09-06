# StyleX migration

Application and archived component utility styles now use compiled definitions in `ui.stylex.js`. Tailwind, its PostCSS plugin, tailwind-merge, tw-animate-css, and the shadcn generator dependency are removed. Component APIs and the existing tile-class cache are preserved.

`cn` composes registered StyleX definitions while retaining semantic class markers. `reset.css` retains browser normalization, design tokens, custom properties, and animation defaults. `ui-states.css` retains structural, descendant, responsive, and conditional selectors where their cascade matters. Size and width markers preserve the original explicit-child exemptions; small button variants replace the default SVG size, and input groups suppress standalone input rings.

The Babel loader applies only to StyleX modules. Next.js retains its app and font transforms, package-import optimization, and normal production/development paths. A [Bun preload plugin](https://bun.sh/docs/runtime/plugins) compiles those same modules when tests and benchmarks import components directly.

## Validation

Compared all non-custom computed CSS properties and DOM bounding boxes against the baseline production build. Transitions were frozen identically for final-state comparisons. Clock simulations used only browser-local overrides and the app's existing resync event.

- Initial setup: 110 elements at widths 390, 639, 640, 767, 768, 1023, 1024, 1279, and 1280.
- Manual elective list: 1886 elements at widths 390, 639, 640, 767, 768, 1024, and 1280. Selected-program and open-elective steps also match.
- Configured day and week views, including active and passed classes, match. The final 114-element day and 232-element week views with room labels match at widths 390, 639, 640, 767, 768, 1023, 1024, and 1280.
- Appearance dialog: 315 elements, with dark/light modes, the Ocean template, hover/focus states, and mobile/breakpoint widths. Code labels and room visibility produce 345 matching elements.
- Settings, course-detail dropdown, calendar export, and 404 match. Export has 49 elements; course-detail view has 257 with room labels.
- Temporary component fixture: 217 elements covering every button variant/size, invalid and disabled controls, input groups, cards, and the existing component examples. Light/dark hover/focus states match at mobile and breakpoint widths. Dialog and select-open states also match after aligning native focus state.
- Development active-day view matches baseline production, excluding the Next.js overlay. The temporary component fixture was removed before submission.
- All 49 Bun tests pass. The class-name benchmark's cache parity check passes, and cached composition remains faster than uncached composition.
- AST comparison confirms the 33 changed TSX files preserve logic and content after normalizing styling expressions and formatting.

The port preserves scheduling, elective search and lookup, theme derivation, local settings, PWA caching, and calendar-export behavior.
