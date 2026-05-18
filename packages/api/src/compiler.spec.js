// SPDX-License-Identifier: MIT
import { compiler } from "./compiler.js";
import { lexicon as l0173Lexicon } from "./lexicon.js";
import { parser } from "@graffiticode/parser";
import { lexicon as basisLexicon } from "@graffiticode/basis/src/lexicon.js";

const fullLexicon = { ...basisLexicon, ...l0173Lexicon };

async function compileSource(src) {
  const parsed = await parser.parse("0173", src, fullLexicon);
  return new Promise((resolve) => {
    compiler.compile(parsed, {}, {}, (err, data) => {
      resolve({ errors: err && err.length ? err : null, data });
    });
  });
}

describe("L0173 / bar", () => {
  it("standalone bar produces a chart envelope", async () => {
    const { errors, data } = await compileSource(`bar data [120, 200, 150] {}..`);
    expect(errors).toBeNull();
    expect(data.type).toBe("chart");
    expect(data.option.series).toEqual([{ type: "bar", data: [120, 200, 150] }]);
  });

  it("standalone bar with title and x-axis", async () => {
    const { errors, data } = await compileSource(
      `bar title "Sales" x-axis type category categories ["Q1", "Q2"] {} data [320, 450] {}..`
    );
    expect(errors).toBeNull();
    expect(data.type).toBe("chart");
    expect(data.option.title.text).toBe("Sales");
    expect(data.option.xAxis).toEqual({ type: "category", data: ["Q1", "Q2"] });
    expect(data.option.series[0]).toMatchObject({ type: "bar", data: [320, 450] });
  });

  it("bar with Tailwind color resolves to hex", async () => {
    const { errors, data } = await compileSource(`bar color "blue-500" data [1, 2, 3] {}..`);
    expect(errors).toBeNull();
    expect(data.option.series[0].itemStyle.color).toBe("#3b82f6");
  });

  it("bar with unknown color passes through", async () => {
    const { errors, data } = await compileSource(`bar color "#abcdef" data [1, 2] {}..`);
    expect(errors).toBeNull();
    expect(data.option.series[0].itemStyle.color).toBe("#abcdef");
  });

  it("bar with label-show true renders default-position labels", async () => {
    const { errors, data } = await compileSource(`bar label-show true data [10, 20] {}..`);
    expect(errors).toBeNull();
    expect(data.option.series[0].label).toEqual({ show: true });
  });

  it("bar with label-position top implies label-show true", async () => {
    const { errors, data } = await compileSource(`bar label-position top data [10, 20] {}..`);
    expect(errors).toBeNull();
    expect(data.option.series[0].label).toEqual({ show: true, position: "top" });
  });

  it("label-position inside-top maps to camelCase insideTop", async () => {
    const { errors, data } = await compileSource(`bar label-position inside-top data [10, 20] {}..`);
    expect(errors).toBeNull();
    expect(data.option.series[0].label.position).toBe("insideTop");
  });

  it("explicit label-show false suppresses labels even with label-position", async () => {
    const { errors, data } = await compileSource(
      `bar label-position top label-show false data [10, 20] {}..`
    );
    expect(errors).toBeNull();
    expect(data.option.series[0].label).toEqual({ show: false, position: "top" });
  });

  it("rejects out-of-set label-position tag", async () => {
    // `circle` is a known tag (symbol) but not a valid label-position.
    const { errors } = await compileSource(`bar label-position circle data [10, 20] {}..`);
    expect(errors).not.toBeNull();
    expect(errors[0].message).toMatch(/Invalid label-position/);
  });
});

describe("L0173 / line", () => {
  it("standalone line is smooth-aware", async () => {
    const { errors, data } = await compileSource(`line smooth true data [10, 20, 30] {}..`);
    expect(errors).toBeNull();
    expect(data.option.series[0]).toMatchObject({ type: "line", smooth: true, data: [10, 20, 30] });
  });

  it("line accepts step tag", async () => {
    const { errors, data } = await compileSource(`line step middle data [5, 10] {}..`);
    expect(errors).toBeNull();
    expect(data.option.series[0].step).toBe("middle");
  });

  it("rejects out-of-set step tag", async () => {
    // `top` is a known tag (legend position) but not a valid step.
    const { errors } = await compileSource(`line step top data [1] {}..`);
    expect(errors).not.toBeNull();
    expect(errors[0].message).toMatch(/Invalid step/);
  });
});

