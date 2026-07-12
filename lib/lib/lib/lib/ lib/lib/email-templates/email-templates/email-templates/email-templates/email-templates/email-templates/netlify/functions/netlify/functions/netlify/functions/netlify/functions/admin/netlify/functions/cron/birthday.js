/**
 * netlify/functions/cron/birthday.js
 * Scheduled daily (see netlify.toml). Emails every subscriber whose DOB
 * matches today's month/day.
 */

var brevo = require("../../../lib/brevo");
var { requireBearer } = require("../../../lib/auth");
var { createToken } = require("../../../lib/unsubscribeToken");
var birthdayEmail = require("../../../email-templates/birthday");
var logger = require("../../../lib/logger");

var SITE_URL = process.env.SITE_URL || "https://sylvesterdaniel.co.uk";

exports.handler = async function (event) {
  if (event.httpMethod === "GET" && event.headers && (event.headers.authorization || event.headers.Authorization)) {
    var auth = requireBearer(event, process.env.CRON_SECRET);
    if (!auth.ok) {
      return { statusCode: auth.statusCode, body: JSON.stringify({ message: auth.message }) };
    }
  }

  try {
    var contacts = await brevo.getContactsWithBirthdayToday();
    var sent = 0;
    var failed = 0;

    for (var i = 0; i < contacts.length; i++) {
      var c = contacts[i];
      if (c.emailBlacklisted) continue;
      var fullName = (c.attributes && c.attributes.FULL_NAME) || "";
      var unsubscribeUrl = SITE_URL + "/.netlify/functions/unsubscribe?token=" + encodeURIComponent(createToken(c.email));
      var email = birthdayEmail({ fullName: fullName, siteUrl: SITE_URL, unsubscribeUrl: unsubscribeUrl });

      try {
        await brevo.sendTransactionalEmail({ to: c.email, toName: fullName, subject: email.subject, html: email.html, tags: ["birthday"] });
        sent++;
      } catch (err) {
        failed++;
        logger.error("cron.birthday", "send_failed", { email: c.email, error: err.message });
      }
    }

    logger.info("cron.birthday", "complete", { sent: sent, failed: failed });
    return { statusCode: 200, body: JSON.stringify({ message: "Birthday cron complete.", sent: sent, failed: failed }) };
  } catch (err) {
    logger.error("cron.birthday", "failed", { error: err.message });
    return { statusCode: 502, body: JSON.stringify({ message: "Birthday cron failed." }) };
  }
};
