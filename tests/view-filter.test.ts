import { describe, expect, it } from "vitest";
import {
  filterClimateView,
  IncompatibleViewError,
  mergeCoverViews,
} from "../src/transform/view-filter";
import type { UnknownRecord } from "../src/types";
import {
  allClimateStates,
  climateViewFixture,
  entity,
  hassFixture,
} from "./fixtures";

const entitiesIn = (view: UnknownRecord): string[] =>
  (view.sections as { cards: { entity?: string }[] }[]).flatMap((section) =>
    section.cards.flatMap((card) => (card.entity ? [card.entity] : [])),
  );

describe("native climate view filtering", () => {
  it("removes every cover while retaining non-cover climate entities", () => {
    const input = climateViewFixture();
    const result = filterClimateView(
      input,
      hassFixture(allClimateStates()),
      "climate",
    );
    expect(entitiesIn(result)).toEqual([
      "climate.living_room",
      "binary_sensor.office_window",
    ]);
    expect(result.future_field).toEqual({ retained: true });
    expect(input).toEqual(climateViewFixture());
  });

  it("builds Covers solely by filtering the native generator output", () => {
    const result = filterClimateView(
      climateViewFixture(),
      hassFixture(allClimateStates()),
      "covers",
    );
    expect(entitiesIn(result)).toEqual([
      "cover.living_shutter",
      "cover.office_blind",
      "cover.office_window",
      "cover.bedroom_curtain",
      "cover.bedroom_awning",
      "cover.bedroom_shade",
      "cover.unassigned_shutter",
      "cover.generic",
    ]);
    expect(result.sections).toHaveLength(3);
  });

  it("merges native Climate and Security cover output without duplicates", () => {
    const hass = hassFixture(allClimateStates());
    const climate = filterClimateView(climateViewFixture(), hass, "covers");
    const security = filterClimateView(
      {
        type: "sections",
        sections: [
          {
            type: "grid",
            cards: [
              { type: "heading", heading: "Ground floor" },
              { type: "heading", heading: "Office" },
              { type: "tile", entity: "cover.office_window" },
              { type: "tile", entity: "cover.garage" },
              { type: "heading", heading: "Entrance" },
              { type: "tile", entity: "cover.gate" },
              { type: "tile", entity: "cover.front_door" },
            ],
          },
        ],
        sidebar: { future_security_field: true },
      },
      hass,
      "covers",
    );
    const result = mergeCoverViews(climate, security);
    const entities = entitiesIn(result);
    expect(entities).toContain("cover.garage");
    expect(entities).toContain("cover.gate");
    expect(entities).toContain("cover.front_door");
    expect(entities.filter((id) => id === "cover.office_window")).toHaveLength(
      1,
    );
    expect(result.sidebar).toBeUndefined();
  });

  it("prunes empty area headings and floor sections", () => {
    const result = filterClimateView(
      climateViewFixture(),
      hassFixture([entity("cover.living_shutter", "shutter")]),
      "covers",
    );
    const sections = result.sections as { cards: { heading?: string }[] }[];
    expect(sections).toHaveLength(1);
    expect(
      sections[0]?.cards.map((card) => card.heading).filter(Boolean),
    ).toEqual(["Ground floor", "Living room"]);
  });

  it("handles empty instances and a category with no entities", () => {
    expect(
      filterClimateView(
        { type: "sections", sections: [] },
        hassFixture([]),
        "covers",
      ),
    ).toEqual({ type: "sections", sections: [] });
    expect(
      (
        filterClimateView(
          climateViewFixture(),
          hassFixture([entity("climate.living_room")]),
          "covers",
        ).sections as unknown[]
      ).length,
    ).toBe(0);
  });

  it("fails closed on a changed native structure", () => {
    expect(() =>
      filterClimateView(
        { type: "masonry", cards: [] },
        hassFixture([]),
        "climate",
      ),
    ).toThrow(IncompatibleViewError);
    expect(() =>
      filterClimateView(
        { type: "sections", sections: [{ cards: [{ type: "future-card" }] }] },
        hassFixture([]),
        "climate",
      ),
    ).toThrow(IncompatibleViewError);
  });
});