describe("L0173 / per-slice color palette", () => {
  it("pie with color array stamps itemStyle.color on each slice (hex-resolved)", async () => {
    const { errors, data } = await compileSource(`
      pie title "Customer Segments"
        data [
          { name: "Enterprise" value: 50 }
          { name: "SMB" value: 35 }
          { name: "Individual" value: 15 }
        ]
        color ["blue-600", "emerald-500", "amber-400"]
        {}..
    `);
    expect(errors).toBeNull();
    const slices = data.option.series[0].data;
    expect(slices[0].itemStyle.color).toBe("#2563eb");
    expect(slices[1].itemStyle.color).toBe("#10b981");
    expect(slices[2].itemStyle.color).toBe("#fbbf24");
    expect(data.option.series[0].itemStyle).toBeUndefined();
  });

  it("color array cycles when shorter than data", async () => {
    const { errors, data } = await compileSource(`
      pie data [
        { name: "A" value: 1 }
        { name: "B" value: 2 }
        { name: "C" value: 3 }
        { name: "D" value: 4 }
      ] color ["red-500", "blue-500"] {}..
    `);
    expect(errors).toBeNull();
    const slices = data.option.series[0].data;
    expect(slices[0].itemStyle.color).toBe("#ef4444");
    expect(slices[1].itemStyle.color).toBe("#3b82f6");
    expect(slices[2].itemStyle.color).toBe("#ef4444");
    expect(slices[3].itemStyle.color).toBe("#3b82f6");
  });

  it("bar with numeric data and color array wraps each datum into a record", async () => {
    const { errors, data } = await compileSource(
      `bar data [10, 20, 30] color ["red-500", "blue-500", "green-500"] {}..`
    );
    expect(errors).toBeNull();
    const items = data.option.series[0].data;
    expect(items[0]).toEqual({ value: 10, itemStyle: { color: "#ef4444" } });
    expect(items[1]).toEqual({ value: 20, itemStyle: { color: "#3b82f6" } });
    expect(items[2]).toEqual({ value: 30, itemStyle: { color: "#22c55e" } });
  });
});

describe("L0173 / pie (and donut, rose variants)", () => {
  it("regular pie", async () => {
    const { errors, data } = await compileSource(
      `pie data [{ name: "A" value: 40 }, { name: "B" value: 60 }] {}..`
    );
    expect(errors).toBeNull();
    expect(data.option.series[0].type).toBe("pie");
  });

  it("donut via inner-radius", async () => {
    const { errors, data } = await compileSource(
      `pie inner-radius "60%" outer-radius "80%" data [{name: "A" value: 1}] {}..`
    );
    expect(errors).toBeNull();
    expect(data.option.series[0].radius).toEqual(["60%", "80%"]);
  });

  it("nightingale rose via rose-type tag", async () => {
    const { errors, data } = await compileSource(
      `pie rose-type radius data [{name: "A" value: 1}] {}..`
    );
    expect(errors).toBeNull();
    expect(data.option.series[0].roseType).toBe("radius");
  });

  it("rejects out-of-set rose-type", async () => {
    // `circle` is a known tag (symbol) but not a valid rose-type.
    const { errors } = await compileSource(
      `pie rose-type circle data [{name: "A" value: 1}] {}..`
    );
    expect(errors).not.toBeNull();
    expect(errors[0].message).toMatch(/Invalid rose-type/);
  });
});

