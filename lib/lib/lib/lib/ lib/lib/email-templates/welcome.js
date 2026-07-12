/**
 * email-templates/welcomeBack.js
 * Trigger: a previously unsubscribed contact submits the form again.
 */
var { buildEmail } = require("../lib/emailLayout");

function welcomeBackEmail(params) {
  var firstName = (params.fullName || "").split(" ")[0] || "there";
  return {
    subject: "Good to have you back, " + firstName,
    html: buildEmail({
      preheader: "Good to have you back — here's what's changed since you left.",
      eyebrow: "WELCOME BACK",
      headline: "Good to have you back.",
      accent: "#E84393",
      bodyHtml:
        "<p style='margin:0 0 14px;'>Hi " + firstName + ", you're back on the list. Since you were last here, I've been taking on new online store and video projects and refining how I run them — quicker turnarounds, clearer fixed quotes.</p>" +
        "<p style='margin:0;'>If there's a project on your mind, just reply to this email.</p>",
      ctaLabel: "See what's new",
      ctaUrl: params.siteUrl + "/index.html#work",
      unsubscribeUrl: params.unsubscribeUrl
    })
  };
}

module.exports = welcomeBackEmail;
