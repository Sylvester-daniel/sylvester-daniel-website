/**
 * email-templates/announcement.js
 * Trigger: sent manually, on demand, via api/send-campaign.js.
 */
var { buildEmail } = require("../lib/emailLayout");

function announcementEmail(params) {
  var firstName = (params.fullName || "").split(" ")[0] || "there";
  return {
    subject: params.subject || "Something new",
    html: buildEmail({
      preheader: params.preheader || "A new service, just launched.",
      eyebrow: "NEW",
      headline: params.headline || "Introducing something new.",
      accent: "#14B8A6",
      bodyHtml: "<p style='margin:0;'>Hi " + firstName + ", " + (params.body || "there's something new available now.") + "</p>",
      ctaLabel: params.ctaLabel || "Find out more",
      ctaUrl: params.ctaUrl || (params.siteUrl + "/index.html#services"),
      unsubscribeUrl: params.unsubscribeUrl
    })
  };
}

module.exports = announcementEmail;
