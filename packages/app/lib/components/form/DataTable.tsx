// SPDX-License-Identifier: MIT
type Align = "left" | "center" | "right";

type DataTableProps = {
  headers?: (string | number)[];
  rows?: (string | number | null | undefined)[][];
  caption?: string;
  title?: string;
  columnAlign?: Align[];
  striped?: boolean;
  bordered?: boolean;
  theme?: "dark" | "light";
};

function alignClass(a: Align | undefined) {
  if (a === "right") return "text-right";
  if (a === "center") return "text-center";
  return "text-left";
}

function formatCell(v: unknown) {
  if (v === null || v === undefined) return "";
  return String(v);
}

export function DataTable({
  headers,
  rows = [],
  caption,
  title,
  columnAlign,
  striped = true,
  bordered = true,
  theme,
}: DataTableProps) {
  const dark = theme === "dark";
  const tableCls = [
    "w-full text-sm border-collapse",
    bordered && (dark ? "border border-zinc-700" : "border border-zinc-200"),
  ].filter(Boolean).join(" ");
  const thCls = [
    "px-3 py-2 font-semibold",
    bordered && (dark ? "border-b border-zinc-700" : "border-b border-zinc-200"),
    dark ? "bg-zinc-800 text-zinc-100" : "bg-zinc-50 text-zinc-900",
  ].filter(Boolean).join(" ");
  const tdBase = "px-3 py-2";

  return (
    <div className="flex flex-col gap-2">
      {title && <div className={dark ? "text-zinc-100 font-semibold" : "text-zinc-900 font-semibold"}>{title}</div>}
      <table className={tableCls}>
        {caption && <caption className={dark ? "caption-bottom text-xs text-zinc-400 pt-2" : "caption-bottom text-xs text-zinc-600 pt-2"}>{caption}</caption>}
        {headers && headers.length > 0 && (
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} className={`${thCls} ${alignClass(columnAlign?.[i])}`}>
                  {formatCell(h)}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, ri) => {
            const stripe = striped && ri % 2 === 1
              ? (dark ? "bg-zinc-900" : "bg-zinc-50")
              : "";
            const border = bordered ? (dark ? "border-b border-zinc-800" : "border-b border-zinc-100") : "";
            return (
              <tr key={ri} className={`${stripe} ${border}`.trim()}>
                {row.map((cell, ci) => (
                  <td key={ci} className={`${tdBase} ${alignClass(columnAlign?.[ci])}`}>
                    {formatCell(cell)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
