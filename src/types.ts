export type UnknownRecord = Record<string, unknown>;

export interface HassState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
}

export interface EntityRegistryEntry {
  entity_id?: string;
  entity_category?: string | null;
  hidden?: boolean;
}

export interface AreaRegistryEntry {
  area_id: string;
  temperature_entity_id?: string | null;
  humidity_entity_id?: string | null;
}

export interface HomeAssistantLike {
  states: Record<string, HassState | undefined>;
  entities: Record<string, EntityRegistryEntry | undefined>;
  areas: Record<string, AreaRegistryEntry | undefined>;
  locale?: { language?: string } | string;
  language?: string;
  localize: (key: string, values?: Record<string, string | number>) => string;
}

export type StrategyGenerate = (
  config: UnknownRecord,
  hass: HomeAssistantLike,
) => Promise<UnknownRecord> | UnknownRecord;

export interface StrategyConstructor {
  generate: StrategyGenerate;
  [key: symbol]: unknown;
}

export interface CardConfig extends UnknownRecord {
  type?: string;
  entity?: string;
}

export interface SectionConfig extends UnknownRecord {
  cards?: CardConfig[];
}
