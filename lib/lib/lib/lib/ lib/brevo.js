/**
 * lib/brevo.js
 * All calls to the Brevo REST API in one place (contacts, transactional
 * email, campaigns). Requires BREVO_API_KEY, BREVO_LIST_ID, and
 * BREVO_SENDER_EMAIL / BREVO_SENDER_NAME as environment variables.
 *
 * Docs: https://developers.brevo.com/reference
 */

var logger = require("./logger");

var BASE_URL = "https://api.brevo.com/v3";

function requireEnv(name) {
  var value = process.env[name];
  if (!value) throw new Error("Missing required environment variable: " + name);
  return value;
}

function apiKey() {
  return requireEnv("BREVO_API_KEY");
}

async function brevoRequest(method, path, body) {
  var res = await fetch(BASE_URL + path, {
    method: method,
    headers: {
      "api-key": apiKey(),
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  var text = await res.text();
  var data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { /* non-JSON response */ }

  if (!res.ok) {
    var message = (data && (data.message || data.code)) || ("Brevo API error " + res.status);
    var err = new Error(message);
    err.status = res.status;
    err.details = data;
    throw err;
  }
  return data;
}

async function upsertContact(fields) {
  var listId = Number(requireEnv("BREVO_LIST_ID"));
  var attributes = {};
  if (fields.fullName) attributes.FULL_NAME = fields.fullName;
  if (fields.phone) attributes.SMS = fields.phone;
  if (fields.dob) attributes.DOB = fields.dob;
  if (fields.country) attributes.COUNTRY = fields.country;
  if (fields.subscriptionDate) attributes.SUBSCRIPTION_DATE = fields.subscriptionDate;

  return brevoRequest("POST", "/contacts", {
    email: fields.email,
    attributes: attributes,
    listIds: [listId],
    updateEnabled: true
  });
}

async function getContact(email) {
  try {
    return await brevoRequest("GET", "/contacts/" + encodeURIComponent(email));
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

async function blacklistContact(email) {
  return brevoRequest("PUT", "/contacts/" + encodeURIComponent(email), {
    emailBlacklisted: true
  });
}

async function unblacklistContact(email) {
  return brevoRequest("PUT", "/contacts/" + encodeURIComponent(email), {
    emailBlacklisted: false
  });
}

async function sendTransactionalEmail(opts) {
  var senderEmail = requireEnv("BREVO_SENDER_EMAIL");
  var senderName = process.env.BREVO_SENDER_NAME || "Sylvester Daniel";

  var payload = {
    sender: { email: senderEmail, name: senderName },
    to: [{ email: opts.to, name: opts.toName || undefined }],
    subject: opts.subject,
    htmlContent: opts.html,
    tags: opts.tags || undefined
  };

  try {
    var result = await brevoRequest("POST", "/smtp/email", payload);
    logger.info("brevo.sendTransactionalEmail", "sent", { to: opts.to, subject: opts.subject });
    return result;
  } catch (err) {
    logger.error("brevo.sendTransactionalEmail", "failed", { to: opts.to, subject: opts.subject, error: err.message });
    throw err;
  }
}

async function getAllListContacts() {
  var listId = Number(requireEnv("BREVO_LIST_ID"));
  var limit = 500;
  var offset = 0;
  var all = [];

  while (true) {
    var page = await brevoRequest(
      "GET",
      "/contacts/lists/" + listId + "/contacts?limit=" + limit + "&offset=" + offset
    );
    var contacts = (page && page.contacts) || [];
    all = all.concat(contacts);
    if (contacts.length < limit) break;
    offset += limit;
  }
  return all;
}

async function getContactsWithBirthdayToday() {
  var all = await getAllListContacts();
  var today = new Date();
  var mmdd = String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");

  return all.filter(function (c) {
    var dob = c.attributes && c.attributes.DOB;
    if (!dob) return false;
    return String(dob).slice(5, 10) === mmdd;
  });
}

module.exports = {
  upsertContact: upsertContact,
  getContact: getContact,
  blacklistContact: blacklistContact,
  unblacklistContact: unblacklistContact,
  sendTransactionalEmail: sendTransactionalEmail,
  getAllListContacts: getAllListContacts,
  getContactsWithBirthdayToday: getContactsWithBirthdayToday
};
