/**
 * netlify/functions/unsubscribe.js
 * GET /.netlify/functions/unsubscribe?token=...
 *
 * Verifies the signed one-click token from an email's unsubscribe link,
 * blacklists the contact in Brevo, sends the goodbye email, and redirects
 * to a static confirmation page.
 */

var brevo = require("../../lib/brevo");
var { verifyToken, createToken } = require("../../lib/unsubscribeToken");
var goodbyeEmail = require("../../email-templates/goodbye");
var logger = require("../../lib/logger");

var SITE_URL = process.env.SITE_URL || "https://sylvesterdaniel.co.uk";

exports.handler = async function (event) {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method not allowed." };
  }

  var token = (event.queryStringParameters || {}).token;
  var result = verifyToken(token);

  if (!result.valid) {
    logger.warn("unsubscribe", "invalid_token", { reason: result.reason });
    return {
      statusCode: 400,
      headers: { "Content-Type": "text/plain" },
      body: "This unsubscribe link is invalid or has expired. Please email sylvester76daniel@gmail.com to be removed manually."
    };
  }

  try {
    var contact = await brevo.getContact(result.email);
    await brevo.blacklistContact(result.email);

    var fullName = (contact && contact.attributes && contact.attributes.FULL_NAME) || "";
    var email = goodbyeEmail({
      fullName: fullName,
      siteUrl: SITE_URL,
      unsubscribeUrl: SITE_URL + "/.netlify/functions/unsubscribe?token=" + encodeURIComponent(createToken(result.email))
    });

    await brevo.sendTransactionalEmail({
      to: result.email,
      toName: fullName,
      subject: email.subject,
      html: email.html,
      tags: ["goodbye"]
    });

    logger.info("unsubscribe", "success", { email: result.email });
  } catch (err) {
    logger.error("unsubscribe", "partial_failure", { error: err.message });
  }

  return {
    statusCode: 302,
    headers: { Location: SITE_URL + "/unsubscribed.html" }
  };
};
