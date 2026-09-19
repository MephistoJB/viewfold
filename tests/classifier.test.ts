import { describe, expect, it } from "vitest";
import {
  hasCovers,
  hasRemainingClimate,
  isCoverEntity,
} from "../src/transform/classifier";
import { allClimateStates, entity, hassFixture } from "./fixtures";

describe("cover classification", () => {
  it("classifies every primary cover regardless of device class", () => {
    const hass = hassFixture(allClimateStates());
    for (const id of [
      "cover.living_shutter",
      "cover.office_blind",
      "cover.bedroom_curtain",
      "cover.bedroom_awning",
      "cover.bedroom_shade",
      "cover.office_window",
      "cover.generic",
      "cover.garage",
      "cover.gate",
      "cover.front_door",
    ]) {
      expect(isCoverEntity(hass, id)).toBe(true);
    }
    for (const id of ["binary_sensor.office_window", "climate.living_room"]) {
      expect(isCoverEntity(hass, id)).toBe(false);
    }
  });

  it("uses the effective state device class and supports missing registry entries", () => {
    const hass = hassFixture([entity("cover.override", "shade")]);
    expect(isCoverEntity(hass, "cover.override")).toBe(true);
    expect(hasCovers(hass)).toBe(true);
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
    expect(isCoverEntity(hass, "cover.available")).toBe(true);
    expect(isCoverEntity(hass, "cover.hidden")).toBe(false);
    expect(isCoverEntity(hass, "cover.diagnostic")).toBe(false);
  });

  it("detects native climate entities and area sensors", () => {
    expect(
      hasRemainingClimate(hassFixture([entity("cover.x", "shutter")])),
    ).toBe(false);
    expect(
      hasRemainingClimate(hassFixture([entity("cover.x", "window")])),
    ).toBe(false);
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
