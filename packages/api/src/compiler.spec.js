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

describe("L0173 / table", () => {
  it("emits a table envelope with headers + rows", async () => {
    const { errors, data } = await compileSource(`
      table
        headers ["Q1", "Q2", "Q3", "Q4"]
        rows [[320, 450, 380, 510], [110, 130, 95, 140]]
        caption "Quarterly revenue"
        {}..
    `);
    expect(errors).toBeNull();
    expect(data.type).toBe("table");
    expect(data.headers).toEqual(["Q1", "Q2", "Q3", "Q4"]);
    expect(data.rows).toEqual([[320, 450, 380, 510], [110, 130, 95, 140]]);
    expect(data.caption).toBe("Quarterly revenue");
  });

  it("accepts column-align list", async () => {
    const { errors, data } = await compileSource(`
      table
        headers ["Name", "Amount"]
        rows [["A", 100], ["B", 200]]
        column-align ["left", "right"]
        {}..
    `);
    expect(errors).toBeNull();
    expect(data.columnAlign).toEqual(["left", "right"]);
  });
});

describe("L0173 / kpi", () => {
  it("emits a kpi envelope with value + label", async () => {
    const { errors, data } = await compileSource(`
      kpi 1240000
        label "Monthly revenue"
        format currency
        {}..
    `);
    expect(errors).toBeNull();
    expect(data.type).toBe("kpi");
    expect(data.value).toBe(1240000);
    expect(data.label).toBe("Monthly revenue");
    expect(data.format).toBe("currency");
  });

  it("auto-derives deltaDirection from positive delta", async () => {
    const { errors, data } = await compileSource(`kpi 100 delta 0.12 {}..`);
    expect(errors).toBeNull();
    expect(data.deltaDirection).toBe("up");
  });

  it("auto-derives deltaDirection from negative delta", async () => {
    const { errors, data } = await compileSource(`kpi 100 delta -0.05 {}..`);
    expect(errors).toBeNull();
    expect(data.deltaDirection).toBe("down");
  });

  it("explicit delta-direction overrides sign", async () => {
    const { errors, data } = await compileSource(
      `kpi 100 delta 0.12 delta-direction down {}..`
    );
    expect(errors).toBeNull();
    expect(data.deltaDirection).toBe("down");
  });

  it("rejects out-of-set format tag", async () => {
    // `up` is a known tag (kpiDirection) but not a valid format.
    const { errors } = await compileSource(`kpi 100 format up {}..`);
    expect(errors).not.toBeNull();
    expect(errors[0].message).toMatch(/Invalid format/);
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
