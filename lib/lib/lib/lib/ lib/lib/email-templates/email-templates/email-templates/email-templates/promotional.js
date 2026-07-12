/**
 * email-templates/promotional.js
 * Trigger: sent manually, on demand, via api/send-campaign.js.
 */
var { buildEmail } = require("../lib/emailLayout");

function promotionalEmail(params) {
  var firstName = (params.fullName || "").split(" ")[0] || "there";
  return {
    subject: params.subject || "Limited-time offer inside",
    html: buildEmail({
      preheader: params.preheader || "A limited-time offer for subscribers.",
      eyebrow: "LIMITED TIME",
      headline: params.headline || "An offer for your business.",
      accent: "#F5A623",
      bodyHtml:
        "<p style='margin:0 0 14px;'>Hi " + firstName + ", " + (params.offerBody || "here's a limited-time offer for subscribers.") + "</p>" +
        (params.terms ? "<p style='margin:0;font-size:13px;color:#8A857B;'>" + params.terms + "</p>" : ""),
      ctaLabel: params.ctaLabel || "Claim the offer",
      ctaUrl: params.ctaUrl || (params.siteUrl + "/index.html#contact"),
      unsubscribeUrl: params.unsubscribeUrl
    })
  };
}

module.exports = promotionalEmail;
