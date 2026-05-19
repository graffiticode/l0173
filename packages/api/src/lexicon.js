// SPDX-License-Identifier: MIT
// L0173 — Apache ECharts dialect (v1: bar / line / pie / scatter).
//
// The lexicon declares keyword groups so compiler.js can install Checker
// and Transformer prototype methods via meta-generation. Hand-written
// overrides in compiler.js only when behavior diverges from the generic
// arity-2 setter pattern.

const fn1 = (name) => ({ tk: 1, name, cls: "function", length: 1, arity: 1 });
const fn2 = (name) => ({ tk: 1, name, cls: "function", length: 2, arity: 2 });
const tag = () => ({ tk: 22, name: "TAG", cls: "val", length: 0, arity: 0 });

// Series constructors. Each is arity 1 — takes one record built up via
// chained arity-2 attribute setters terminating in `{}`.
//
// `bar` / `line` / `pie` / `scatter` produce ECharts series records
// and are assembled into a full chart by the `chart` wrapper or by
// PROG when used standalone.
const SERIES_TYPES = ["bar", "line", "pie", "scatter"];

// All chainable arity-2 setters in one map: METHOD → output field.
// Surface keys are derived from METHOD via lowercase + underscore→dash
// (e.g., `LABEL_SHOW` → surface `label-show`, field `labelShow`).
const OPT_SETTERS = {
  // Chart-level options.
  TITLE:           "title",
  SUBTITLE:        "subtitle",
  X_AXIS:          "xAxis",
  Y_AXIS:          "yAxis",
  Y_AXIS_RIGHT:    "yAxisRight",
  LEGEND:          "legend",
  TOOLTIP:         "tooltip",
  GRID:            "grid",
  THEME:           "theme",
  PALETTE:         "palette",
  BACKGROUND:      "background",
  WIDTH:           "width",
  HEIGHT:          "height",
  ANIMATION:       "animation",
  SERIES:          "series",

  // Series-level options.
  NAME:            "name",
  VALUES:          "values",
  COLOR:           "color",
  SMOOTH:          "smooth",
  AREA_STYLE:      "areaStyle",
  BAR_WIDTH:       "barWidth",
  STACK:           "stack",
  STEP:            "step",
  SYMBOL:          "symbol",
  SYMBOL_SIZE:     "symbolSize",
  LABEL_SHOW:      "labelShow",
  LABEL_POSITION:  "labelPosition",
  AXIS:            "axis",
  OUTER_RADIUS:    "radius",
  INNER_RADIUS:    "innerRadius",
  ROSE_TYPE:       "roseType",
  START_ANGLE:     "startAngle",

  // Axis options (used inside x-axis / y-axis / y-axis-right chains;
  // land in the inner axis record built by their constructors).
  TYPE:            "type",
  CATEGORIES:      "categories",
  MIN:             "min",
  MAX:             "max",
  INTERVAL:        "interval",
  BOUNDARY_GAP:    "boundaryGap",
  INVERSE:         "inverse",
  ROTATE:          "rotate",
};

// METHOD → surface keyword. Convert UPPER_SNAKE → kebab-case.
const methodToSurface = (m) => m.toLowerCase().replace(/_/g, "-");

// Setters that resolve a tag-or-number primary value (e.g., `theme dark`,
// `symbol circle`, `step middle`, `axis right`, `rose-type radius`). The
// Checker validates the tag is in the allowed set; the Transformer
// extracts the tag name. Setters absent from this map pass values
// through untouched.
// Setters that require a tag from a fixed set. Tags outside the set
// produce a Checker error. Setters absent from this map pass values
// through untouched (so `legend true`, `tooltip true`, etc. are
// lenient — the renderer decides how to interpret them).
const ENUM_TAGS = {
  TYPE:            ["category", "value", "time", "log"],
  THEME:           ["dark", "light"],
  STEP:            ["start", "middle", "end"],
  SYMBOL:          ["circle", "rect", "triangle", "diamond", "pin", "arrow", "none"],
  AXIS:            ["left", "right"],
  ROSE_TYPE:       ["radius", "area"],
  LABEL_POSITION:  ["top", "inside", "bottom", "inside-top", "inside-bottom"],
};

// Bare-tag enums that aren't strictly checked for any single setter
// (because the setter accepts multiple value kinds) but still need to
// be in the lexicon as bare tokens so the parser accepts them.
const EXTRA_TAGS = [
  "top", "bottom", "inside",        // legend position
];

const ALL_TAGS = new Set([...Object.values(ENUM_TAGS).flat(), ...EXTRA_TAGS]);

export const lexicon = {
  // Top-level wrapper. Arity 1 — takes one record built by chained
  // arity-2 setters terminating in `{}`.
  "chart":          fn1("CHART"),

  // Series constructors.
  ...Object.fromEntries(SERIES_TYPES.map((s) => [s, fn1(s.toUpperCase())])),

  // All chainable arity-2 setters.
  ...Object.fromEntries(
    Object.keys(OPT_SETTERS).map((method) => [methodToSurface(method), fn2(method)])
  ),

  // Bare tag tokens.
  ...Object.fromEntries([...ALL_TAGS].map((t) => [t, tag()])),
};

// Fields that live at the chart level when assembling the final
// ECharts option. Anything not in this set is treated as a series-level
// attribute (so the user can mix levels freely in a standalone series
// constructor; the assembler hoists chart-level fields up).
export const CHART_LEVEL_FIELDS = new Set([
  "title", "subtitle",
  "xAxis", "yAxis", "yAxisRight",
  "legend", "tooltip", "grid",
  "theme", "palette", "background",
  "width", "height", "animation",
  "series",
]);

export const SERIES_TYPE_NAMES = SERIES_TYPES;
export const OPT_SETTER_FIELDS = OPT_SETTERS;
export const ENUM_TAG_VALUES = ENUM_TAGS;
