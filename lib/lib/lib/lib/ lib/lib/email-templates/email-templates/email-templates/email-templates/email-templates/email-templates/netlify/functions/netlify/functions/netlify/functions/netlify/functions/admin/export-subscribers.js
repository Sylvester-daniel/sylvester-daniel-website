/**
 * netlify/functions/admin/export-subscribers.js
 * GET /.netlify/functions/admin/export-subscribers
 * Protected by INTERNAL_API_SECRET. Returns a CSV of every subscriber.
 */

var brevo = require("../../../lib/brevo");
var { requireBearer } = require("../../../lib/auth");
var logger = require("../../../lib/logger");

exports.handler = async function (event) {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ message: "Method not allowed." }) };
  }

  var auth = requireBearer(event, process.env.INTERNAL_API_SECRET);
  if (!auth.ok) {
    return { statusCode: auth.statusCode, body: JSON.stringify({ message: auth.message }) };
  }

  try {
    var contacts = await brevo.getAllListContacts();
    var rows = [["Full Name", "Email", "Phone", "Date of Birth", "Country", "Subscribed On", "Status"]];

    contacts.forEach(function (c) {
      var a = c.attributes || {};
      rows.push([
        a.FULL_NAME || "",
        c.email || "",
        a.SMS || "",
        a.DOB || "",
        a.COUNTRY || "",
        a.SUBSCRIPTION_DATE || "",
        c.emailBlacklisted ? "Unsubscribed" : "Active"
      ]);
    });

    var csv = rows.map(csvRow).join("\r\n");

    logger.info("admin.export-subscribers", "exported", { count: contacts.length });
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=\"subscribers.csv\""
      },
      body: csv
    };
  } catch (err) {
    logger.error("admin.export-subscribers", "failed", { error: err.message });
    return { statusCode: 502, body: JSON.stringify({ message: "Failed to export subscribers." }) };
  }
};

function csvRow(fields) {
  return fields.map(function (field) {
    var str = String(field == null ? "" : field);
    if (/[",\r\n]/.test(str)) {
      str = '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }).join(",");
}
