// SPDX-License-Identifier: MIT
// L0173 — Apache ECharts dialect compiler.
//
// Architecture:
//
// 1. All arity-2 chainable setters are installed onto Checker /
//    Transformer prototypes via a single meta-gen loop over
//    OPT_SETTER_FIELDS in lexicon.js. Each generic setter does
//    `{...v1, [field]: extractValue(v0)}`.
//
// 2. For setters that accept enum tags (THEME, SYMBOL, AXIS, etc.) the
//    Checker validates the tag is in the allowed set and the
//    Transformer extracts the tag string.
//
// 3. Series constructors (BAR / LINE / PIE / SCATTER) and the CHART
//    wrapper are hand-written — they have non-trivial assembly logic.
//    The bar/line/pie/scatter constructors are installed via a loop
//    over SERIES_TYPE_NAMES; SCATTER then overrides its Transformer
//    to inject numeric-axis defaults for the standalone path.
//
// 4. PROG auto-wraps a bare series (a top-level bar/line/pie/scatter
//    that didn't go through `chart`) into a full chart envelope, so
//    the renderer always sees one of two envelope shapes:
//    `{type: "chart", option, theme?, palette?, ...}` or `{print: ...}`.

import {
  Checker as BasisChecker,
  Transformer as BasisTransformer,
  Compiler as BasisCompiler,
} from "@graffiticode/basis";
import {
  OPT_SETTER_FIELDS,
  ENUM_TAG_VALUES,
  CHART_LEVEL_FIELDS,
  SERIES_TYPE_NAMES,
} from "./lexicon.js";
import { resolveColor } from "./tailwind-colors.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Extract a tag's surface name, otherwise return the value untouched.
// In the Checker phase, TAG values are still raw AST nodes
// `{tag: "TAG", elts: ["dark"]}`. In the Transformer phase, basis has
// already lowered them to `{tag: "dark"}`. Handle both.
function extractValue(v) {
  if (v && typeof v === "object") {
    if (v.tag === "TAG" && Array.isArray(v.elts) && v.elts.length > 0) {
      return v.elts[0];
    }
    if (typeof v.tag === "string" && !v.elts) {
      return v.tag;
    }
  }
  return v;
}

function visitArity2(node, options, resume) {
  this.visit(node.elts[0], options, (e0) => {
    this.visit(node.elts[1], options, (e1) => {
      resume([...(e0 || []), ...(e1 || [])], node);
    });
  });
}

function describeValue(v) {
  if (typeof v === "number") return `number ${v}`;
  if (typeof v === "string") return `"${v}"`;
  if (v && typeof v === "object" && typeof v.tag === "string" && !v.elts) {
    return `tag \`${v.tag}\``;
  }
  return JSON.stringify(v);
}

function checkTagInSet(v0, allowed, propName) {
  const tag = extractValue(v0);
  if (typeof tag === "string" && allowed.includes(tag)) return [];
  return [{
    message: `Invalid ${propName} value ${describeValue(v0)}. Expected one of: ${allowed.map((t) => "`" + t + "`").join(", ")}.`,
  }];
}

// ---------------------------------------------------------------------------
// Checker / Transformer skeletons
// ---------------------------------------------------------------------------

export class Checker extends BasisChecker {}
export class Transformer extends BasisTransformer {}

// ---------------------------------------------------------------------------
// Meta-generated arity-2 setters
// ---------------------------------------------------------------------------
//
// The vast majority of methods follow the same shape:
//
//   Checker.METHOD : optional tag-set validation, otherwise visitArity2.
//   Transformer.METHOD : `{...v1, [field]: extractValue(v0)}`.
//
// Methods whose surface keyword is itself a constructor (CHART, BAR,
// LINE, PIE, SCATTER) are excluded — they're hand-written below.
// X_AXIS / Y_AXIS / Y_AXIS_RIGHT use the generic Transformer (the field
// they write is just their inner record). COLOR resolves Tailwind
// tokens to hex.

const CONSTRUCTOR_METHODS = new Set([
  "CHART", "BAR", "LINE", "PIE",
]);

