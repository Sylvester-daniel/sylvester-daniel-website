/**
 * netlify/functions/cron/holidays.js
 * Scheduled daily (see netlify.toml). Checks config/holidays.json for a
 * MM-DD match against today and, if found, emails every active subscriber.
 */

var brevo = require("../../../lib/brevo");
var { requireBearer } = require("../../../lib/auth");
var { createToken } = require("../../../lib/unsubscribeToken");
var holidayGreetingEmail = require("../../../email-templates/holidayGreeting");
var logger = require("../../../lib/logger");
var holidays = require("../../../config/holidays.json");

var SITE_URL = process.env.SITE_URL || "https://sylvesterdaniel.co.uk";

exports.handler = async function (event) {
  if (event.httpMethod === "GET" && event.headers && (event.headers.authorization || event.headers.Authorization)) {
    var auth = requireBearer(event, process.env.CRON_SECRET);
    if (!auth.ok) {
      return { statusCode: auth.statusCode, body: JSON.stringify({ message: auth.message }) };
    }
  }

  var today = new Date();
  var mmdd = String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
  var holiday = holidays.find(function (h) { return h.date === mmdd; });

  if (!holiday) {
    return { statusCode: 200, body: JSON.stringify({ message: "No holiday today." }) };
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
      var email = holidayGreetingEmail({
        fullName: fullName, holidayName: holiday.name, message: holiday.message,
        siteUrl: SITE_URL, unsubscribeUrl: unsubscribeUrl
      });

      try {
        await brevo.sendTransactionalEmail({ to: c.email, toName: fullName, subject: email.subject, html: email.html, tags: ["holiday"] });
        sent++;
      } catch (err) {
        failed++;
        logger.error("cron.holidays", "send_failed", { email: c.email, error: err.message });
      }
    }

    logger.info("cron.holidays", "complete", { holiday: holiday.name, sent: sent, failed: failed });
    return { statusCode: 200, body: JSON.stringify({ message: "Holiday cron complete.", holiday: holiday.name, sent: sent, failed: failed }) };
  } catch (err) {
    logger.error("cron.holidays", "failed", { error: err.message });
    return { statusCode: 502, body: JSON.stringify({ message: "Holiday cron failed." }) };
  }
};
