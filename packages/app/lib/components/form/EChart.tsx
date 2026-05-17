// SPDX-License-Identifier: MIT
import { useEffect, useRef } from "react";
import * as echarts from "echarts";

type EChartProps = {
  option: Record<string, unknown>;
  theme?: "dark" | "light";
  background?: string;
  width?: number | string;
  height?: number | string;
};

export function EChart({ option, theme, background, width, height }: EChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const inst = echarts.init(containerRef.current, theme === "dark" ? "dark" : undefined);
    instanceRef.current = inst;
    const onResize = () => inst.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      inst.dispose();
      instanceRef.current = null;
    };
  }, [theme]);

  useEffect(() => {
    if (instanceRef.current) {
      instanceRef.current.setOption(option, true);
    }
  }, [option]);

  const styleW = width !== undefined ? (typeof width === "number" ? `${width}px` : width) : undefined;
  const styleH = height !== undefined ? (typeof height === "number" ? `${height}px` : height) : undefined;

  return (
    <div
      ref={containerRef}
      className="w-full h-96"
      style={{
        ...(styleW ? { width: styleW } : null),
        ...(styleH ? { height: styleH } : null),
        ...(background ? { background } : null),
      }}
    />
  );
}
