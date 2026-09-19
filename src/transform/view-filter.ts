import type {
  CardConfig,
  HomeAssistantLike,
  SectionConfig,
  UnknownRecord,
} from "../types";
import { isVisualCover } from "./classifier";

export class IncompatibleViewError extends Error {}

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const validateCards = (cards: unknown): CardConfig[] => {
  if (!Array.isArray(cards)) {
    throw new IncompatibleViewError("a native section has no cards array");
  }
  for (const card of cards) {
    if (!isRecord(card)) {
      throw new IncompatibleViewError("a native card is not an object");
    }
    if (card.type !== "heading" && typeof card.entity !== "string") {
      throw new IncompatibleViewError(
        "an unsupported native climate card was found",
      );
    }
  }
  return cards as CardConfig[];
};

const filterSection = (
  section: SectionConfig,
  keepEntity: (entityId: string) => boolean,
): SectionConfig | undefined => {
  const cards = validateCards(section.cards);
  const keepIndexes = new Set<number>();

  cards.forEach((card, index) => {
    if (typeof card.entity === "string" && keepEntity(card.entity)) {
      keepIndexes.add(index);
    }
  });
  if (keepIndexes.size === 0) return undefined;

  cards.forEach((card, index) => {
    if (card.type !== "heading") return;
    if (index === 0) {
      keepIndexes.add(index);
      return;
    }
    const nextHeading = cards.findIndex(
      (candidate, candidateIndex) =>
        candidateIndex > index && candidate.type === "heading",
    );
    const end = nextHeading === -1 ? cards.length : nextHeading;
    if ([...keepIndexes].some((kept) => kept > index && kept < end)) {
      keepIndexes.add(index);
    }
  });

  return {
    ...section,
    cards: cards.filter((_card, index) => keepIndexes.has(index)),
  };
};

export const filterClimateView = (
  view: UnknownRecord,
  hass: HomeAssistantLike,
  mode: "climate" | "covers",
): UnknownRecord => {
  if (view.type !== "sections" || !Array.isArray(view.sections)) {
    throw new IncompatibleViewError(
      "native climate output is not a sections view",
    );
  }

  const keepEntity =
    mode === "covers"
      ? (entityId: string) => isVisualCover(hass, entityId)
      : (entityId: string) => !isVisualCover(hass, entityId);

  const sections = view.sections.map((section) => {
    if (!isRecord(section)) {
      throw new IncompatibleViewError("a native section is not an object");
    }
    return filterSection(section, keepEntity);
  });

  return { ...view, sections: sections.filter(Boolean) };
};
