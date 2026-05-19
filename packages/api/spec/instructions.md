<!-- SPDX-License-Identifier: CC-BY-4.0 -->
# L0173 Authoring Instructions

L0173 is the Graffiticode charting dialect. Programs compile to an
Apache ECharts canvas — a bar, line, pie, or scatter chart (including
donut / nightingale-rose variants of pie), used standalone or composed
into a multi-series / dual-axis layout via the `chart` wrapper.

## Pick the right constructor

| User asks for… | Use |
| :--- | :--- |
| Bar / column chart, ranked categories, vertical bars | `bar` |
| Trend over time, line graph, smoothed curve | `line` (set `smooth true`) |
| Filled area under a line | `line` with `area-style true` |
| Composition / proportion / pie | `pie` |
| Donut chart | `pie` with `inner-radius "60%"` (and optionally `outer-radius "80%"`) |
| Nightingale / rose / polar area | `pie` with `rose-type radius` (or `area`) |
| Step chart | `line` with `step start` / `middle` / `end` |
| XY relationship, point cloud, two numeric variables, correlation, distribution | `scatter` |
| Two series on shared axes (e.g., bars + line overlay) | `chart` wrapper with `series [bar..., line...]` |
| Two series at different scales (revenue + percent) | `chart` with `y-axis` + `y-axis-right`; bind one series with `axis right` |

## Composition rules

- A standalone `bar` / `line` / `pie` / `scatter` at the top level
  compiles to a complete chart. The `chart` wrapper is only needed
  for multiple series on the same canvas.
- Inside `series [...]`, only series-producing constructors are valid:
  `bar`, `line`, `pie`, `scatter`.
- All chainable attributes end with `{}` (the empty record).
- Use commas between list items in records; lists of constructors in
  `series [bar... {}, line... {}]` need commas between items.

## Data shapes

| Series | `data` shape |
| :--- | :--- |
| `bar`, `line` | List of numbers `[120, 200, 150]`, or `[{name, value}]` records. |
| `pie` | List of `[{ name: "...", value: 40 }, ...]` records. |
| `scatter` | List of `[x, y]` pairs `[[1, 2], [3, 4]]`, or `[{ x, y, name? }]` records. The record form is normalized to ECharts' `{ value: [x, y], name? }`; use it when each point needs a tooltip / legend label. |

For `bar` / `line`, the x-axis is usually a category axis:
```
x-axis type category categories ["Mon", "Tue", "Wed"] {}
```

For `scatter`, both axes are usually numeric. A standalone scatter
auto-defaults `x-axis` and `y-axis` to `type value` when you don't
declare one, so the minimal scatter is just `scatter data [[1, 2]
[3, 4]] {}..`. Inside a `chart` wrapper, declare the axes at the
chart level like any other series.

## Colors

Prefer Tailwind tokens (`"blue-500"`, `"amber-400"`, `"emerald-600"`).
They resolve to hex at compile time. If the user supplies a specific
hex (`"#3b82f6"`) or rgb / hsl, pass that through.

Don't invent token names — Tailwind v3's default palette has 22 hue
families (slate, gray, zinc, neutral, stone, red, orange, amber, yellow,
lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple,
fuchsia, pink, rose) × 11 shades (50, 100, 200, 300, 400, 500, 600, 700,
800, 900, 950). Plus `black`, `white`, `transparent`.

## Dark mode is one keyword

If the user asks for a dark chart, dark theme, dark mode, or anything
similar, **use `theme dark`**. One keyword. It flips the surrounding
card chrome and the ECharts dark theme together, which recolors the
title text, axis labels, gridlines, legend, tooltip background, and
data text coherently.

```
chart
  theme dark
  series [bar data [10, 20, 30] {}]
  {}
```

Don't try to assemble dark mode piece-by-piece (`background "..."` +
per-element text colors). There are no `title-color`, `axis-color`,
`label-color`, etc. setters in v1, and `background` is *only* a
container background — it doesn't recolor any text.

