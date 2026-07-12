/* ============================================================
   Sylvester Daniel — subscribe.js
   Handles validation, honeypot/timing spam checks, reCAPTCHA v3,
   and the submit flow for subscribe.html
   ============================================================ */
(function () {
  "use strict";

  var RECAPTCHA_SITE_KEY = "RECAPTCHA_SITE_KEY"; // replace with your real reCAPTCHA v3 site key
  var SUBSCRIBE_ENDPOINT = "/.netlify/functions/subscribe";

  var form = document.getElementById("subscribe-form");
  var submitBtn = document.getElementById("submit-btn");
  var errorBanner = document.getElementById("error-banner");
  var errorBannerText = document.getElementById("error-banner-text");
  var formView = document.getElementById("form-view");
  var successView = document.getElementById("success-view");
  var successName = document.getElementById("success-name");
  var slateId = document.getElementById("slate-id");
  var loadedAt = Date.now();

  function showFieldError(fieldId, show) {
    var input = document.getElementById(fieldId);
    var err = document.getElementById("err-" + fieldId);
    if (input) input.classList.toggle("invalid", !!show);
    if (err) err.classList.toggle("show", !!show);
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function isValidPhone(value) {
    if (!value) return true;
    return /^[+()\-.\s\d]{7,20}$/.test(value);
  }

  function validate() {
    var valid = true;
    var fullName = form.fullName.value.trim();
    var email = form.email.value.trim();
    var phone = form.phone.value.trim();
    var dob = form.dob.value;
    var consent = form.consent.checked;

    showFieldError("fullName", !fullName);
    if (!fullName) valid = false;

    var emailOk = isValidEmail(email);
    showFieldError("email", !emailOk);
    if (!emailOk) valid = false;

    var phoneOk = isValidPhone(phone);
    showFieldError("phone", !phoneOk);
    if (!phoneOk) valid = false;

    showFieldError("dob", !dob);
    if (!dob) valid = false;

    var consentErr = document.getElementById("err-consent");
    consentErr.classList.toggle("show", !consent);
    if (!consent) valid = false;

    return valid;
  }

  ["fullName", "email", "phone", "dob"].forEach(function (id) {
    document.getElementById(id).addEventListener("input", function () {
      showFieldError(id, false);
    });
  });
  form.consent.addEventListener("change", function () {
    document.getElementById("err-consent").classList.remove("show");
  });

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.classList.toggle("loading", isLoading);
  }

  function getRecaptchaToken() {
    return new Promise(function (resolve, reject) {
      if (typeof grecaptcha === "undefined" || RECAPTCHA_SITE_KEY === "RECAPTCHA_SITE_KEY") {
        resolve(null);
        return;
      }
      grecaptcha.ready(function () {
        grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: "subscribe" })
          .then(resolve)
          .catch(reject);
      });
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorBanner.classList.remove("show");

    if (!validate()) return;

    var honeypot = form.website.value;
    var elapsedMs = Date.now() - loadedAt;

    setLoading(true);

    getRecaptchaToken()
      .then(function (token) {
        return fetch(SUBSCRIBE_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: form.fullName.value.trim(),
            email: form.email.value.trim(),
            phone: form.phone.value.trim(),
            dob: form.dob.value,
            country: form.country.value,
            consent: form.consent.checked,
            website: honeypot,
            elapsedMs: elapsedMs,
            recaptchaToken: token
          })
        });
      })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.message || "Subscription failed.");
          return data;
        });
      })
      .then(function (data) {
        formView.style.display = "none";
        successName.textContent = form.fullName.value.trim() ? ", " + form.fullName.value.trim().split(" ")[0] : "";
        slateId.textContent = "REF #" + (data.subscriberRef || Math.floor(100000 + Math.random() * 900000));
        successView.classList.add("show");
        successView.scrollIntoView({ behavior: "smooth", block: "center" });

        var secondsLeft = 6;
        var countEl = document.getElementById("redirect-count");
        var countdown = setInterval(function () {
          secondsLeft -= 1;
          if (countEl) countEl.textContent = secondsLeft;
          if (secondsLeft <= 0) {
            clearInterval(countdown);
            window.location.href = "index.html";
          }
        }, 1000);
      })
      .catch(function (err) {
        errorBannerText.textContent = err.message || "Something went wrong. Please try again.";
        errorBanner.classList.add("show");
      })
      .finally(function () {
        setLoading(false);
      });
  });
})();
