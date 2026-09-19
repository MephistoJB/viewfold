const PREFIX = "[Viewfold]";
const warned = new Set<string>();

export interface Logger {
  debug: (message: string, ...details: unknown[]) => void;
  warnOnce: (key: string, message: string, error?: unknown) => void;
  error: (message: string, error?: unknown) => void;
}

export const createLogger = (debugEnabled: boolean): Logger => ({
  debug(message, ...details) {
    if (debugEnabled) console.debug(PREFIX, message, ...details);
  },
  warnOnce(key, message, error) {
    if (warned.has(key)) return;
    warned.add(key);
    console.warn(PREFIX, message, ...(error === undefined ? [] : [error]));
  },
  error(message, error) {
    console.error(PREFIX, message, ...(error === undefined ? [] : [error]));
  },
});
