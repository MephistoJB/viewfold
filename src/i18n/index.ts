import type { HomeAssistantLike } from "../types";

type SupportedLocale = "de" | "en" | "fr";

const TRANSLATIONS: Record<SupportedLocale, { covers: string }> = {
  en: { covers: "Covers" },
  de: { covers: "Rollläden & Beschattung" },
  fr: { covers: "Volets et protections solaires" },
};

const NATIVE_COVERS_KEY = "ui.panel.lovelace.strategy.areas.groups.covers";

const localeOf = (hass: HomeAssistantLike): string => {
  if (typeof hass.locale === "string") return hass.locale;
  return hass.locale?.language ?? hass.language ?? "en";
};

export const normalizeLocale = (locale: string): SupportedLocale => {
  const base = locale.toLowerCase().split(/[-_]/u)[0];
  return base === "de" || base === "fr" ? base : "en";
};

export const coversLabel = (hass: HomeAssistantLike): string => {
  const native = hass.localize(NATIVE_COVERS_KEY);
  if (native && native !== NATIVE_COVERS_KEY) return native;
  return TRANSLATIONS[normalizeLocale(localeOf(hass))].covers;
};