for (const [method, field] of Object.entries(OPT_SETTER_FIELDS)) {
  if (CONSTRUCTOR_METHODS.has(method)) continue;
  const allowed = ENUM_TAG_VALUES[method];
  const surface = method.toLowerCase().replace(/_/g, "-");

  if (allowed) {
    Checker.prototype[method] = function (node, options, resume) {
      this.visit(node.elts[0], options, (e0, v0) => {
        this.visit(node.elts[1], options, (e1) => {
          const errs = [...(e0 || []), ...(e1 || []), ...checkTagInSet(v0, allowed, surface)];
          resume(errs, node);
        });
      });
    };
  } else {
    Checker.prototype[method] = function (node, options, resume) {
      visitArity2.call(this, node, options, resume);
    };
  }

  if (method === "COLOR") {
    Transformer.prototype[method] = function (node, options, resume) {
      this.visit(node.elts[0], options, (e0, v0) => {
        this.visit(node.elts[1], options, (e1, v1) => {
          resume([], { ...v1, color: resolveColor(extractValue(v0)) });
        });
      });
    };
  } else {
    Transformer.prototype[method] = function (node, options, resume) {
      this.visit(node.elts[0], options, (e0, v0) => {
        this.visit(node.elts[1], options, (e1, v1) => {
          resume([], { ...v1, [field]: extractValue(v0) });
        });
      });
    };
  }
}

// ---------------------------------------------------------------------------
// Chart-option assembly
// ---------------------------------------------------------------------------
//
// Both the `chart` wrapper and the standalone-series sugar path in PROG
// run a record through `assembleEnvelope(record, seriesType?)` which:
//
//   - extracts chart-level fields (title / xAxis / yAxis / legend /
//     tooltip / grid / series / theme / palette / background / width /
//     height / animation) from the record;
//   - everything else is treated as a series-level attribute;
//   - if seriesType is provided (standalone sugar) we synthesize a
//     one-entry series list using the remaining fields;
//   - converts the ECharts `option` body and returns an envelope
//     `{type: "chart", option, theme?, palette?, background?, width?, height?}`.

function assembleEnvelope(record, seriesType) {
  const chartLevel = {};
  const seriesLevel = {};
  for (const [k, v] of Object.entries(record || {})) {
    if (CHART_LEVEL_FIELDS.has(k)) chartLevel[k] = v;
    else seriesLevel[k] = v;
  }

  let seriesList;
  if (Array.isArray(chartLevel.series) && chartLevel.series.length > 0) {
    seriesList = chartLevel.series;
  } else if (seriesType) {
    seriesList = [{ type: seriesType, ...seriesLevel }];
  } else {
    seriesList = [];
  }

  // Render ECharts option from chart-level fields + series list.
  const option = {};
  if (chartLevel.title !== undefined || chartLevel.subtitle !== undefined) {
    option.title = {};
    if (chartLevel.title !== undefined) option.title.text = chartLevel.title;
    if (chartLevel.subtitle !== undefined) option.title.subtext = chartLevel.subtitle;
  }
  let legendPosition;
  if (chartLevel.legend !== undefined) {
    const legend = renderLegend(chartLevel.legend);

    // Detect position from the anchor renderLegend set, *before* we
    // mutate `top` for title-stacking. Left/right take precedence over
    // top because vertical side legends are still horizontally anchored
    // even after we push them below the title.
    if (legend?.left !== undefined) legendPosition = "left";
    else if (legend?.right !== undefined) legendPosition = "right";
    else if (legend?.bottom !== undefined) legendPosition = "bottom";
    else if (legend?.top !== undefined) legendPosition = "top";

    // ECharts places any legend without an explicit `bottom` anchor at
    // the top of the canvas (top-default). If there's a title, that
    // means they collide — bump the legend down to clear the title.
    // (Applies equally to `legend top`, `legend left`, `legend right`,
    // and the `legend true` shorthand.)
    if (legend && option.title && legend.bottom === undefined) {
      legend.top = chartLevel.subtitle !== undefined ? 50 : 30;
    }
    option.legend = legend;
  }
  if (chartLevel.tooltip !== undefined) {
    option.tooltip = renderTooltip(chartLevel.tooltip);
  }
  // Default to `containLabel: true` so rotated and long axis labels are
  // included in the chart's bounding box and never get clipped. Any
  // user-supplied `grid` record fields override the default.
  option.grid = { containLabel: true, ...(chartLevel.grid && typeof chartLevel.grid === "object" ? chartLevel.grid : {}) };
  if (chartLevel.animation !== undefined) option.animation = chartLevel.animation;

  const yAxes = [];
  if (chartLevel.xAxis !== undefined) option.xAxis = renderAxis(chartLevel.xAxis);
  if (chartLevel.yAxis !== undefined) yAxes.push(renderAxis(chartLevel.yAxis));
  if (chartLevel.yAxisRight !== undefined) {
    yAxes.push({ ...renderAxis(chartLevel.yAxisRight), position: "right" });
  }
  if (yAxes.length > 0) option.yAxis = yAxes.length === 1 ? yAxes[0] : yAxes;

  option.series = seriesList.map((s) => renderSeries(s, { dualY: yAxes.length > 1, legendPosition }));

  const envelope = { type: "chart", option };
  if (chartLevel.theme !== undefined) envelope.theme = chartLevel.theme;
  if (chartLevel.palette !== undefined) envelope.palette = chartLevel.palette;
  if (chartLevel.background !== undefined) envelope.background = chartLevel.background;
  if (chartLevel.width !== undefined) envelope.width = chartLevel.width;
  if (chartLevel.height !== undefined) envelope.height = chartLevel.height;
  return envelope;
}

