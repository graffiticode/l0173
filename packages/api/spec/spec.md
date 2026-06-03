<!-- SPDX-License-Identifier: CC-BY-4.0 -->
# L0173 Vocabulary

This specification documents dialect-specific functions available in
the **L0173** language of Graffiticode. L0173 is the *charting* dialect:
it compiles programs into Apache ECharts visualizations — bar, line,
pie, and scatter charts (with donut and nightingale-rose variants of
pie), used standalone or composed into multi-series and dual-axis
layouts via the `chart` wrapper.

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
| `scatter` | 1 | ECharts scatter series | XY point cloud. Standalone usage defaults both axes to `type value`. |

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
| `series` | list of series | List of series constructors (`bar`, `line`, `pie`, `scatter`). |

## Series-level options

These setters chain inside any series constructor.

| Setter | Value | Effect |
| :--- | :--- | :--- |
| `name` | string | Series name (used in legend and tooltips). |
| `values` | list | Series data. Shape depends on series type — see each type's reference. The surface keyword is `values` because basis's arity-1 `data` owns the `data` surface for upstream piping (see Piping below). |
| `color` | string or list | Tailwind token (`"blue-500"`) or hex. A *list* of colors becomes a per-data-item palette — useful for pie slices (`color ["blue-600", "emerald-500", "amber-400"]`). |
| `axis` | tag (`left` \| `right`) | Bind the series to the left or right y-axis (default `left`). |
| `stack` | string | Stack group name; series with the same stack name stack on each other. |
| `smooth` | boolean | (line / area) Smooth line interpolation. |
| `area-style` | boolean or record | (line) Fill the area below the line. |
| `bar-width` | number or string | (bar) Bar width in pixels or percentage. |
| `step` | tag (`start` \| `middle` \| `end`) | (line) Render as a step chart. |
| `symbol` | tag | Series symbol: `circle`, `rect`, `triangle`, `diamond`, `pin`, `arrow`, `none`. |
| `symbol-size` | number | Symbol size in pixels. |
| `label-show` | boolean | Show data labels on each point / bar / slice. |
| `label-position` | tag (`top` \| `inside` \| `bottom` \| `inside-top` \| `inside-bottom`) | Where to render the data label. Implies `label-show true` unless `label-show false` is also set. |
| `label-formatter` | string | Template for formatting label values. Tokens: `{c}` data value, `{b}` data name, `{a}` series name, `{d}` percent (pie). E.g. `"{c}%"`, `"${c}"`, `"{b}: {c}"`. Implies `label-show true` unless `label-show false` is also set. |
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
| `rotate` | number (degrees) | Rotate each tick label by N degrees. Useful for fitting long category labels (`rotate 45`). |

## Function Reference

### chart

Top-level wrapper for charts that have multiple series. Takes a single
record built via chained arity-2 setters.

```
chart
  title "Weekly performance"
  x-axis type category categories ["Mon", "Tue", "Wed", "Thu", "Fri"] {}
  series [
    bar name "Revenue" values [120, 200, 150, 80, 70] {},
    line name "Forecast" values [110, 180, 160, 90, 75] smooth true {}
  ]
  legend top
  {}
```

For a single series, you can drop the `chart` wrapper — any top-level
series constructor compiles to a complete chart.

### bar

Vertical bar chart. `values` is a list of numbers (one per category) or a
list of `{ name, value }` records.

```
bar
  title "Quarterly revenue"
  x-axis category ["Q1", "Q2", "Q3", "Q4"] {}
  values [320, 450, 380, 510]
  color "blue-500"
  {}
```

### line

Line chart. `values` is a list of numbers or `[x, y]` pairs.

```
line
  title "Daily users"
  x-axis category ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] {}
  values [1200, 1340, 1500, 1450, 1700, 1850, 1900]
  smooth true
  symbol circle
  symbol-size 8
  {}
```

### pie / donut / rose

Pie chart. `values` is a list of `{ name, value }` records.

Regular pie:
```
pie
  title "Market share"
  values [
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
  values [{ name: "A" value: 40 }, { name: "B" value: 60 }]
  {}
```

Nightingale rose — set `rose-type`:
```
pie
  rose-type radius
  values [
    { name: "Mon" value: 12 }
    { name: "Tue" value: 25 }
    { name: "Wed" value: 31 }
  ]
  {}
```

### scatter

XY scatter plot. `values` is either a list of `[x, y]` pairs or a list
of `{ x, y, name? }` records (the record form is normalized to
ECharts' `{ value: [x, y], name? }` shape and is useful when each
point needs a tooltip / legend label).

Standalone scatter defaults both axes to `type value` when the user
hasn't declared one — without that injection the chart wouldn't
render meaningfully. An explicit `x-axis` / `y-axis` always wins.
Inside a `chart` wrapper, axes are declared at the chart level (like
`bar` / `line`).

Standalone scatter:
```
scatter
  title "Height vs weight"
  values [[170, 65] [175, 72] [168, 60] [182, 80]]
  color "blue-500"
  symbol circle
  symbol-size 10
  {}
```

Labeled points via the record shape:
```
scatter
  values [
    { x: 1 y: 2 name: "A" }
    { x: 3 y: 4 name: "B" }
  ]
  symbol diamond
  {}
```

When a scatter has named points, each point is labeled with its
`name` by default (positioned `top`, clear of the symbol) — mirroring
how `pie` always shows slice names alongside slices. To opt out, set
`label-show false`. Explicit `label-position` always wins, and an
explicit `label-formatter` overrides the default `name` label.

The legend reflects *series* identity, not point identity — adding
`legend top` to a single scatter without a series `name` won't
produce meaningful entries. For per-name legend entries, write one
scatter series per name inside a `chart` wrapper (see the
multi-series example above), each with its own `name "..."`.

Two scatter series sharing axes inside a `chart`:
```
chart
  x-axis type value name "Income" {}
  y-axis type value name "Spend"  {}
  series [
    scatter name "2024" values [[40, 32] [55, 41]] color "blue-500" {},
    scatter name "2025" values [[42, 35] [60, 46]] color "amber-500" {}
  ]
  legend top
  {}
```

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
    bar  name "Revenue"   values [320, 450, 380, 510]  color "blue-500"  {},
    line name "Growth"    values [5, 12, -3, 8]        color "amber-500" axis right smooth true {}
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
  values [320, 450, 380, 510]
  {}..
```

Donut with theme:
```
pie
  title "Allocation"
  theme dark
  inner-radius "60%"
  values [
    { name: "Stocks" value: 60 }
    { name: "Bonds" value: 30 }
    { name: "Cash" value: 10 }
  ]
  {}..
```

## Piping

L0173 inherits basis's arity-1 `data <defaults>` function. When a
program runs downstream of another graffiticode task, the host
delivers the upstream task's record as `options.data` at compile
time; basis's `data` merges that upstream over the defaults and
returns the merged record. Pull a specific field out for a `values`
(or any other) setter with `get "<key>" (data {<key>: <default>})`.

```
bar
  title "Quarterly revenue"
  values get "values" data { values: [320, 450, 380, 510] }
  color "blue-500"
  {}..
```

- Standalone (no upstream bound) → uses the defaults `[320, 450, 380, 510]`.
- Piped from an upstream `{values: [...]}` → uses the upstream values.
- Piped from an upstream that doesn't carry a `values` key →
  defaults preserved.

The `values` keyword is the *literal-inline* series data; the
unrelated `data` keyword is the *upstream-source* function. The
naming follows Vega-Lite's split.

