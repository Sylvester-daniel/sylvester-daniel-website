/**
 * lib/validate.js
 * Server-side validation & sanitization for the subscribe form.
 * Never trust client-side validation alone — this is the real gate.
 */

var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var PHONE_RE = /^[+()\-.\s\d]{7,20}$/;
var DOB_RE = /^\d{4}-\d{2}-\d{2}$/;

function stripTags(value) {
  return String(value || "").replace(/<[^>]*>/g, "").trim();
}

function isValidEmail(value) {
  return typeof value === "string" && EMAIL_RE.test(value.trim()) && value.length <= 254;
}

function isValidPhone(value) {
  if (!value) return true;
  return PHONE_RE.test(String(value).trim());
}

function isValidDob(value) {
  if (!DOB_RE.test(value)) return false;
  var d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  var now = new Date();
  var minDate = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
  return d <= now && d >= minDate;
}

function validateSubscribePayload(body) {
  var errors = [];
  body = body || {};

  var fullName = stripTags(body.fullName).slice(0, 120);
  var email = stripTags(body.email).toLowerCase().slice(0, 254);
  var phone = stripTags(body.phone).slice(0, 30);
  var dob = stripTags(body.dob);
  var country = stripTags(body.country).slice(0, 80);
  var consent = body.consent === true;

  if (!fullName) errors.push("Full name is required.");
  if (!isValidEmail(email)) errors.push("A valid email address is required.");
  if (phone && !isValidPhone(phone)) errors.push("Phone number format is invalid.");
  if (dob && !isValidDob(dob)) errors.push("Date of birth is invalid.");
  if (!consent) errors.push("Consent to the Privacy Policy is required.");

  return {
    valid: errors.length === 0,
    errors: errors,
    data: { fullName: fullName, email: email, phone: phone, dob: dob, country: country, consent: consent }
  };
}

module.exports = {
  stripTags: stripTags,
  isValidEmail: isValidEmail,
  isValidPhone: isValidPhone,
  isValidDob: isValidDob,
  validateSubscribePayload: validateSubscribePayload
};
