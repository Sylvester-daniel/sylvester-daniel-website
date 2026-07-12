/**
 * lib/rateLimiter.js
 * Basic per-IP rate limiting for serverless functions.
 *
 * IMPORTANT: serverless function instances are ephemeral and can run as
 * multiple concurrent copies, so this in-memory store is a best-effort
 * first line of defence, not a hard guarantee. It catches simple abuse
 * (a bot hammering one warm instance). For strict enforcement at scale,
 * pair this with Netlify's platform-level rate limiting or an external
 * store (e.g. Upstash Redis) keyed by IP.
 */

var hits = new Map(); // ip -> [timestamps]
var WINDOW_MS = 60 * 1000;
var MAX_HITS_PER_WINDOW = 5;

function prune(now) {
  hits.forEach(function (timestamps, ip) {
    var recent = timestamps.filter(function (t) { return now - t < WINDOW_MS; });
    if (recent.length === 0) {
      hits.delete(ip);
    } else {
      hits.set(ip, recent);
    }
  });
}

function allow(ip) {
  if (!ip) return true;
  var now = Date.now();
  prune(now);

  var timestamps = hits.get(ip) || [];
  var recent = timestamps.filter(function (t) { return now - t < WINDOW_MS; });

  if (recent.length >= MAX_HITS_PER_WINDOW) {
    hits.set(ip, recent);
    return false;
  }

  recent.push(now);
  hits.set(ip, recent);
  return true;
}

function getClientIp(event) {
  var headers = event.headers || {};
  var forwarded = headers["x-nf-client-connection-ip"] || headers["x-forwarded-for"];
  if (!forwarded) return null;
  return String(forwarded).split(",")[0].trim();
}

module.exports = { allow: allow, getClientIp: getClientIp };
