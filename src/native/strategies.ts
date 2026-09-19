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

export const installStrategyAdapters = (logger: Logger): Promise<void> => {
  const register = (
    tag: string,
    install: (strategy: StrategyConstructor) => void,
  ): void => {
    const current = customElements.get(tag) as StrategyConstructor | undefined;
    if (current) {
      install(current);
      return;
    }
    void customElements
      .whenDefined(tag)
      .then(() => {
        install(getStrategy(tag));
      })
      .catch((error: unknown) => {
        logger.error(`Failed to register the ${tag} adapter`, error);
      });
  };

  register("home-dashboard-strategy", (dashboard) => {
    const original = captureOriginal(dashboard, ORIGINAL_DASHBOARD);
    if (dashboard.generate !== original) return;
    dashboard.generate = async function (
      config: UnknownRecord,
      hass: HomeAssistantLike,
    ) {
      const generated = await original.call(this, config, hass);
      return safelyTransform(logger, "dashboard", generated, () =>
        transformHomeDashboard(generated, hass),
      );
    };
  });

  register("home-overview-view-strategy", (overview) => {
    const original = captureOriginal(overview, ORIGINAL_OVERVIEW);
    if (overview.generate !== original) return;
    overview.generate = async function (
      config: UnknownRecord,
      hass: HomeAssistantLike,
    ) {
      const generated = await original.call(this, config, hass);
      return safelyTransform(logger, "overview", generated, () =>
        transformHomeOverview(generated, hass),
      );
    };
  });

  register("security-view-strategy", (security) => {
    captureOriginal(security, ORIGINAL_SECURITY);
  });

  register("climate-view-strategy", (climate) => {
    const original = captureOriginal(climate, ORIGINAL_CLIMATE);
    if (climate.generate !== original) return;
    climate.generate = async function (
      config: UnknownRecord,
      hass: HomeAssistantLike,
    ) {
      const generated = await original.call(this, config, hass);
      const mode =
        config[COVERS_MODE_KEY] === COVERS_MODE_VALUE ? "covers" : "climate";
      if (mode === "covers") {
        try {
          const security = customElements.get("security-view-strategy") as
            StrategyConstructor | undefined;
          const securityOriginal = security?.[ORIGINAL_SECURITY];
          if (!security || typeof securityOriginal !== "function") {
            return safelyTransform(logger, "climate-covers", generated, () =>
              filterClimateView(generated, hass, "covers"),
            );
          }
          const generateSecurity = securityOriginal as StrategyGenerate;
          const securityGenerated = await generateSecurity.call(
            security,
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
  });

  logger.debug("Native Home Dashboard strategy adapters installed");
  return Promise.resolve();
};