function renderLegend(v) {
  // `legend true` is shorthand for "show the legend in its default
  // position" — and ECharts' default is top-center. Make that explicit
  // as `{top: 0}` so the title/legend stacking logic catches it.
  if (v === true) return { top: 0 };
  if (typeof v === "string") {
    // Side legends should run vertically (ECharts' default orient is
    // horizontal regardless of position, which looks wrong for left/
    // right placements).
    if (v === "left" || v === "right") return { [v]: 0, orient: "vertical" };
    return { [v]: 0 };
  }
  if (v && typeof v === "object") return v;
  return undefined;
}

function renderTooltip(v) {
  if (v === true) return { trigger: "axis" };
  if (v && typeof v === "object") return v;
  return undefined;
}

function renderAxis(record) {
  if (!record || typeof record !== "object") return record;
  const out = {};
  if (record.type !== undefined) out.type = record.type;
  // `categories` is the L0173 surface for axis category data; ECharts
  // calls it `data`.
  if (record.categories !== undefined) out.data = record.categories;
  if (record.name !== undefined) out.name = record.name;
  if (record.min !== undefined) out.min = record.min;
  if (record.max !== undefined) out.max = record.max;
  if (record.interval !== undefined) out.interval = record.interval;
  if (record.boundaryGap !== undefined) out.boundaryGap = record.boundaryGap;
  if (record.inverse !== undefined) out.inverse = record.inverse;
  // Per-tick label settings live under `axisLabel` in ECharts. Surface
  // them as flat setters on the axis chain (currently: rotate; extend
  // here for label color / font size / interval as needed).
  if (record.rotate !== undefined) {
    out.axisLabel = { ...(out.axisLabel || {}), rotate: record.rotate };
  }
  return out;
}

// Surface label-position tags are kebab-case (`inside-top`, etc.) to
// match the rest of the language; ECharts expects camelCase.
function mapLabelPosition(p) {
  if (typeof p !== "string") return p;
  if (p === "inside-top") return "insideTop";
  if (p === "inside-bottom") return "insideBottom";
  return p;
}

