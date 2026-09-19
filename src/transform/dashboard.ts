import {
  COVERS_ICON,
  COVERS_MODE_KEY,
  COVERS_MODE_VALUE,
  COVERS_PATH,
} from "../config/defaults";
import { coversLabel } from "../i18n";
import type { HomeAssistantLike, UnknownRecord } from "../types";
import { IncompatibleViewError } from "./view-filter";

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const transformHomeDashboard = (
  dashboard: UnknownRecord,
  hass: HomeAssistantLike,
): UnknownRecord => {
  if (!Array.isArray(dashboard.views)) {
    throw new IncompatibleViewError("native home output has no views array");
  }
  if (
    dashboard.views.some((view) => isRecord(view) && view.path === COVERS_PATH)
  ) {
    return dashboard;
  }

  const coversView: UnknownRecord = {
    title: coversLabel(hass),
    path: COVERS_PATH,
    subview: true,
    icon: COVERS_ICON,
    strategy: {
      type: "climate",
      [COVERS_MODE_KEY]: COVERS_MODE_VALUE,
    },
  };
  const nativeViews = dashboard.views as unknown[];
  const insertionIndex = nativeViews.findIndex(
    (view) =>
      isRecord(view) &&
      (view.path === "media-players" || view.path === "other-devices"),
  );
  const views = [...nativeViews];
  views.splice(
    insertionIndex < 0 ? views.length : insertionIndex,
    0,
    coversView,
  );
  return { ...dashboard, views };
};
