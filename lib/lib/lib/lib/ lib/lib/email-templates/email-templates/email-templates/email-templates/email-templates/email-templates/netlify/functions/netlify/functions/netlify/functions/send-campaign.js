/**
 * netlify/functions/send-campaign.js
 * POST /.netlify/functions/send-campaign
 * Internal — triggers a promotional or announcement email to every active
 * subscriber. Protected by INTERNAL_API_SECRET.
 *
 * Body (promotional):
 *   { "type": "promotional", "subject": "...", "headline": "...",
 *     "offerBody": "...", "terms": "...", "ctaLabel": "...", "ctaUrl": "..." }
 * Body (announcement):
 *   { "type": "announcement", "subject": "...", "headline": "...",
 *     "body": "...", "ctaLabel": "...", "ctaUrl": "..." }
 */

var brevo = require("../../lib/brevo");
var { requireBearer } = require("../../lib/auth");
var { createToken } = require("../../lib/unsubscribeToken");
var promotionalEmail = require("../../email-templates/promotional");
var announcementEmail = require("../../email-templates/announcement");
var logger = require("../../lib/logger");

var SITE_URL = process.env.SITE_URL || "https://sylvesterdaniel.co.uk";

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ message: "Method not allowed." }) };
  }

  var auth = requireBearer(event, process.env.INTERNAL_API_SECRET);
  if (!auth.ok) {
    return { statusCode: auth.statusCode, body: JSON.stringify({ message: auth.message }) };
  }

  var body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ message: "Invalid request body." }) };
  }

  var templateFn = body.type === "announcement" ? announcementEmail : promotionalEmail;
  if (body.type !== "announcement" && body.type !== "promotional") {
    return { statusCode: 400, body: JSON.stringify({ message: "type must be 'promotional' or 'announcement'." }) };
  }

  try {
    var contacts = await brevo.getAllListContacts();
    var sent = 0;
    var failed = 0;

    for (var i = 0; i < contacts.length; i++) {
      var c = contacts[i];
      if (c.emailBlacklisted) continue;

      var fullName = (c.attributes && c.attributes.FULL_NAME) || "";
      var unsubscribeUrl = SITE_URL + "/.netlify/functions/unsubscribe?token=" + encodeURIComponent(createToken(c.email));
      var email = templateFn(Object.assign({}, body, { fullName: fullName, siteUrl: SITE_URL, unsubscribeUrl: unsubscribeUrl }));

      try {
        await brevo.sendTransactionalEmail({
          to: c.email,
          toName: fullName,
          subject: email.subject,
          html: email.html,
          tags: [body.type]
        });
        sent++;
      } catch (err) {
        failed++;
        logger.error("send-campaign", "send_failed", { email: c.email, error: err.message });
      }
    }

    logger.info("send-campaign", "complete", { type: body.type, sent: sent, failed: failed });
    return { statusCode: 200, body: JSON.stringify({ message: "Campaign sent.", sent: sent, failed: failed }) };
  } catch (err) {
    logger.error("send-campaign", "failed", { error: err.message });
    return { statusCode: 502, body: JSON.stringify({ message: "Failed to run campaign." }) };
  }
};
