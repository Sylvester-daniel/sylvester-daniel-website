/**
 * lib/auth.js
 * Shared bearer-token check for internal/admin/cron endpoints.
 * Usage: requireBearer(event, process.env.INTERNAL_API_SECRET)
 */

function requireBearer(event, expectedSecret) {
  if (!expectedSecret) {
    return { ok: false, statusCode: 500, message: "Server is missing its auth secret." };
  }
  var header = (event.headers && (event.headers.authorization || event.headers.Authorization)) || "";
  var match = header.match(/^Bearer\s+(.+)$/i);
  var provided = match ? match[1].trim() : null;

  if (!provided || provided !== expectedSecret) {
    return { ok: false, statusCode: 401, message: "Unauthorized." };
  }
  return { ok: true };
}

module.exports = { requireBearer: requireBearer };
