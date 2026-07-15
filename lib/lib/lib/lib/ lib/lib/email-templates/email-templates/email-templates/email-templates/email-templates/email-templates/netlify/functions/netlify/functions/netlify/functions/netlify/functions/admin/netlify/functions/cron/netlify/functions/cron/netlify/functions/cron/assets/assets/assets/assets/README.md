# Sylvester Daniel — Website + Email Subscription & Automation System

A complete marketing website for Sylvester Daniel (web design & development,
video editing, and graphic design for online stores and small businesses),
with a full subscription form, backend, and email automation system built
in — powered by Brevo (free tier: 300 emails/day) and Netlify Functions.

Read this whole file before deploying.

---

## 1. What's included

- Homepage (index.html) with an inline newsletter signup section
- Full subscription form page (subscribe.html)
- Privacy policy page (privacy-policy.html)
- Unsubscribe confirmation page (unsubscribed.html)
- Backend API (subscribe, unsubscribe, thank-you, campaigns, cron jobs, admin export)
- 9 branded HTML email templates
- Spam protection (honeypot + timing check + reCAPTCHA v3 + rate limiting)
- Deployment config for Netlify (netlify.toml), including scheduled cron functions

## 2. Brevo setup — already done

Account created, API key generated, sender verified, list created (ID 2),
and the four custom attributes (FULL_NAME, DOB, COUNTRY, SUBSCRIPTION_DATE) created.

## 3. reCAPTCHA setup

1. Go to the reCAPTCHA admin console at google.com/recaptcha/admin, register a new site, type v3.
2. Add your real domain and localhost while testing.
3. Copy the Site key into subscribe.html and assets/subscribe.js, replacing RECAPTCHA_SITE_KEY.
4. Copy the Secret key into the RECAPTCHA_SECRET_KEY environment variable in Netlify.

## 4. Deploy the backend (Netlify)

1. This GitHub repo is ready.
2. Go to netlify.com, Add new site, Import an existing project, connect this repo.
3. Publish directory is a single dot, already set in netlify.toml. No build command needed.
4. In Site configuration, Environment variables, add every variable from .env.example with real values.
5. Deploy. Netlify gives you a domain like sylvester-daniel.netlify.app.
6. Scheduled functions activate automatically. Check Site, Functions to confirm the three cron jobs are listed.

## 5. How each automation fires

Welcome — sent when someone subscribes for the first time.
Welcome back — sent when a previously unsubscribed contact re-subscribes.
Birthday — daily check, sent when a contact's date of birth matches today.
Happy New Month — sent on the first of every month.
Holiday greetings — daily check against config/holidays.json.
Goodbye — sent when someone clicks unsubscribe.
Thank-you — triggered manually by you after an interaction.
Promotional or announcement — triggered manually by you, any time.

## 6. Admin features, via Brevo's dashboard

View or export subscribers under Contacts, Lists, your list, Export.
Send newsletters under Campaigns, Email, Create a campaign.
Schedule campaigns using the Send later option.
Open and click rates under Campaigns, Statistics.
Unsubscribe stats under Contacts, Lists, blacklisted count.

## 7. Testing before going live

1. Deploy, visit subscribe.html, submit with your own email.
2. Confirm the welcome email arrives and the contact appears in Brevo.
3. Click unsubscribe in that email, confirm the goodbye email and blacklist.
4. Re-submit the same email, confirm you get welcome back, not welcome.

---

No phone number is shown anywhere on the site. The phone field on the
subscribe form is optional and only stored internally.
