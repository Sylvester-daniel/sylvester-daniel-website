/**
 * netlify/functions/cron/new-month.js
 * Scheduled for 00:05 on the 1st of each month (see netlify.toml).
 * Sends the "Happy New Month" email to every active subscriber.
 */

var brevo = require("../../../lib/brevo");
var { requireBearer } = require("../../../lib/auth");
var { createToken } = require("../../../lib/unsubscribeToken");
var happyNewMonthEmail = require("../../../email-templates/happyNewMonth");
var logger = require("../../../lib/logger");

var SITE_URL = process.env.SITE_URL || "https://sylvesterdaniel.co.uk";

exports.handler = async function (event) {
  if (event.httpMethod === "GET" && event.headers && (event.headers.authorization || event.headers.Authorization)) {
    var auth = requireBearer(event, process.env.CRON_SECRET);
    if (!auth.ok) {
      return { statusCode: auth.statusCode, body: JSON.stringify({ message: auth.message }) };
    }
  }

  var monthName = new Date().toLocaleString("en-GB", { month: "long" });

  try {
    var contacts = await brevo.getAllListContacts();
    var sent = 0;
    var failed = 0;

    for (var i = 0; i < contacts.length; i++) {
      var c = contacts[i];
      if (c.emailBlacklisted) continue;
      var fullName = (c.attributes && c.attributes.FULL_NAME) || "";
      var unsubscribeUrl = SITE_URL + "/.netlify/functions/unsubscribe?token=" + encodeURIComponent(createToken(c.email));
      var email = happyNewMonthEmail({ fullName: fullName, monthName: monthName, siteUrl: SITE_URL, unsubscribeUrl: unsubscribeUrl });

      try {
        await brevo.sendTransactionalEmail({ to: c.email, toName: fullName, subject: email.subject, html: email.html, tags: ["new-month"] });
        sent++;
      } catch (err) {
        failed++;
        logger.error("cron.new-month", "send_failed", { email: c.email, error: err.message });
      }
    }

    logger.info("cron.new-month", "complete", { sent: sent, failed: failed });
    return { statusCode: 200, body: JSON.stringify({ message: "New month cron complete.", sent: sent, failed: failed }) };
  } catch (err) {
    logger.error("cron.new-month", "failed", { error: err.message });
    return { statusCode: 502, body: JSON.stringify({ message: "New month cron failed." }) };
  }
};
