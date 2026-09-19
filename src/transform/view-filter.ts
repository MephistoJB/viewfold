import type {
  CardConfig,
  HomeAssistantLike,
  SectionConfig,
  UnknownRecord,
} from "../types";
import { isCoverEntity } from "./classifier";

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
      ? (entityId: string) => isCoverEntity(hass, entityId)
      : (entityId: string) => !isCoverEntity(hass, entityId);

  const sections = view.sections.map((section) => {
    if (!isRecord(section)) {
      throw new IncompatibleViewError("a native section is not an object");
    }
    return filterSection(section, keepEntity);
  });

  return { ...view, sections: sections.filter(Boolean) };
};

interface CardGroup {
  heading?: CardConfig;
  cards: CardConfig[];
}

const splitCardGroups = (cards: CardConfig[]): CardGroup[] => {
  const groups: CardGroup[] = [{ cards: [] }];
  for (const card of cards.slice(1)) {
    if (card.type === "heading") {
      groups.push({ heading: card, cards: [] });
    } else {
      groups[groups.length - 1]?.cards.push(card);
    }
  }
  return groups;
};

const groupKey = (group: CardGroup): string =>
  group.heading && typeof group.heading.heading === "string"
    ? `heading:${group.heading.heading}`
    : "root";

const rebuildCards = (
  firstHeading: CardConfig,
  groups: CardGroup[],
): CardConfig[] => [
  firstHeading,
  ...groups.flatMap((group) => [
    ...(group.heading ? [group.heading] : []),
    ...group.cards,
  ]),
];

export const mergeCoverViews = (
  primary: UnknownRecord,
  secondary: UnknownRecord,
): UnknownRecord => {
  if (!Array.isArray(primary.sections) || !Array.isArray(secondary.sections)) {
    throw new IncompatibleViewError("native cover sources have no sections");
  }

  const merged = (primary.sections as SectionConfig[]).map((section) => ({
    ...section,
    cards: [...validateCards(section.cards)],
  }));
  const seen = new Set(
    merged.flatMap((section) =>
      section.cards.flatMap((card) =>
        typeof card.entity === "string" ? [card.entity] : [],
      ),
    ),
  );

  for (const sourceSection of secondary.sections as SectionConfig[]) {
    const sourceCards = validateCards(sourceSection.cards);
    const firstHeading = sourceCards[0];
    if (firstHeading?.type !== "heading") {
      throw new IncompatibleViewError("native section has no leading heading");
    }
    const sourceGroups = splitCardGroups(sourceCards)
      .map((group) => ({
        ...group,
        cards: group.cards.filter((card) => {
          if (typeof card.entity !== "string" || seen.has(card.entity)) {
            return false;
          }
          seen.add(card.entity);
          return true;
        }),
      }))
      .filter((group) => group.cards.length > 0);
    if (sourceGroups.length === 0) continue;

    const target = merged.find((section) => {
      const targetFirst = section.cards[0];
      return (
        targetFirst?.type === "heading" &&
        targetFirst.heading === firstHeading.heading
      );
    });
    if (!target) {
      merged.push({
        ...sourceSection,
        cards: rebuildCards(firstHeading, sourceGroups),
      });
      continue;
    }

    const targetFirst = target.cards[0];
    if (targetFirst?.type !== "heading") {
      throw new IncompatibleViewError("native section has no leading heading");
    }
    const targetGroups = splitCardGroups(target.cards);
    for (const sourceGroup of sourceGroups) {
      const existing = targetGroups.find(
        (group) => groupKey(group) === groupKey(sourceGroup),
      );
      if (existing) existing.cards.push(...sourceGroup.cards);
      else targetGroups.push(sourceGroup);
    }
    target.cards = rebuildCards(targetFirst, targetGroups);
  }

  return { ...primary, sections: merged };
};