For light mode, omit `theme` (default) or write `theme light` for
explicitness.

## ECharts idioms that don't translate to L0173

L0173 is **not** ECharts JSON. It's a prefix-applied DSL with chainable
arity-2 attribute setters that end in `{}`. Several reflexes from
writing ECharts config will fail. Map them to L0173 keywords first.

| What you might write (ECharts reflex) | What L0173 expects |
| :--- | :--- |
| `show true` | There is no `show` keyword. Use the *intent-specific* setter: `label-show true` for data labels on points; `legend true` to enable the legend; `tooltip true` to enable tooltips. |
| `label { position: "top" }` | `label-position top` — a flat setter. Setting `label-position` implies `label-show true`. |
| `label show true` (decomposing `label`) | `label-show true` — it's a single hyphenated keyword. |
| `label { show: true position: "top" }` (record-literal options) | `label-show true` only. Per-point label position is not exposed in v1. |
| `option { title: { text: "..." } ... }` (JSON-literal config) | Use the chainable setters: `title "..."`, `subtitle "..."`, etc. No `option` keyword. |
| `xAxis { type: "category" data: [...] }` (JSON-literal axis) | `x-axis type category categories [...] {}` — the axis is its own chainable block. |
| `axisLabel: { rotate: 45 }` (rotate long tick labels) | `rotate 45` *inside* the `x-axis` / `y-axis` chain — flat setter, value in degrees. |
| `series: [{ type: "bar", data: [...] }]` (object-literal series) | Use constructors: `series [bar data [...] {}]`. |
| `name: "..." value: 40` keys ad-hoc on a series | On a series, `name "..."` sets the legend name and `data [...]` is the values. `{ name, value }` records are only used as elements *inside* `pie`'s `data` list. |
| `legend: { orient: "horizontal" position: "top" }` | `legend top` (bare tag). Allowed tags: `top`, `bottom`, `left`, `right`, `inside`. Or `legend true` for default. |
| `itemStyle: { color: "blue" }` | `color "blue-500"` — Tailwind token preferred; hex also works. |
| Per-slice colors on pie (`itemStyle.color` per data item) | `color ["blue-600", "emerald-500", "amber-400"]` on the series — list cycles per slice. Don't pass an array as a single ECharts `itemStyle.color` value. |
| `valueAxis` / `categoryAxis` keywords | Use `type value` / `type category` *inside* `y-axis`/`x-axis`. |
| `background-color "..."` (CSS reflex) | If intent is **dark mode**: `theme dark`. If intent is a specific container color: `background "..."` (no `-color` suffix). |
| `title-color "..."` / `axis-color "..."` / `label-color "..."` (per-element text colors) | Not exposed in v1. Use `theme dark` (or `theme light`) for coherent text recoloring across title, axes, legend, and labels at once. |

## Common pitfalls

- **Forgetting the inner `{}`** for an x-axis / y-axis / series block.
  Every chainable record terminates with `{}`.
- **Mixing chart-level options inside a `series [...]` item** —
  `title`, `legend`, etc. are chart-level. Put them on the wrapper
  (or on a standalone series constructor; the compiler hoists them).
- **Using `pie` with axes** — pie charts don't have x/y axes; the
  Checker doesn't reject these but ECharts will ignore them. Skip
  `x-axis` / `y-axis` for pie.
- **Wrong rose-type** — only `radius` and `area`. Don't use `nightingale`.
- **Inventing keywords** — every chainable setter is documented in
  `spec.md`. If you can't find it there, it doesn't exist; pick the
  closest documented setter instead of guessing.

## Out of scope (do not attempt in L0173)

- Network charts (graph / sankey / tree / treemap / sunburst). Pick a
  different dialect.
- Radar, gauge, heatmap, boxplot, candlestick, funnel — not in v1.
- Interactive editing or formulas (use L0166 for spreadsheet-style
  interactive content).
- External data fetching — L0173 evaluates a closed program.
