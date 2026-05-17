// SPDX-License-Identifier: MIT
type Format = "currency" | "percent" | "number" | "compact";
type Direction = "up" | "down" | "neutral";

type KpiCardProps = {
  value?: number | string;
  label?: string;
  delta?: number;
  deltaDirection?: Direction;
  format?: Format;
  caption?: string;
  color?: string;
  theme?: "dark" | "light";
};

function formatValue(v: unknown, fmt?: Format) {
  if (typeof v !== "number") return v === undefined || v === null ? "" : String(v);
  if (!fmt) return new Intl.NumberFormat().format(v);
  switch (fmt) {
    case "currency":
      return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(v);
    case "percent":
      return new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 1 }).format(v);
    case "compact":
      return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(v);
    case "number":
    default:
      return new Intl.NumberFormat().format(v);
  }
}

function formatDelta(d: number | undefined, fmt?: Format) {
  if (typeof d !== "number") return "";
  // Deltas are almost always shown as a percent if the surrounding value
  // is a percent or fractional; otherwise as a signed number with one
  // decimal.
  if (fmt === "percent" || (Math.abs(d) < 1 && d !== 0)) {
    return new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 1, signDisplay: "exceptZero" }).format(d);
  }
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1, signDisplay: "exceptZero" }).format(d);
}

function arrow(dir: Direction | undefined) {
  if (dir === "up") return "▲";
  if (dir === "down") return "▼";
  return "•";
}

export function KpiCard({
  value,
  label,
  delta,
  deltaDirection,
  format,
  caption,
  color,
  theme,
}: KpiCardProps) {
  const dark = theme === "dark";
  const dir: Direction = deltaDirection ?? (typeof delta === "number"
    ? delta > 0 ? "up" : delta < 0 ? "down" : "neutral"
    : "neutral");
  const deltaColor = dir === "up"
    ? (dark ? "text-emerald-400" : "text-emerald-600")
    : dir === "down"
      ? (dark ? "text-rose-400" : "text-rose-600")
      : (dark ? "text-zinc-400" : "text-zinc-500");

  return (
    <div
      className={[
        "rounded-lg p-4 flex flex-col gap-1 border w-fit min-w-[12rem]",
        dark ? "bg-zinc-800 border-zinc-700 text-zinc-100" : "bg-white border-zinc-200 text-zinc-900",
      ].join(" ")}
      style={color ? { backgroundColor: color } : undefined}
    >
      {label && (
        <div className={dark ? "text-xs uppercase tracking-wide text-zinc-400" : "text-xs uppercase tracking-wide text-zinc-500"}>
          {label}
        </div>
      )}
      <div className="text-3xl font-semibold">{formatValue(value, format)}</div>
      {typeof delta === "number" && (
        <div className={`text-sm ${deltaColor}`}>
          {arrow(dir)} {formatDelta(delta, format)}
        </div>
      )}
      {caption && (
        <div className={dark ? "text-xs text-zinc-400" : "text-xs text-zinc-600"}>{caption}</div>
      )}
    </div>
  );
}
