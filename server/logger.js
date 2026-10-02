/**
 * Small structured logger for hosting platforms. Never pass secrets or raw
 * provider payloads to it; logs remain concise and searchable as JSON.
 */
function write(level, event, context = {}) {
  console[level](JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...context }));
}

export const logger = {
  info: (event, context) => write('log', event, context),
  warn: (event, context) => write('warn', event, context),
  error: (event, context) => write('error', event, context)
};
