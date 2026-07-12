/**
 * email-templates/thankYou.js
 * Trigger: manually triggered after a chosen interaction
 * (e.g. a first enquiry submitted via the contact email/form).
 */
var { buildEmail } = require("../lib/emailLayout");

function thankYouEmail(params) {
  var firstName = (params.fullName || "").split(" ")[0] || "there";
  return {
    subject: "Thanks for reaching out, " + firstName,
    html: buildEmail({
      preheader: "Thanks for getting in touch.",
      eyebrow: "THANK YOU",
      headline: "Thanks for stopping by.",
      accent: "#E84393",
      bodyHtml: "<p style='margin:0;'>Hi " + firstName + ", thanks for reaching out — I'll take a proper look and reply personally, usually within a day or two.</p>",
      unsubscribeUrl: params.unsubscribeUrl
    })
  };
}

module.exports = thankYouEmail;
