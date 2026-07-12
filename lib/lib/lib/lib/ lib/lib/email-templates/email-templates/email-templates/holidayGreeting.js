/**
 * email-templates/holidayGreeting.js
 * Trigger: daily cron checks config/holidays.json against today's date.
 */
var { buildEmail } = require("../lib/emailLayout");

function holidayGreetingEmail(params) {
  var firstName = (params.fullName || "").split(" ")[0] || "there";
  var holidayName = params.holidayName || "the holidays";
  var message = params.message || "Warm wishes from me to you and your business.";
  return {
    subject: holidayName + " — a short note from Sylvester Daniel",
    html: buildEmail({
      preheader: message,
      eyebrow: holidayName.toUpperCase(),
      headline: message,
      accent: "#E84393",
      bodyHtml: "<p style='margin:0;'>Hi " + firstName + ", just a short note to say " + message.toLowerCase() + " Thanks for being part of the list this year.</p>",
      unsubscribeUrl: params.unsubscribeUrl
    })
  };
}

module.exports = holidayGreetingEmail;
