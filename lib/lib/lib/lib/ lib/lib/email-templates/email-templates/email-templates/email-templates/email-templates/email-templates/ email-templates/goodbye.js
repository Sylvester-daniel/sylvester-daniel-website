/**
 * email-templates/goodbye.js
 * Trigger: unsubscribe link clicked.
 */
var { buildEmail } = require("../lib/emailLayout");

function goodbyeEmail(params) {
  var firstName = (params.fullName || "").split(" ")[0] || "there";
  return {
    subject: "You've been unsubscribed",
    html: buildEmail({
      preheader: "You won't hear from us again — thanks for the time you were here.",
      eyebrow: "GOODBYE",
      headline: "You're unsubscribed.",
      accent: "#5A4B36",
      bodyHtml:
        "<p style='margin:0 0 14px;'>Hi " + firstName + ", you won't receive any further emails from Sylvester Daniel. Thanks for being on the list for a while.</p>" +
        "<p style='margin:0;'>Changed your mind? You're welcome to subscribe again any time.</p>",
      ctaLabel: "Subscribe again",
      ctaUrl: params.siteUrl + "/subscribe.html",
      unsubscribeUrl: params.unsubscribeUrl
    })
  };
}

module.exports = goodbyeEmail;
