/**
 * netlify/functions/send-thank-you.js
 * POST /.netlify/functions/send-thank-you
 * Internal — call this yourself (e.g. after replying to a first enquiry)
 * to send a thank-you email. Protected by INTERNAL_API_SECRET.
 *
 * Body: { "email": "person@example.com", "fullName": "Jane Doe" }
 */

var brevo = require("../../lib/brevo");
var { requireBearer } = require("../../lib/auth");
var { isValidEmail } = require("../../lib/validate");
var { createToken } = require("../../lib/unsubscribeToken");
var thankYouEmail = require("../../email-templates/thankYou");
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

  if (!isValidEmail(body.email)) {
    return { statusCode: 400, body: JSON.stringify({ message: "A valid email is required." }) };
  }

  try {
    var unsubscribeUrl = SITE_URL + "/.netlify/functions/unsubscribe?token=" + encodeURIComponent(createToken(body.email));
    var email = thankYouEmail({ fullName: body.fullName || "", siteUrl: SITE_URL, unsubscribeUrl: unsubscribeUrl });

    await brevo.sendTransactionalEmail({
      to: body.email,
      toName: body.fullName,
      subject: email.subject,
      html: email.html,
      tags: ["thank-you"]
    });

    logger.info("send-thank-you", "sent", { email: body.email });
    return { statusCode: 200, body: JSON.stringify({ message: "Thank-you email sent." }) };
  } catch (err) {
    logger.error("send-thank-you", "failed", { error: err.message });
    return { statusCode: 502, body: JSON.stringify({ message: "Failed to send thank-you email." }) };
  }
};
