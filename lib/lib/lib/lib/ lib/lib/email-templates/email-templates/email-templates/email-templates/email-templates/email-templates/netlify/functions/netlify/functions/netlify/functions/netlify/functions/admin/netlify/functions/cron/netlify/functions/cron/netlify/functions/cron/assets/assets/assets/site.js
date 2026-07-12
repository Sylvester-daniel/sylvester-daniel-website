/* ============================================================
   Sylvester Daniel — site.js (homepage)
   ============================================================ */
(function () {
  "use strict";

  document.getElementById("year").textContent = new Date().getFullYear();

  var nav = document.getElementById("site-nav");
  var toggle = document.getElementById("nav-toggle");
  var links = document.getElementById("nav-links");

  window.addEventListener("scroll", function () {
    nav.classList.toggle("scrolled", window.scrollY > 12);
  }, { passive: true });

  toggle.addEventListener("click", function () {
    var open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  links.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });

  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  var range = document.getElementById("compareRange");
  var afterPane = document.getElementById("afterPane");
  var handle = document.getElementById("compareHandle");

  function setCompare(val) {
    afterPane.style.clipPath = "inset(0 0 0 " + val + "%)";
    handle.style.left = val + "%";
  }
  if (range) {
    range.addEventListener("input", function () { setCompare(range.value); });
    setCompare(range.value);
  }

  var form = document.getElementById("inline-subscribe-form");
  if (form) {
    var submitBtn = document.getElementById("inline-submit");
    var errorBanner = document.getElementById("inline-error");
    var successBanner = document.getElementById("inline-success");
    var loadedAt = Date.now();
    var SUBSCRIBE_ENDPOINT = "/.netlify/functions/subscribe";

    function isValidEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      errorBanner.classList.remove("show");
      successBanner.classList.remove("show");

      var fullName = form.fullName.value.trim();
      var email = form.email.value.trim();
      var honeypot = form.website.value;
      var elapsedMs = Date.now() - loadedAt;

      if (!fullName || !isValidEmail(email)) {
        errorBanner.textContent = "Please enter your name and a valid email address.";
        errorBanner.classList.add("show");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.classList.add("loading");

      fetch(SUBSCRIBE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName,
          email: email,
          phone: "",
          dob: "",
          country: "",
          consent: true,
          website: honeypot,
          elapsedMs: elapsedMs
        })
      })
        .then(function (res) {
          return res.json().then(function (data) {
            if (!res.ok) throw new Error(data.message || "Subscription failed.");
            return data;
          });
        })
        .then(function () {
          form.reset();
          successBanner.textContent = "You're on the list — check your inbox for a welcome email. For birthday emails too, use the full sign-up form.";
          successBanner.classList.add("show");
        })
        .catch(function (err) {
          errorBanner.textContent = err.message || "Something went wrong. Please try again, or use the full sign-up form.";
          errorBanner.classList.add("show");
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.classList.remove("loading");
        });
    });
  }
})();
