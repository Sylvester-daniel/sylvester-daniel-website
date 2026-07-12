/**
 * lib/unsubscribeToken.js
 * Signed, stateless one-click unsubscribe tokens (HMAC-SHA256).
 */

var crypto = require("crypto");

function getSecret() {
  var secret = process.env.UNSUBSCRIBE_TOKEN_SECRET;
  if (!secret) {
    throw new Error("UNSUBSCRIBE_TOKEN_SECRET is not set.");
  }
  return secret;
}

function base64url(input) {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(input) {
  input = input.replace(/-/g, "+").replace(/_/g, "/");
  while (input.length % 4) input += "=";
  return Buffer.from(input, "base64").toString("utf8");
}

function createToken(email, ttlDays) {
  ttlDays = ttlDays || 365;
  var payload = {
    email: email.toLowerCase(),
    exp: Date.now() + ttlDays * 24 * 60 * 60 * 1000
  };
  var payloadStr = base64url(JSON.stringify(payload));
  var signature = crypto.createHmac("sha256", getSecret()).update(payloadStr).digest("hex");
  return payloadStr + "." + signature;
}

function verifyToken(token) {
  if (!token || token.indexOf(".") === -1) return { valid: false, reason: "malformed" };
  var parts = token.split(".");
  var payloadStr = parts[0];
  var signature = parts[1];

  var expected = crypto.createHmac("sha256", getSecret()).update(payloadStr).digest("hex");
  var sigBuf = Buffer.from(signature || "", "hex");
  var expBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false, reason: "bad_signature" };
  }

  var payload;
  try {
    payload = JSON.parse(base64urlDecode(payloadStr));
  } catch (e) {
    return { valid: false, reason: "bad_payload" };
  }

  if (!payload.email || !payload.exp) return { valid: false, reason: "bad_payload" };
  if (Date.now() > payload.exp) return { valid: false, reason: "expired" };

  return { valid: true, email: payload.email };
}

module.exports = { createToken: createToken, verifyToken: verifyToken };
