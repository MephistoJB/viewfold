import { describe, expect, it } from "vitest";
import {
  hasRemainingClimate,
  hasVisualCovers,
  isVisualCover,
} from "../src/transform/classifier";
import { allClimateStates, entity, hassFixture } from "./fixtures";

describe("cover classification", () => {
  it("moves only visual shading device classes", () => {
    const hass = hassFixture(allClimateStates());
    for (const id of [
      "cover.living_shutter",
      "cover.office_blind",
      "cover.bedroom_curtain",
      "cover.bedroom_awning",
      "cover.bedroom_shade",
    ]) {
      expect(isVisualCover(hass, id)).toBe(true);
    }
    for (const id of [
      "cover.office_window",
      "cover.generic",
      "cover.garage",
      "cover.gate",
      "cover.front_door",
      "binary_sensor.office_window",
      "climate.living_room",
    ]) {
      expect(isVisualCover(hass, id)).toBe(false);
    }
  });

  it("uses the effective state device class and supports missing registry entries", () => {
    const hass = hassFixture([entity("cover.override", "shade")]);
    expect(isVisualCover(hass, "cover.override")).toBe(true);
    expect(hasVisualCovers(hass)).toBe(true);
  });

  it("includes unavailable entities while excluding hidden and categorized ones", () => {
    const hass = hassFixture(
      [
        entity("cover.available", "shutter", "unavailable"),
        entity("cover.hidden", "shutter"),
        entity("cover.diagnostic", "blind"),
      ],
      {
        entities: {
          "cover.hidden": { hidden: true },
          "cover.diagnostic": { entity_category: "diagnostic" },
        },
      },
    );
    expect(isVisualCover(hass, "cover.available")).toBe(true);
    expect(isVisualCover(hass, "cover.hidden")).toBe(false);
    expect(isVisualCover(hass, "cover.diagnostic")).toBe(false);
  });

  it("detects native climate entities and area sensors", () => {
    expect(
      hasRemainingClimate(hassFixture([entity("cover.x", "shutter")])),
    ).toBe(false);
    expect(
      hasRemainingClimate(hassFixture([entity("cover.x", "window")])),
    ).toBe(true);
    expect(
      hasRemainingClimate(
        hassFixture([entity("sensor.room", "temperature", "21")], {
          areas: {
            room: { area_id: "room", temperature_entity_id: "sensor.room" },
          },
        }),
      ),
    ).toBe(true);
  });
});
