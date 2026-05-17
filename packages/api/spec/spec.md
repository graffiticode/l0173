<!-- SPDX-License-Identifier: CC-BY-4.0 -->
# L0173 Vocabulary

This specification documents dialect-specific functions available in
the **L0173** language of Graffiticode. L0173 is the *charting* dialect:
it compiles programs into chart, table, and KPI-card artifacts that
render via Apache ECharts (for charts) or plain HTML (for tables and
KPI cards).

The core language specification, including syntax, semantics, and the
base library, can be found here:
[Graffiticode Language Specification](./graffiticode-language-spec.html)

## Renderable types

| Constructor | Arity | Renders as | Description |
| :--- | :--: | :--- | :--- |
| `chart` | 1 | ECharts canvas | Top-level wrapper for multi-series charts; accepts `series [...]`. |
| `bar` | 1 | ECharts bar series | Vertical bar chart. Standalone usage produces a single-series chart. |
| `line` | 1 | ECharts line series | Line chart; `smooth true` softens corners; `area-style true` fills under the curve. |
| `pie` | 1 | ECharts pie series | Pie chart. `inner-radius "60%"` → donut. `rose-type radius` / `area` → nightingale rose. |
| `table` | 1 | HTML `<table>` | Static data table with optional headers, caption, and per-column alignment. |
| `kpi` | 1 | HTML card | Single-value KPI card with optional delta, format, and caption. |

## Chart-level options

These chainable arity-2 setters apply to the surrounding chart envelope.
They can appear inside a `chart {...}` wrapper or directly on a
standalone series constructor — in the latter case they're hoisted
out of the series and applied at the chart level.

| Setter | Value | Effect |
| :--- | :--- | :--- |
| `title` | string | Chart title (renders as `title.text`). |
| `subtitle` | string | Chart subtitle (renders as `title.subtext`). |
| `x-axis` | record (chained) | x-axis configuration; see Axis options. |
| `y-axis` | record (chained) | Left y-axis configuration. |
| `y-axis-right` | record (chained) | Right y-axis configuration (creates a dual-axis chart). |
| `legend` | tag or `true` or record | Show the legend. Tag values: `top`, `bottom`, `left`, `right`, `inside`. |
| `tooltip` | `true` or record | Enable axis-trigger tooltips. |
| `grid` | record | ECharts grid options (margin, etc.). |
| `theme` | tag (`dark` \| `light`) | UI theme of the surrounding card and chart chrome. |
| `palette` | string | Named ECharts color palette (e.g., `"vintage"`, `"westeros"`). |
| `background` | string | CSS color for the chart container background. |
| `width` | number or string | Width override (default: parent width). |
| `height` | number or string | Height override (default: `h-96` from Tailwind). |
| `animation` | boolean | Toggle ECharts animations. |
| `series` | list of series | List of series constructors (`bar`, `line`, `pie`). |

## Series-level options

These setters chain inside any series constructor.

| Setter | Value | Effect |
| :--- | :--- | :--- |
| `name` | string | Series name (used in legend and tooltips). |
| `data` | list | Series data. Shape depends on series type — see each type's reference. |
| `color` | string | Tailwind token (`"blue-500"`) or hex. Resolves to `itemStyle.color`. |
| `axis` | tag (`left` \| `right`) | Bind the series to the left or right y-axis (default `left`). |
| `stack` | string | Stack group name; series with the same stack name stack on each other. |
| `smooth` | boolean | (line / area) Smooth line interpolation. |
| `area-style` | boolean or record | (line) Fill the area below the line. |
| `bar-width` | number or string | (bar) Bar width in pixels or percentage. |
| `step` | tag (`start` \| `middle` \| `end`) | (line) Render as a step chart. |
| `symbol` | tag | Series symbol: `circle`, `rect`, `triangle`, `diamond`, `pin`, `arrow`, `none`. |
| `symbol-size` | number | Symbol size in pixels. |
| `label-show` | boolean | Show data labels on each point. |
| `outer-radius` | string or number | (pie) Outer radius (default `"75%"`). |
| `inner-radius` | string or number | (pie) Inner radius — non-zero values produce a donut chart. |
| `rose-type` | tag (`radius` \| `area`) | (pie) Nightingale rose. |
| `start-angle` | number | (pie) Starting angle in degrees. |

## Axis options

These setters chain inside an `x-axis`, `y-axis`, or `y-axis-right` block.

| Setter | Value | Effect |
| :--- | :--- | :--- |
| `type` | tag (`category` \| `value` \| `time` \| `log`) | Axis type. |
| `categories` | list of strings | Tick labels for a category axis (renders as `axis.data`). |
| `name` | string | Axis label. |
| `min` | number | Lower bound. |
| `max` | number | Upper bound. |
| `interval` | number | Tick spacing. |
| `boundary-gap` | boolean | Whether to add padding at axis ends. |
| `inverse` | boolean | Reverse the axis. |

## Table options

