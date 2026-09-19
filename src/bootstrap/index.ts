import { createLogger } from "../logging";
import { installStrategyAdapters } from "../native/strategies";

const BOOTSTRAP_MARKER = Symbol.for("viewfold.bootstrap.promise");

type MarkedWindow = Window & { [BOOTSTRAP_MARKER]?: Promise<void> };

export const bootstrap = (
  target: MarkedWindow = window,
  moduleUrl = import.meta.url,
): Promise<void> => {
  if (target[BOOTSTRAP_MARKER]) return target[BOOTSTRAP_MARKER];
  const debug = new URL(moduleUrl).searchParams.get("debug") === "1";
  const logger = createLogger(debug);
  const initialization = installStrategyAdapters(logger).catch(
    (error: unknown) => {
      logger.error(
        "Initialization failed; Home Assistant will continue with its native dashboard behavior.",
        error,
      );
    },
  );
  Object.defineProperty(target, BOOTSTRAP_MARKER, {
    value: initialization,
    configurable: false,
    enumerable: false,
    writable: false,
  });
  return initialization;
};
