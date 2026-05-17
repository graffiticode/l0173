<!-- SPDX-License-Identifier: CC-BY-4.0 -->
# L0173 Usage Guide

Agent-facing guide for authoring L0173 chart programs. Read this before
composing a `create_item` prompt or an `update_item` modification.

## Overview

L0173 is a declarative dialect for **charts, tables, and KPI cards**.
Input is a natural-language description of a visualization — what kind
of chart, the data series, axis labels, theming — and output is an L0173
program that compiles to one of four artifact envelopes the renderer
knows how to draw: an Apache ECharts canvas (bar / line / pie / donut /
nightingale rose / multi-series compositions), a static HTML data
table, or a single-value KPI card.

The right tool for analytics dashboards, report visualizations, and
assessment-style data displays. Not the right tool for relational
charts (graph / sankey / tree / treemap / sunburst), interactive
editing, formulas, or anything that needs external data fetching —
those belong in other dialects.

In scope (v1): bar, line, pie (with donut and nightingale-rose variants
via attributes); multi-series overlays on shared or dual y-axes; static
data tables; KPI cards with auto-derived delta direction and
`Intl.NumberFormat` formatting; Tailwind v3 color tokens and theme
modes. Out of scope (v1): scatter / radar / gauge / heatmap / boxplot /
candlestick / funnel / sparklines / table editing — these slot into
the same compiler pattern in future versions but aren't implemented
yet.

## What L0173 can do

- **Bar charts** — vertical bars over a category axis; per-series color,
  stacking, label visibility.
- **Line charts** — including smooth, stepped, and area-filled lines;
  data labels and symbol styling.
- **Pie / donut / nightingale rose** — composition charts with optional
  inner radius (donut) and rose modes (radius / area).
- **Multi-series overlays** — bar + line on the same axes, with shared
  legend and tooltips.
- **Dual y-axis** — two y-axes (left + right) so series with different
  scales render legibly together.
- **Tables** — static HTML tables with headers, captions, per-column
  alignment, striped and bordered styles.
- **KPI cards** — single-value cards with label, delta indicator
  (auto-coloured for up / down / neutral), and `Intl.NumberFormat`
  formatting (currency / percent / compact / number).
- **Theming** — `theme dark | light` for the surrounding card and chart
  chrome; named ECharts palettes via `palette "vintage"` etc.
- **Tailwind color tokens** — `color "blue-500"` resolves to the
  Tailwind hex at compile time.

## What L0173 cannot do (v1)

- No network / relational charts: `graph`, `sankey`, `tree`, `treemap`,
  `sunburst` are not implemented.
- No `scatter`, `radar`, `gauge`, `heatmap`, `boxplot`, `candlestick`,
  `funnel` series — these are easy adds in a future v2 but aren't in
  v1.
- No table cell formulas / scoring (use L0166 for assessment-style
  spreadsheets).
- No external data — the program receives no HTTP/database access.
- No KPI sparklines yet — KPI card v1 is value + label + delta + format
  + caption.

## Quick start

A bar chart:
```
bar
  title "Sales"
  x-axis category ["Q1","Q2","Q3","Q4"] {}
  data [320, 450, 380, 510]
  color "blue-500"
  {}..
```

A multi-series chart with dual y-axis:
```
chart
  title "Revenue vs growth rate"
  x-axis category ["Q1","Q2","Q3","Q4"] {}
  y-axis name "USD (thousands)" {}
  y-axis-right name "% growth" min -10 max 20 {}
  series [
    bar  name "Revenue" data [320, 450, 380, 510] color "blue-500"  {},
    line name "Growth"  data [5, 12, -3, 8]       color "amber-500" axis right smooth true {}
  ]
  legend top
  {}..
```

A donut (pie with `inner-radius` non-zero):
```
pie
  inner-radius "60%"
  outer-radius "80%"
  data [
    { name: "Stocks" value: 60 }
    { name: "Bonds" value: 30 }
    { name: "Cash" value: 10 }
  ]
  {}..
```

A table:
```
table
  headers ["Quarter", "Revenue", "Growth"]
  rows [
    ["Q1", 320, 0.05]
    ["Q2", 450, 0.12]
    ["Q3", 380, -0.03]
    ["Q4", 510, 0.08]
  ]
  column-align [left right right]
  {}..
```

A KPI card (value is the first positional argument):
```
kpi 1240000
  label "Monthly revenue"
  delta 0.12
  format currency
  caption "vs. previous month"
  {}..
```

## Theming

Wrap any program with `theme dark` or `theme light` to control the
surrounding card chrome and (for charts) ECharts' built-in dark theme:

```
chart
  theme dark
  series [bar data [10, 20, 30] {}]
  {}..
```

## Colors

The `color` attribute on a series, and the `color` attribute on a KPI
card, accept:

- A Tailwind v3 token: `"blue-500"`, `"amber-400"`, `"emerald-600"`.
- A hex value: `"#3b82f6"`.
- Any CSS color string: `"rgb(59, 130, 246)"`, `"slategray"`.

Tokens resolve to hex at compile time.
