/**
 * email-templates/happyNewMonth.js
 * Trigger: cron runs on the 1st of every month, sent to the full list.
 */
var { buildEmail } = require("../lib/emailLayout");

function happyNewMonthEmail(params) {
  var firstName = (params.fullName || "").split(" ")[0] || "there";
  var monthName = params.monthName || new Date().toLocaleString("en-GB", { month: "long" });
  return {
    subject: "New month, new momentum — " + monthName,
    html: buildEmail({
      preheader: "A fresh month is a good excuse to look at your site again.",
      eyebrow: "THIS MONTH",
      headline: "Happy " + monthName + ", " + firstName + ".",
      accent: "#14B8A6",
      bodyHtml:
        "<p style='margin:0 0 14px;'>A new month is often the easiest excuse to finally fix the thing on your site that's been bothering you, or plan the reel you've been putting off.</p>" +
        "<p style='margin:0;'>If that's on your list this month, reply and let's talk it through — no pressure, just a starting point.</p>",
      ctaLabel: "Start a project",
      ctaUrl: params.siteUrl + "/index.html#contact",
      unsubscribeUrl: params.unsubscribeUrl
    })
  };
}

module.exports = happyNewMonthEmail;
