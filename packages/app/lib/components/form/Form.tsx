// SPDX-License-Identifier: MIT
import "../../index.css";
import { useState, useEffect } from "react";

import { ThemeToggle } from "./ThemeToggle";
import { EChart } from "./EChart";
import { DataTable } from "./DataTable";
import { KpiCard } from "./KpiCard";

function classNames(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function renderErrors(errors: { message: string; from?: number; to?: number }[], theme: string | undefined) {
  return (
    <div className="flex flex-col gap-2">
      {errors.map((error, i) => (
        <div
          key={i}
          className={classNames(
            "rounded-md p-3 border text-sm",
            theme === "dark"
              ? "bg-red-900/50 border-red-700 text-red-200"
              : "bg-red-50 border-red-200 text-red-800"
          )}
        >
          {error.message}
        </div>
      ))}
    </div>
  );
}

function renderJSON(data: unknown) {
  return <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>;
}

function render({ state, theme }: { state: any; theme: string | undefined }) {
  const data = state.data;
  if (!data || typeof data !== "object") return renderJSON(data);

  switch (data.type) {
    case "chart":
      return (
        <EChart
          option={data.option}
          theme={theme as "dark" | "light" | undefined}
          background={data.background}
          width={data.width}
          height={data.height}
        />
      );
    case "table":
      return (
        <DataTable
          headers={data.headers}
          rows={data.rows}
          caption={data.caption}
          title={data.title}
          columnAlign={data.columnAlign}
          striped={data.striped}
          bordered={data.bordered}
          theme={theme as "dark" | "light" | undefined}
        />
      );
    case "kpi":
      return (
        <KpiCard
          value={data.value}
          label={data.label}
          delta={data.delta}
          deltaDirection={data.deltaDirection}
          format={data.format}
          caption={data.caption}
          color={data.color}
          theme={theme as "dark" | "light" | undefined}
        />
      );
    default:
      if (data.print !== undefined) {
        return typeof data.print === "string"
          ? <span className="text-sm">{data.print}</span>
          : renderJSON(data.print);
      }
      return renderJSON(data);
  }
}

export const Form = ({ state }: { state: any }) => {
  const initialTheme = state.data?.theme;
  const [theme, setTheme] = useState<string | undefined>(initialTheme);

  useEffect(() => {
    if (state.data?.theme && state.data.theme !== theme) {
      setTheme(state.data.theme);
    }
  }, [state.data?.theme]);

  useEffect(() => {
    state.apply({ type: "update", args: { theme } });
  }, [theme]);

  return (
    <div
      className={classNames(
        theme === "dark" ? "bg-zinc-900 text-zinc-100" : "bg-white text-zinc-900",
        "rounded-md flex flex-col gap-4 p-4"
      )}
    >
      <div className="flex justify-end">
        <ThemeToggle theme={theme ?? "light"} setTheme={setTheme} />
      </div>
      {Array.isArray(state.data?.errors) && state.data.errors.length > 0
        ? renderErrors(state.data.errors, theme)
        : render({ state, theme })}
    </div>
  );
};
