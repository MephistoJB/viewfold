import { describe, expect, it } from "vitest";
import { transformHomeDashboard } from "../src/transform/dashboard";
import { transformHomeOverview } from "../src/transform/overview";
import type { CardConfig, UnknownRecord } from "../src/types";
import { entity, hassFixture } from "./fixtures";

const summaryView = (): UnknownRecord => ({
  type: "sections",
  max_columns: 3,
  future: "preserved",
  sections: [
    {
      type: "grid",
      cards: [
        { type: "heading", heading: "Summaries" },
        { type: "repairs", hide_empty: true },
        {
          type: "home-summary",
          summary: "light",
          grid_options: { columns: 6 },
        },
        {
          type: "home-summary",
          summary: "climate",
          grid_options: { columns: 6 },
        },
        {
          type: "home-summary",
          summary: "security",
          grid_options: { columns: 6 },
        },
      ],
    },
  ],
  sidebar: {
    future_sidebar: true,
    sections: [
      {
        type: "grid",
        cards: [
          { type: "heading", heading: "Summaries" },
          { type: "updates", hide_empty: true },
          {
            type: "home-summary",
            summary: "climate",
            grid_options: { columns: 12 },
          },
        ],
      },
    ],
  },
});

describe("Home Dashboard transformations", () => {
  it("injects one localized Covers subview while preserving native views", () => {
    const dashboard = {
      future: 42,
      views: [
        { path: "overview", strategy: { type: "home-overview" } },
        { path: "areas-kitchen", future: true },
        { path: "media-players" },
        { path: "other-devices" },
      ],
    };
    const once = transformHomeDashboard(
      dashboard,
      hassFixture([], { nativeLabel: "Covers" }),
    );
    const twice = transformHomeDashboard(
      once,
      hassFixture([], { nativeLabel: "Covers" }),
    );
    expect((twice.views as UnknownRecord[]).map((view) => view.path)).toEqual([
      "overview",
      "areas-kitchen",
      "covers",
      "media-players",
      "other-devices",
    ]);
    expect(twice.future).toBe(42);
    expect(dashboard.views).toHaveLength(4);
  });

  it("adds native shortcut cards and removes a cover-only Climate summary", () => {
    const input = summaryView();
    const result = transformHomeOverview(
      input,
      hassFixture([entity("cover.office", "shutter")], {
        nativeLabel: "Covers",
      }),
    );
    const sections = result.sections as { cards: CardConfig[] }[];
    const mobile = sections[0]?.cards ?? [];
    expect(mobile.map((card) => card.summary ?? card.label)).toEqual([
      undefined,
      undefined,
      "light",
      "Covers",
      "security",
    ]);
    const covers = mobile.find((card) => card.label === "Covers");
    expect(covers).toMatchObject({
      type: "shortcut",
      tap_action: { action: "navigate", navigation_path: "covers" },
      grid_options: { columns: 6 },
    });
    expect(result.future).toBe("preserved");
    expect(input).toEqual(summaryView());
  });

  it("preserves Climate when a true climate entity remains", () => {
    const result = transformHomeOverview(
      summaryView(),
      hassFixture([entity("climate.room"), entity("cover.window", "window")]),
    );
    const cards =
      (result.sections as { cards: CardConfig[] }[])[0]?.cards ?? [];
    expect(cards.some((card) => card.summary === "climate")).toBe(true);
    expect(cards.filter((card) => card.label).length).toBe(1);
  });

  it("does not add a Covers summary when no covers exist", () => {
    const result = transformHomeOverview(
      summaryView(),
      hassFixture([entity("climate.room")]),
    );
    const cards =
      (result.sections as { cards: CardConfig[] }[])[0]?.cards ?? [];
    expect(cards.some((card) => card.label)).toBe(false);
  });
});