| Setter | Value | Effect |
| :--- | :--- | :--- |
| `headers` | list of strings | Column header row. |
| `rows` | list of lists | Data rows. |
| `caption` | string | Table caption (rendered below). |
| `column-align` | list of tags | Per-column alignment: `left`, `center`, `right`. |
| `striped` | boolean | Alternating row backgrounds (default `true`). |
| `bordered` | boolean | Cell borders (default `true`). |

## KPI options

`kpi` is arity 2 — the **value** is the primary positional argument
(not a setter), so a card always starts `kpi <value> ...`. The setters
below chain inside the second argument.

| Setter | Value | Effect |
| :--- | :--- | :--- |
| `label` | string | Caption above the value. |
| `delta` | number | Change vs. comparison period. Sign determines direction unless `delta-direction` is set. |
| `delta-direction` | tag (`up` \| `down` \| `neutral`) | Override the auto-derived direction. |
| `format` | tag (`currency` \| `percent` \| `number` \| `compact`) | Number formatting via `Intl.NumberFormat`. |
| `caption` | string | Small caption below the delta. |
| `color` | string | Background color (Tailwind token or hex). |

## Function Reference

### chart

Top-level wrapper for charts that have multiple series. Takes a single
record built via chained arity-2 setters.

```
chart
  title "Weekly performance"
  x-axis type category categories ["Mon", "Tue", "Wed", "Thu", "Fri"] {}
  series [
    bar name "Revenue" data [120, 200, 150, 80, 70] {},
    line name "Forecast" data [110, 180, 160, 90, 75] smooth true {}
  ]
  legend top
  {}
```

For a single series, you can drop the `chart` wrapper — any top-level
series constructor compiles to a complete chart.

### bar

Vertical bar chart. `data` is a list of numbers (one per category) or a
list of `{ name, value }` records.

```
bar
  title "Quarterly revenue"
  x-axis category ["Q1", "Q2", "Q3", "Q4"] {}
  data [320, 450, 380, 510]
  color "blue-500"
  {}
```

### line

Line chart. `data` is a list of numbers or `[x, y]` pairs.

```
line
  title "Daily users"
  x-axis category ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] {}
  data [1200, 1340, 1500, 1450, 1700, 1850, 1900]
  smooth true
  symbol circle
  symbol-size 8
  {}
```

### pie / donut / rose

Pie chart. `data` is a list of `{ name, value }` records.

Regular pie:
```
pie
  title "Market share"
  data [
    { name: "A" value: 40 }
    { name: "B" value: 35 }
    { name: "C" value: 25 }
  ]
  {}
```

Donut — set `inner-radius` to a non-zero value (and optionally
`outer-radius` to control the outer ring):
```
pie
  inner-radius "60%"
  outer-radius "80%"
  data [{ name: "A" value: 40 }, { name: "B" value: 60 }]
  {}
```

Nightingale rose — set `rose-type`:
```
pie
  rose-type radius
  data [
    { name: "Mon" value: 12 }
    { name: "Tue" value: 25 }
    { name: "Wed" value: 31 }
  ]
  {}
```

### table

Static HTML data table.

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
  caption "Quarterly results"
  {}
```

### kpi

Single-value KPI card. The value is the first positional argument.

```
kpi 1240000
  label "Monthly revenue"
  delta 0.12
  format currency
  caption "vs. previous month"
  {}
```

The delta direction is derived from the sign of `delta` (`up` for
positive, `down` for negative, `neutral` for zero). Override with
`delta-direction up | down | neutral`.

## Dual y-axis

To plot two series with different scales, declare both `y-axis` (left)
and `y-axis-right` at the chart level, and bind each series with the
`axis` tag (default `left`):

```
chart
  x-axis category ["Q1","Q2","Q3","Q4"] {}
  y-axis  type value name "USD (thousands)" {}
  y-axis-right type value name "% growth" min -10 max 20 {}
  series [
    bar  name "Revenue"   data [320, 450, 380, 510]  color "blue-500"  {},
    line name "Growth"    data [5, 12, -3, 8]        color "amber-500" axis right smooth true {}
  ]
  legend top
  {}
```

## Colors

Color values accept Tailwind v3 design tokens (e.g., `"blue-500"`,
`"amber-400"`, `"slate-700"`) which the compiler resolves to hex at
compile time. Hex (`"#3b82f6"`) and CSS color strings (`"rgb(...)"`)
pass through unchanged. Unknown tokens are also passed through, so a
typo will become a literal string and ECharts will reject it at render.

## Program Examples

Single-series bar with title:
```
bar
  title "Sales"
  x-axis category ["Q1","Q2","Q3","Q4"] {}
  data [320, 450, 380, 510]
  {}..
```

Donut with theme:
```
pie
  title "Allocation"
  theme dark
  inner-radius "60%"
  data [
    { name: "Stocks" value: 60 }
    { name: "Bonds" value: 30 }
    { name: "Cash" value: 10 }
  ]
  {}..
```

KPI card:
```
kpi 0.245
  label "Click-through rate"
  delta 0.012
  format percent
  caption "Last 7 days"
  {}..
```