function renderSeries(s, ctx = {}) {
  const dualY = !!ctx.dualY;
  const legendPosition = ctx.legendPosition;
  if (!s || typeof s !== "object") return s;
  const out = { type: s.type };
  if (s.name !== undefined) out.name = s.name;
  // Surface keyword is `values` (basis's arity-1 `data` owns the `data`
  // surface for upstream piping). The ECharts option field is still
  // `data`, so the translation lives here.
  if (s.values !== undefined) out.data = s.values;
  // Scatter accepts `[[x, y], ...]` pairs (native ECharts) or
  // `[{x: ..., y: ..., name?}, ...]` records. Normalize the record
  // shape to ECharts' `{value: [x, y], name?}`. Record literals arrive
  // as basis-wrapped `{_type: "record", _entries: Map}` here; only the
  // basis renderer phase flattens them later, so we read from
  // `_entries` directly and return a plain object that downstream
  // rendering can treat uniformly.
  if (s.type === "scatter" && Array.isArray(out.data)) {
    out.data = out.data.map((item) => {
      if (
        item && typeof item === "object" &&
        item._type === "record" && item._entries instanceof Map
      ) {
        const x = item._entries.get("tag:x");
        const y = item._entries.get("tag:y");
        if (x === undefined || y === undefined) return item;
        const point = { value: [x, y] };
        for (const [encodedKey, value] of item._entries) {
          const baseKey = encodedKey.substring(encodedKey.indexOf(":") + 1);
          if (baseKey !== "x" && baseKey !== "y") point[baseKey] = value;
        }
        return point;
      }
      return item;
    });
  }
  if (s.stack !== undefined) out.stack = s.stack;
  if (s.smooth !== undefined) out.smooth = s.smooth;
  if (s.step !== undefined) out.step = s.step;
  if (s.barWidth !== undefined) out.barWidth = s.barWidth;
  if (s.symbol !== undefined) out.symbol = s.symbol;
  if (s.symbolSize !== undefined) out.symbolSize = s.symbolSize;
  if (s.areaStyle !== undefined) out.areaStyle = s.areaStyle === true ? {} : s.areaStyle;
  // Labels — `label-position <tag>` implies `label-show true` (a user
  // who positions labels clearly wants them rendered); explicit
  // `label-show false` still wins.
  //
  // For scatter with named points, labels are on by default (mirrors
  // pie, where slice names always render alongside slices) and the
  // formatter shows the point's `name` positioned `top` of the symbol
  // — ECharts' default would otherwise render the `[x, y]` value
  // overlapping the dot, which isn't what users mean by "named
  // points". Explicit `label-show false` opts out.
  const scatterHasNames = s.type === "scatter" && Array.isArray(out.data) &&
    out.data.some((d) => d && typeof d === "object" && d.name !== undefined);
  const scatterLabelOnByDefault = scatterHasNames && s.labelShow !== false;
  if (s.labelShow !== undefined || s.labelPosition !== undefined || scatterLabelOnByDefault) {
    const show = s.labelShow !== undefined ? !!s.labelShow : true;
    const label = { show };
    if (s.labelPosition !== undefined) {
      label.position = mapLabelPosition(s.labelPosition);
    }
    if (show && scatterHasNames) {
      label.formatter = "{b}";
      if (label.position === undefined) label.position = "top";
    }
    out.label = label;
  }
  // Color — string sets itemStyle.color at the series level; an array
  // is a per-data-item palette (useful for pie slices and scatter
  // points).
  if (Array.isArray(s.color)) {
    if (Array.isArray(out.data)) {
      out.data = out.data.map((item, i) => {
        const color = s.color[i % s.color.length];
        // A scatter `[x, y]` pair is itself an array. Spreading it
        // would scatter numeric keys onto the result; wrap it as a
        // `{value: [x, y]}` record instead.
        if (Array.isArray(item)) {
          return { value: item, itemStyle: { color } };
        }
        if (item && typeof item === "object") {
          return { ...item, itemStyle: { ...(item.itemStyle || {}), color } };
        }
        return { value: item, itemStyle: { color } };
      });
    }
  } else if (s.color !== undefined) {
    out.itemStyle = { ...(out.itemStyle || {}), color: s.color };
  }
  if (s.startAngle !== undefined) out.startAngle = s.startAngle;
  if (s.roseType !== undefined) out.roseType = s.roseType;

  // Radius / inner-radius for pie (and donut).
  if (s.type === "pie") {
    const outer = s.radius !== undefined ? s.radius : "75%";
    if (s.innerRadius !== undefined) {
      out.radius = [s.innerRadius, outer];
    } else if (s.radius !== undefined) {
      out.radius = s.radius;
    }
    // Pie ignores `grid` entirely — its `center` is computed against the
    // canvas, not the available chart area. So when a legend sits at the
    // top (or bottom), the pie's slice-label callouts can poke into the
    // legend strip. Shift the center axis along the legend's axis to
    // leave room. User-supplied `center` always wins.
    if (s.center === undefined) {
      if (legendPosition === "top") out.center = ["50%", "60%"];
      else if (legendPosition === "bottom") out.center = ["50%", "40%"];
      else if (legendPosition === "left") out.center = ["60%", "50%"];
      else if (legendPosition === "right") out.center = ["40%", "50%"];
    }
  }

  // Dual y-axis binding.
  if (dualY) {
    out.yAxisIndex = s.axis === "right" ? 1 : 0;
  }

  return out;
}

