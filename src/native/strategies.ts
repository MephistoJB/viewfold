import { COVERS_MODE_KEY, COVERS_MODE_VALUE } from "../config/defaults";
import type { Logger } from "../logging";
import type {
  HomeAssistantLike,
  StrategyConstructor,
  StrategyGenerate,
  UnknownRecord,
} from "../types";
import { transformHomeDashboard } from "../transform/dashboard";
import { transformHomeOverview } from "../transform/overview";
import { filterClimateView, mergeCoverViews } from "../transform/view-filter";

const ORIGINAL_DASHBOARD = Symbol.for(
  "viewfold.original.home-dashboard.generate",
);
const ORIGINAL_OVERVIEW = Symbol.for(
  "viewfold.original.home-overview.generate",
);
const ORIGINAL_CLIMATE = Symbol.for("viewfold.original.climate.generate");
const ORIGINAL_SECURITY = Symbol.for("viewfold.original.security.generate");

interface NativeStrategies {
  dashboard: StrategyConstructor;
  overview: StrategyConstructor;
  climate: StrategyConstructor;
  security: StrategyConstructor;
}

const getStrategy = (tag: string): StrategyConstructor => {
  const strategy = customElements.get(tag) as StrategyConstructor | undefined;
  if (!strategy || typeof strategy.generate !== "function") {
    throw new Error(`${tag} does not expose a static generate() function`);
  }
  return strategy;
};

const captureOriginal = (
  strategy: StrategyConstructor,
  symbol: symbol,
): StrategyGenerate => {
  const captured = strategy[symbol];
  if (typeof captured === "function") return captured as StrategyGenerate;
  const original = strategy.generate;
  Object.defineProperty(strategy, symbol, {
    value: original,
    configurable: false,
    enumerable: false,
    writable: false,
  });
  return original;
};

const waitForStrategies = async (): Promise<NativeStrategies> => {
  await Promise.all([
    customElements.whenDefined("home-dashboard-strategy"),
    customElements.whenDefined("home-overview-view-strategy"),
    customElements.whenDefined("climate-view-strategy"),
    customElements.whenDefined("security-view-strategy"),
  ]);
  return {
    dashboard: getStrategy("home-dashboard-strategy"),
    overview: getStrategy("home-overview-view-strategy"),
    climate: getStrategy("climate-view-strategy"),
    security: getStrategy("security-view-strategy"),
  };
};

const safelyTransform = (
  logger: Logger,
  key: string,
  generated: UnknownRecord,
  transform: () => UnknownRecord,
): UnknownRecord => {
  try {
    return transform();
  } catch (error) {
    logger.warnOnce(
      key,
      "The installed Home Assistant frontend is not compatible with this adapter; native behavior has been preserved.",
      error,
    );
    return generated;
  }
};

export const installStrategyAdapters = async (
  logger: Logger,
): Promise<void> => {
  const strategies = await waitForStrategies();
  const dashboardOriginal = captureOriginal(
    strategies.dashboard,
    ORIGINAL_DASHBOARD,
  );
  const overviewOriginal = captureOriginal(
    strategies.overview,
    ORIGINAL_OVERVIEW,
  );
  const climateOriginal = captureOriginal(strategies.climate, ORIGINAL_CLIMATE);
  const securityOriginal = captureOriginal(
    strategies.security,
    ORIGINAL_SECURITY,
  );

  if (strategies.dashboard.generate === dashboardOriginal) {
    strategies.dashboard.generate = async function (
      config: UnknownRecord,
      hass: HomeAssistantLike,
    ) {
      const generated = await dashboardOriginal.call(this, config, hass);
      return safelyTransform(logger, "dashboard", generated, () =>
        transformHomeDashboard(generated, hass),
      );
    };
  }

  if (strategies.overview.generate === overviewOriginal) {
    strategies.overview.generate = async function (
      config: UnknownRecord,
      hass: HomeAssistantLike,
    ) {
      const generated = await overviewOriginal.call(this, config, hass);
      return safelyTransform(logger, "overview", generated, () =>
        transformHomeOverview(generated, hass),
      );
    };
  }

  if (strategies.climate.generate === climateOriginal) {
    strategies.climate.generate = async function (
      config: UnknownRecord,
      hass: HomeAssistantLike,
    ) {
      const generated = await climateOriginal.call(this, config, hass);
      const mode =
        config[COVERS_MODE_KEY] === COVERS_MODE_VALUE ? "covers" : "climate";
      if (mode === "covers") {
        try {
          const securityGenerated = await securityOriginal.call(
            strategies.security,
            { type: "security" },
            hass,
          );
          return safelyTransform(logger, "climate-covers", generated, () =>
            mergeCoverViews(
              filterClimateView(generated, hass, "covers"),
              filterClimateView(securityGenerated, hass, "covers"),
            ),
          );
        } catch (error) {
          logger.warnOnce(
            "climate-covers",
            "The installed Home Assistant frontend is not compatible with this adapter; native behavior has been preserved.",
            error,
          );
          return generated;
        }
      }
      return safelyTransform(logger, `climate-${mode}`, generated, () =>
        filterClimateView(generated, hass, mode),
      );
    };
  }

  logger.debug("Native Home Dashboard strategy adapters installed");
};
