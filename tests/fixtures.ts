import type {
  AreaRegistryEntry,
  EntityRegistryEntry,
  HassState,
  HomeAssistantLike,
  UnknownRecord,
} from "../src/types";

export const entity = (
  entityId: string,
  deviceClass?: string,
  state = "closed",
): HassState => ({
  entity_id: entityId,
  state,
  attributes: deviceClass ? { device_class: deviceClass } : {},
});

export const hassFixture = (
  states: HassState[],
  options: {
    locale?: string;
    nativeLabel?: string;
    entities?: Record<string, EntityRegistryEntry | undefined>;
    areas?: Record<string, AreaRegistryEntry | undefined>;
  } = {},
): HomeAssistantLike => ({
  states: Object.fromEntries(states.map((state) => [state.entity_id, state])),
  entities: options.entities ?? {},
  areas: options.areas ?? {},
  locale: { language: options.locale ?? "en" },
  localize: (key) =>
    key === "ui.panel.lovelace.strategy.areas.groups.covers" &&
    options.nativeLabel
      ? options.nativeLabel
      : key,
});

export const climateViewFixture = (): UnknownRecord => ({
  type: "sections",
  max_columns: 2,
  future_field: { retained: true },
  sections: [
    {
      type: "grid",
      column_span: 2,
      future_section_field: "retained",
      cards: [
        { type: "heading", heading: "Ground floor", icon: "mdi:home-floor-0" },
        { type: "heading", heading: "Living room" },
        { type: "tile", entity: "climate.living_room", future_card_field: 1 },
        { type: "tile", entity: "cover.living_shutter" },
        { type: "heading", heading: "Office" },
        { type: "tile", entity: "cover.office_blind" },
        { type: "tile", entity: "cover.office_window" },
        { type: "tile", entity: "binary_sensor.office_window" },
      ],
    },
    {
      type: "grid",
      cards: [
        { type: "heading", heading: "First floor" },
        { type: "heading", heading: "Bedroom" },
        { type: "tile", entity: "cover.bedroom_curtain" },
        { type: "tile", entity: "cover.bedroom_awning" },
        { type: "tile", entity: "cover.bedroom_shade" },
      ],
    },
    {
      type: "grid",
      cards: [
        { type: "heading", heading: "Other devices" },
        { type: "tile", entity: "cover.unassigned_shutter" },
        { type: "tile", entity: "cover.generic" },
      ],
    },
  ],
});

export const allClimateStates = (): HassState[] => [
  entity("climate.living_room", undefined, "heat"),
  entity("cover.living_shutter", "shutter"),
  entity("cover.office_blind", "blind", "unavailable"),
  entity("cover.office_window", "window"),
  entity("binary_sensor.office_window", "window", "off"),
  entity("cover.bedroom_curtain", "curtain"),
  entity("cover.bedroom_awning", "awning"),
  entity("cover.bedroom_shade", "shade"),
  entity("cover.unassigned_shutter", "shutter"),
  entity("cover.generic"),
  entity("cover.garage", "garage"),
  entity("cover.gate", "gate"),
  entity("cover.front_door", "door"),
];
