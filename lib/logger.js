/**
 * lib/logger.js
 * Minimal structured console logger. Netlify captures stdout/stderr into
 * function logs automatically, so this just keeps the format consistent
 * and easy to grep / pipe into a log drain later.
 */

function base(level, scope, message, meta) {
  var entry = {
    level: level,
    scope: scope,
    message: message,
    time: new Date().toISOString()
  };
  if (meta && Object.keys(meta).length) entry.meta = meta;
  var line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

module.exports = {
  info: function (scope, message, meta) { base("info", scope, message, meta); },
  warn: function (scope, message, meta) { base("warn", scope, message, meta); },
  error: function (scope, message, meta) { base("error", scope, message, meta); }
};
