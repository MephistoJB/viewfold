import { afterEach, describe, expect, it, vi } from "vitest";
import type { Logger } from "../src/logging";
import { installStrategyAdapters } from "../src/native/strategies";
import type { StrategyConstructor, UnknownRecord } from "../src/types";
import { entity, hassFixture } from "./fixtures";

const logger: Logger = {
  debug: vi.fn(),
  warnOnce: vi.fn(),
  error: vi.fn(),
};

const originalCustomElements = globalThis.customElements;

afterEach(() => {
  Object.defineProperty(globalThis, "customElements", {
    value: originalCustomElements,
    configurable: true,
  });
  vi.clearAllMocks();
});

describe("native strategy adapters", () => {
  it("patches once, regenerates safely, and falls back to native output", async () => {
    const dashboardGenerate = vi.fn(() => ({ views: [{ path: "overview" }] }));
    const overviewGenerate = vi.fn(() => ({
      type: "sections",
      sections: [{ cards: [{ type: "repairs" }] }],
    }));
    const climateGenerate = vi.fn<() => UnknownRecord>(() => ({
      type: "sections",
      sections: [
        {
          cards: [
            { type: "heading", heading: "Area" },
            { type: "tile", entity: "cover.shutter" },
          ],
        },
      ],
    }));
    const securityGenerate = vi.fn(() => ({
      type: "sections",
      sections: [],
    }));
    const registry: Record<string, StrategyConstructor> = {
      "home-dashboard-strategy": { generate: dashboardGenerate },
      "home-overview-view-strategy": { generate: overviewGenerate },
      "climate-view-strategy": { generate: climateGenerate },
      "security-view-strategy": { generate: securityGenerate },
    };
    Object.defineProperty(globalThis, "customElements", {
      value: {
        whenDefined: vi.fn(() => Promise.resolve()),
        get: vi.fn((tag: string) => registry[tag]),
      },
      configurable: true,
    });

    await installStrategyAdapters(logger);
    const firstWrapper = registry["home-dashboard-strategy"]?.generate;
    await installStrategyAdapters(logger);
    expect(registry["home-dashboard-strategy"]?.generate).toBe(firstWrapper);

    const hass = hassFixture([entity("cover.shutter", "shutter")]);
    const dashboardStrategy = registry["home-dashboard-strategy"];
    if (!dashboardStrategy) throw new Error("dashboard strategy missing");
    const first = await dashboardStrategy.generate({}, hass);
    const second = await dashboardStrategy.generate({}, hass);
    expect(first.views).toHaveLength(2);
    expect(second.views).toHaveLength(2);
    expect(dashboardGenerate).toHaveBeenCalledTimes(2);

    const covers = await registry["climate-view-strategy"]?.generate(
      { viewfold_mode: "covers" },
      hass,
    );
    expect(covers?.sections).toHaveLength(1);
    expect(securityGenerate).toHaveBeenCalledTimes(1);

    const nativeUnexpected = { type: "future-layout", payload: 1 };
    climateGenerate.mockReturnValueOnce(nativeUnexpected);
    const fallback = await registry["climate-view-strategy"]?.generate(
      {},
      hass,
    );
    expect(fallback).toBe(nativeUnexpected);
    expect(logger.warnOnce).toHaveBeenCalledTimes(1);
  });
});
