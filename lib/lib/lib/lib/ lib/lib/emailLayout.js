/**
 * lib/emailLayout.js
 * Shared table-based HTML wrapper used by every email in email-templates/.
 * Table layout + inline styles is intentional — required for reliable
 * rendering in Outlook, Gmail, and Apple Mail. Do not convert to
 * flexbox/grid or external stylesheets.
 */

var SITE_URL = process.env.SITE_URL || "https://sylvesterdaniel.co.uk";
var LOGO_URL = process.env.EMAIL_LOGO_URL || (SITE_URL + "/assets/logo-email.png");

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function buildEmail(opts) {
  var accent = opts.accent || "#14B8A6";
  var secondaryBlock = opts.secondaryHtml
    ? '<tr><td class="px" style="padding:28px 40px 8px;"><p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.7;color:#5A4B36;">' +
      opts.secondaryHtml + "</p></td></tr>"
    : "";

  var ctaBlock = opts.ctaLabel && opts.ctaUrl
    ? '<tr><td class="px" align="left" style="padding:8px 40px 32px;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0"><tr>' +
      '<td align="center" style="border-radius:6px;background:' + accent + ';">' +
      '<a href="' + opts.ctaUrl + '" style="display:inline-block;padding:14px 32px;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;">' +
      escapeHtml(opts.ctaLabel) + "</a></td></tr></table></td></tr>"
    : "";

  return '<!DOCTYPE html>' +
'<html lang="en" xmlns="http://www.w3.org/1999/xhtml">' +
'<head>' +
'<meta charset="UTF-8" />' +
'<meta name="viewport" content="width=device-width, initial-scale=1.0" />' +
'<meta http-equiv="X-UA-Compatible" content="IE=edge" />' +
'<title>' + escapeHtml(opts.headline) + '</title>' +
'<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->' +
'<style>' +
'body,table,td{font-family:Georgia,\'Times New Roman\',serif;}' +
'body{margin:0;padding:0;background:#0C1116;}' +
'img{border:0;display:block;}a{text-decoration:none;}' +
'@media only screen and (max-width:600px){.container{width:100% !important;}.px{padding-left:24px !important;padding-right:24px !important;}.h1{font-size:24px !important;}}' +
'</style></head>' +
'<body style="margin:0;padding:0;background:#0C1116;">' +
'<div style="display:none;max-height:0;overflow:hidden;opacity:0;">' + escapeHtml(opts.preheader || "") + '</div>' +
'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0C1116;"><tr><td align="center" style="padding:32px 16px;">' +
'<table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#F4F2ED;border-radius:8px;overflow:hidden;">' +

'<tr><td align="center" style="background:#0C1116;padding:28px 24px;">' +
'<img src="' + LOGO_URL + '" width="72" alt="Sylvester Daniel" style="display:block;" /></td></tr>' +

'<tr><td style="background:' + accent + ';height:4px;line-height:4px;font-size:1px;">&nbsp;</td></tr>' +

'<tr><td class="px" style="padding:40px 40px 16px;">' +
'<p style="margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:' + accent + ';font-weight:bold;">' +
escapeHtml(opts.eyebrow || "") + '</p>' +
'<h1 class="h1" style="margin:0 0 16px;font-size:28px;line-height:1.15;color:#12181F;font-weight:700;font-family:Georgia,serif;">' +
escapeHtml(opts.headline) + '</h1>' +
'<div style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#5A4B36;">' + opts.bodyHtml + '</div>' +
'</td></tr>' +

ctaBlock +

'<tr><td class="px" style="padding:0 40px;"><div style="border-top:1px solid rgba(12,17,22,.1);"></div></td></tr>' +

secondaryBlock +

'<tr><td align="center" style="padding:32px 40px 8px;">' +
'<a href="https://instagram.com/sylvesterdaniel" style="margin:0 8px;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#B58A00;">Instagram</a>' +
'<a href="https://facebook.com/sylvesterdaniel" style="margin:0 8px;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#B58A00;">Facebook</a>' +
'</td></tr>' +

'<tr><td align="center" style="background:#12181F;padding:28px 32px;">' +
'<p style="margin:0 0 6px;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:rgba(255,255,255,0.6);">' +
'Sylvester Daniel · Edinburgh, United Kingdom · sylvester76daniel@gmail.com</p>' +
'<p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:rgba(255,255,255,0.6);">' +
'<a href="' + opts.unsubscribeUrl + '" style="color:rgba(255,255,255,0.6);text-decoration:underline;">Unsubscribe</a>' +
'&nbsp;·&nbsp;<a href="' + SITE_URL + '/privacy-policy.html" style="color:rgba(255,255,255,0.6);text-decoration:underline;">Privacy Policy</a></p>' +
'</td></tr>' +

'</table></td></tr></table></body></html>';
}

module.exports = { buildEmail: buildEmail, escapeHtml: escapeHtml, SITE_URL: SITE_URL };
