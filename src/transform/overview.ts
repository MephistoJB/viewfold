import { COVERS_COLOR, COVERS_ICON, COVERS_PATH } from "../config/defaults";
import { coversLabel } from "../i18n";
import type {
  CardConfig,
  HomeAssistantLike,
  SectionConfig,
  UnknownRecord,
} from "../types";
import { hasRemainingClimate, hasVisualCovers } from "./classifier";
import { IncompatibleViewError } from "./view-filter";

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isSummaryContainer = (cards: CardConfig[]): boolean =>
  cards.some(
    (card) =>
      card.type === "home-summary" ||
      card.type === "repairs" ||
      card.type === "updates" ||
      card.type === "discovered-devices",
  );

const isCoversShortcut = (card: CardConfig): boolean => {
  const tapAction = card.tap_action;
  return (
    card.type === "shortcut" &&
    isRecord(tapAction) &&
    tapAction.navigation_path === COVERS_PATH
  );
};

const transformCards = (
  cards: CardConfig[],
  hass: HomeAssistantLike,
): CardConfig[] => {
  if (!isSummaryContainer(cards)) return cards;

  const keepClimate = hasRemainingClimate(hass);
  const filtered = cards.filter(
    (card) =>
      !(
        card.type === "home-summary" &&
        card.summary === "climate" &&
        !keepClimate
      ),
  );
  if (!hasVisualCovers(hass) || filtered.some(isCoversShortcut))
    return filtered;

  const columns = filtered.find(
    (card) => isRecord(card.grid_options) && card.grid_options.columns,
  )?.grid_options;
  const gridOptions = isRecord(columns) ? columns : undefined;
  const coversCard: CardConfig = {
    type: "shortcut",
    label: coversLabel(hass),
    icon: COVERS_ICON,
    color: COVERS_COLOR,
    tap_action: { action: "navigate", navigation_path: COVERS_PATH },
    ...(gridOptions ? { grid_options: { ...gridOptions } } : {}),
  };

  const climateIndex = filtered.findIndex(
    (card) => card.type === "home-summary" && card.summary === "climate",
  );
  const securityIndex = filtered.findIndex(
    (card) => card.type === "home-summary" && card.summary === "security",
  );
  const lightIndex = filtered.findIndex(
    (card) => card.type === "home-summary" && card.summary === "light",
  );
  const index =
    climateIndex >= 0
      ? climateIndex + 1
      : securityIndex >= 0
        ? securityIndex
        : lightIndex >= 0
          ? lightIndex + 1
          : filtered.length;
  const result = [...filtered];
  result.splice(index, 0, coversCard);
  return result;
};

const transformSections = (
  value: unknown,
  hass: HomeAssistantLike,
): unknown => {
  if (!Array.isArray(value)) return value;
  return (value as unknown[]).map((section) => {
    if (!isRecord(section)) return section;
    if (!Array.isArray(section.cards)) return section;
    return {
      ...section,
      cards: transformCards(section.cards as CardConfig[], hass),
    } satisfies SectionConfig;
  });
};

export const transformHomeOverview = (
  view: UnknownRecord,
  hass: HomeAssistantLike,
): UnknownRecord => {
  if (view.type !== "sections" || !Array.isArray(view.sections)) {
    if (hasVisualCovers(hass)) {
      throw new IncompatibleViewError(
        "native home overview is not a sections view",
      );
    }
    return view;
  }

  const sidebar = isRecord(view.sidebar)
    ? {
        ...view.sidebar,
        sections: transformSections(view.sidebar.sections, hass),
      }
    : view.sidebar;

  return {
    ...view,
    sections: transformSections(view.sections, hass),
    ...(sidebar === undefined ? {} : { sidebar }),
  };
};