// ---------------------------------------------------------------------------
// Constructors
// ---------------------------------------------------------------------------

// `chart` is arity-1: takes one record assembled by the chained
// arity-2 setters (terminating in `{}`).
Checker.prototype.CHART = function (node, options, resume) {
  this.visit(node.elts[0], options, (e0) => {
    resume(e0 || [], node);
  });
};

Transformer.prototype.CHART = function (node, options, resume) {
  this.visit(node.elts[0], options, (e0, v0) => {
    resume([], assembleEnvelope(v0 || {}));
  });
};

// `bar`, `line`, `pie`, `scatter` — series constructors (arity 1).
// Emit a bare series record carrying both chart-level and series-level
// fields mixed in; the splitting/assembly is deferred to PROG when
// used standalone, or to `chart` when wrapped.
for (const t of SERIES_TYPE_NAMES) {
  const method = t.toUpperCase();
  Checker.prototype[method] = function (node, options, resume) {
    this.visit(node.elts[0], options, (e0) => {
      resume(e0 || [], node);
    });
  };
  Transformer.prototype[method] = function (node, options, resume) {
    this.visit(node.elts[0], options, (e0, v0) => {
      resume([], { type: t, ...(v0 || {}) });
    });
  };
}

// `scatter` defaults both axes to numeric (`type: "value"`) when the
// user hasn't declared one. Effective only on the standalone PROG path,
// where the series record's top-level keys get hoisted by
// `assembleEnvelope` — inside a `chart` wrapper these stay scoped to
// the series element and are harmlessly ignored, so they never fight
// chart-level axis declarations.
Transformer.prototype.SCATTER = function (node, options, resume) {
  this.visit(node.elts[0], options, (e0, v0) => {
    const rec = { type: "scatter", ...(v0 || {}) };
    if (rec.xAxis === undefined) rec.xAxis = { type: "value" };
    if (rec.yAxis === undefined) rec.yAxis = { type: "value" };
    resume([], rec);
  });
};

// ---------------------------------------------------------------------------
// PROG — top-level assembly
// ---------------------------------------------------------------------------

Transformer.prototype.PROG = function (node, options, resume) {
  this.visit(node.elts[0], options, (e0, v0) => {
    const data = options?.data || {};
    const items = Array.isArray(v0) ? v0 : [v0];
    const last = items[items.length - 1];

    if (!last || typeof last !== "object") {
      resume(e0, { ...data, value: last });
      return;
    }

    // Already a chart envelope — pass through.
    if (last.type === "chart") {
      resume(e0, { ...data, ...last });
      return;
    }

    // Bare series at top level (no `chart` wrapper) — auto-wrap.
    if (SERIES_TYPE_NAMES.includes(last.type)) {
      const { type, ...rest } = last;
      resume(e0, { ...data, ...assembleEnvelope(rest, type) });
      return;
    }

    // `print` debug output and anything else — pass through.
    resume(e0, { ...data, ...last });
  });
};

// Pass-through PRINT helper (basis already handles it; keep for parity
// with the cloned scaffold).
Transformer.prototype.PRINT = function (node, options, resume) {
  this.visit(node.elts[0], options, (e0, v0) => {
    resume(e0, { print: v0 });
  });
};

// ---------------------------------------------------------------------------
// Compiler instance
// ---------------------------------------------------------------------------

export const compiler = new BasisCompiler({
  langID: "0173",
  version: "v0.0.1",
  Checker,
  Transformer,
});
