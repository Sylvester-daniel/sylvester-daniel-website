/**
 * netlify/functions/subscribe.js
 * POST /.netlify/functions/subscribe
 *
 * Validates + saves a subscriber, prevents duplicates, and sends the
 * welcome or welcome-back email.
 */

var brevo = require("../../lib/brevo");
var { validateSubscribePayload } = require("../../lib/validate");
var rateLimiter = require("../../lib/rateLimiter");
var logger = require("../../lib/logger");
var { createToken } = require("../../lib/unsubscribeToken");
var welcomeEmail = require("../../email-templates/welcome");
var welcomeBackEmail = require("../../email-templates/welcomeBack");

var SITE_URL = process.env.SITE_URL || "https://sylvesterdaniel.co.uk";
var MIN_SUBMIT_MS = 1200;

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return respond(405, { message: "Method not allowed." });
  }

  var ip = rateLimiter.getClientIp(event);
  if (!rateLimiter.allow(ip)) {
    logger.warn("subscribe", "rate_limited", { ip: ip });
    return respond(429, { message: "Too many requests — please try again in a minute." });
  }

  var body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return respond(400, { message: "Invalid request body." });
  }

  if (body.website) {
    logger.warn("subscribe", "honeypot_triggered", { ip: ip });
    return respond(200, { message: "Subscribed.", subscriberRef: 100000 });
  }

  if (typeof body.elapsedMs === "number" && body.elapsedMs < MIN_SUBMIT_MS) {
    logger.warn("subscribe", "timing_check_failed", { ip: ip, elapsedMs: body.elapsedMs });
    return respond(200, { message: "Subscribed.", subscriberRef: 100000 });
  }

  var recaptchaResult = await verifyRecaptcha(body.recaptchaToken, ip);
  if (!recaptchaResult.ok) {
    logger.warn("subscribe", "recaptcha_failed", { ip: ip, reason: recaptchaResult.reason });
    return respond(400, { message: "Spam check failed. Please try again." });
  }

  var validation = validateSubscribePayload(body);
  if (!validation.valid) {
    return respond(400, { message: validation.errors[0], errors: validation.errors });
  }
  var data = validation.data;

  try {
    var existing = await brevo.getContact(data.email);
    var isReturning = !!(existing && existing.emailBlacklisted);
    var isAlreadyActive = !!(existing && !existing.emailBlacklisted);

    await brevo.upsertContact({
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
      dob: data.dob,
      country: data.country,
      subscriptionDate: new Date().toISOString().slice(0, 10)
    });

    if (isReturning) {
      await brevo.unblacklistContact(data.email);
    }

    if (!isAlreadyActive) {
      var unsubscribeUrl = SITE_URL + "/.netlify/functions/unsubscribe?token=" + encodeURIComponent(createToken(data.email));
      var templateFn = isReturning ? welcomeBackEmail : welcomeEmail;
      var email = templateFn({ fullName: data.fullName, siteUrl: SITE_URL, unsubscribeUrl: unsubscribeUrl });
      await brevo.sendTransactionalEmail({
        to: data.email,
        toName: data.fullName,
        subject: email.subject,
        html: email.html,
        tags: [isReturning ? "welcome-back" : "welcome"]
      });
    }

    logger.info("subscribe", "success", { email: data.email, returning: isReturning });
    return respond(200, {
      message: "Subscribed.",
      subscriberRef: Math.floor(100000 + Math.random() * 900000)
    });
  } catch (err) {
    logger.error("subscribe", "failed", { error: err.message });
    return respond(502, { message: "Something went wrong saving your subscription. Please try again shortly." });
  }
};

async function verifyRecaptcha(token, ip) {
  var secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return { ok: true, reason: "not_configured" };
  if (!token) return { ok: false, reason: "missing_token" };

  try {
    var params = new URLSearchParams({ secret: secret, response: token, remoteip: ip || "" });
    var res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    });
    var data = await res.json();
    var minScore = Number(process.env.RECAPTCHA_MIN_SCORE || 0.5);
    if (!data.success || (typeof data.score === "number" && data.score < minScore)) {
      return { ok: false, reason: "low_score_or_failed" };
    }
    return { ok: true };
  } catch (e) {
    return { ok: true, reason: "verify_error" };
  }
}

function respond(statusCode, bodyObj) {
  return {
    statusCode: statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyObj)
  };
}
