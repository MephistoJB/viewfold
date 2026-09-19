import { VISUAL_COVER_DEVICE_CLASSES } from "../config/defaults";
import type { HomeAssistantLike } from "../types";

const domainOf = (entityId: string): string => entityId.split(".", 1)[0] ?? "";

const isPrimaryEntity = (
  hass: HomeAssistantLike,
  entityId: string,
): boolean => {
  const entry = hass.entities[entityId];
  return !entry?.hidden && !entry?.entity_category;
};

export const deviceClassOf = (
  hass: HomeAssistantLike,
  entityId: string,
): string => {
  const value = hass.states[entityId]?.attributes.device_class;
  return typeof value === "string" && value.length > 0 ? value : "none";
};

export const isVisualCover = (
  hass: HomeAssistantLike,
  entityId: string,
): boolean =>
  domainOf(entityId) === "cover" &&
  Boolean(hass.states[entityId]) &&
  isPrimaryEntity(hass, entityId) &&
  VISUAL_COVER_DEVICE_CLASSES.has(deviceClassOf(hass, entityId));

export const hasVisualCovers = (hass: HomeAssistantLike): boolean =>
  Object.keys(hass.states).some((entityId) => isVisualCover(hass, entityId));

export const hasRemainingClimate = (hass: HomeAssistantLike): boolean => {
  const hasAreaSensor = Object.values(hass.areas).some((area) =>
    Boolean(
      (area?.temperature_entity_id &&
        hass.states[area.temperature_entity_id]) ??
      (area?.humidity_entity_id && hass.states[area.humidity_entity_id]),
    ),
  );
  if (hasAreaSensor) return true;

  return Object.keys(hass.states).some((entityId) => {
    if (!isPrimaryEntity(hass, entityId)) return false;
    const domain = domainOf(entityId);
    if (["climate", "fan", "humidifier", "water_heater"].includes(domain)) {
      return true;
    }
    if (domain === "binary_sensor") {
      return deviceClassOf(hass, entityId) === "window";
    }
    if (domain === "cover") {
      return ["window", "none"].includes(deviceClassOf(hass, entityId));
    }
    return false;
  });
};