describe("L0173 / axis options", () => {
  it("x-axis rotate emits axisLabel.rotate on the chart option", async () => {
    const { errors, data } = await compileSource(
      `bar x-axis type category categories ["very long one", "very long two"] rotate 45 {} data [10, 20] {}..`
    );
    expect(errors).toBeNull();
    expect(data.option.xAxis.axisLabel).toEqual({ rotate: 45 });
  });

  it("default grid.containLabel is true so rotated/long labels are not clipped", async () => {
    const { errors, data } = await compileSource(`bar data [10, 20, 30] {}..`);
    expect(errors).toBeNull();
    expect(data.option.grid.containLabel).toBe(true);
  });

  it("top legend with title stacks below the title (no overlap)", async () => {
    const { errors, data } = await compileSource(
      `bar title "Revenue mix" legend top data [10, 20] {}..`
    );
    expect(errors).toBeNull();
    expect(data.option.legend.top).toBe(30);
  });

  it("top legend with title and subtitle leaves extra room", async () => {
    const { errors, data } = await compileSource(
      `bar title "Revenue mix" subtitle "Q1 results" legend top data [10, 20] {}..`
    );
    expect(errors).toBeNull();
    expect(data.option.legend.top).toBe(50);
  });

  it("top legend without title stays flush to the top", async () => {
    const { errors, data } = await compileSource(`bar legend top data [10, 20] {}..`);
    expect(errors).toBeNull();
    expect(data.option.legend.top).toBe(0);
  });

  it("`legend true` with a title also stacks below the title", async () => {
    // `legend true` is shorthand for the default position (top), so the
    // stacking logic should treat it like `legend top`.
    const { errors, data } = await compileSource(
      `pie title "Customer Segments" data [{name: "A" value: 1}, {name: "B" value: 2}] legend true {}..`
    );
    expect(errors).toBeNull();
    expect(data.option.legend.top).toBe(30);
    // And the pie center should shift down too.
    expect(data.option.series[0].center).toEqual(["50%", "60%"]);
  });

  it("pie pushes its center down when legend is at top (room for slice callouts)", async () => {
    const { errors, data } = await compileSource(
      `pie title "Portfolio" legend top data [{name: "A" value: 1}, {name: "B" value: 2}] {}..`
    );
    expect(errors).toBeNull();
    expect(data.option.series[0].center).toEqual(["50%", "60%"]);
  });

  it("pie pushes center up when legend is at bottom", async () => {
    const { errors, data } = await compileSource(
      `pie legend bottom data [{name: "A" value: 1}] {}..`
    );
    expect(errors).toBeNull();
    expect(data.option.series[0].center).toEqual(["50%", "40%"]);
  });

  it("pie shifts right when legend is on the left (and legend runs vertically)", async () => {
    const { errors, data } = await compileSource(
      `pie data [{name: "A" value: 1}, {name: "B" value: 2}] legend left {}..`
    );
    expect(errors).toBeNull();
    expect(data.option.legend).toEqual({ left: 0, orient: "vertical" });
    expect(data.option.series[0].center).toEqual(["60%", "50%"]);
  });

  it("left legend with title stacks below the title (keeps left position)", async () => {
    const { errors, data } = await compileSource(
      `pie title "Customer Segments" data [{name: "A" value: 1}] legend left {}..`
    );
    expect(errors).toBeNull();
    expect(data.option.legend).toEqual({ left: 0, orient: "vertical", top: 30 });
    expect(data.option.series[0].center).toEqual(["60%", "50%"]);
  });

  it("right legend with title stacks below the title (keeps right position)", async () => {
    const { errors, data } = await compileSource(
      `pie title "Customer Segments" data [{name: "A" value: 1}] legend right {}..`
    );
    expect(errors).toBeNull();
    expect(data.option.legend).toEqual({ right: 0, orient: "vertical", top: 30 });
    expect(data.option.series[0].center).toEqual(["40%", "50%"]);
  });

  it("bottom legend with title does NOT get bumped (already clear of title)", async () => {
    const { errors, data } = await compileSource(
      `pie title "Customer Segments" data [{name: "A" value: 1}] legend bottom {}..`
    );
    expect(errors).toBeNull();
    expect(data.option.legend.top).toBeUndefined();
    expect(data.option.legend.bottom).toBe(0);
  });

  it("pie shifts left when legend is on the right", async () => {
    const { errors, data } = await compileSource(
      `pie data [{name: "A" value: 1}] legend right {}..`
    );
    expect(errors).toBeNull();
    expect(data.option.legend).toEqual({ right: 0, orient: "vertical" });
    expect(data.option.series[0].center).toEqual(["40%", "50%"]);
  });

  it("pie keeps default center when no top/bottom legend", async () => {
    const { errors, data } = await compileSource(
      `pie data [{name: "A" value: 1}, {name: "B" value: 2}] {}..`
    );
    expect(errors).toBeNull();
    expect(data.option.series[0].center).toBeUndefined();
  });
});

describe("L0173 / chart wrapper (multi-series)", () => {
  it("two series on shared axes", async () => {
    const { errors, data } = await compileSource(`
      chart
        title "Revenue vs forecast"
        x-axis type category categories ["Mon", "Tue", "Wed"] {}
        y-axis type value {}
        series [
          bar name "Revenue" data [120, 200, 150] {},
          line name "Forecast" data [110, 180, 160] smooth true {}
        ]
        {}..
    `);
    expect(errors).toBeNull();
    expect(data.type).toBe("chart");
    expect(data.option.title.text).toBe("Revenue vs forecast");
    expect(data.option.series).toHaveLength(2);
    expect(data.option.series[0]).toMatchObject({ type: "bar", name: "Revenue" });
    expect(data.option.series[1]).toMatchObject({ type: "line", name: "Forecast", smooth: true });
  });

  it("dual y-axis with series binding via axis right", async () => {
    const { errors, data } = await compileSource(`
      chart
        x-axis type category categories ["Q1", "Q2"] {}
        y-axis type value name "USD" {}
        y-axis-right type value name "%" {}
        series [
          bar data [100, 200] {},
          line data [5, -3] axis right {}
        ]
        {}..
    `);
    expect(errors).toBeNull();
    expect(data.option.yAxis).toHaveLength(2);
    expect(data.option.yAxis[0].name).toBe("USD");
    expect(data.option.yAxis[1]).toMatchObject({ name: "%", position: "right" });
    expect(data.option.series[0].yAxisIndex).toBe(0);
    expect(data.option.series[1].yAxisIndex).toBe(1);
  });
});

describe("L0173 / theme", () => {
  it("threads theme dark into the envelope", async () => {
    const { errors, data } = await compileSource(`chart theme dark series [bar data [1, 2] {}] {}..`);
    expect(errors).toBeNull();
    expect(data.theme).toBe("dark");
  });

  it("rejects out-of-set theme tag", async () => {
    // `top` is a known tag (legend position) but not a valid theme mode.
    const { errors } = await compileSource(`chart theme top series [bar data [1] {}] {}..`);
    expect(errors).not.toBeNull();
    expect(errors[0].message).toMatch(/Invalid theme/);
  });
});
