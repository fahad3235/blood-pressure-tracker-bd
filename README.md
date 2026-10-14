# Blood Pressure Tracker BD

An offline, bilingual (Bangla/English) blood pressure log for Bangladesh. Record systolic/diastolic/pulse readings, see your AHA category instantly, track 7-day and 30-day averages, and watch the trend — all on your device, with no account and no network requests.

## Problem

Blood pressure is usually tracked on paper or not at all. Paper notebooks get lost, and most tracking apps need accounts, show ads, or send health data to a server. This app keeps a simple, private log that works offline on any phone or computer.

## Features

- **Reading entry** — date, time, systolic, diastolic, optional pulse, arm (left/right), optional note.
- **AHA 2017 categories** — Normal, Elevated, Stage 1, Stage 2, Hypertensive crisis, with a prominent emergency banner for crisis readings.
- **Dashboard** — latest reading + category, 7-day and 30-day averages, total count.
- **Trend chart** — SVG systolic/diastolic lines over the last 30 days.
- **History** — newest-first table, filterable by category, per-reading delete.
- **Data tools** — JSON export / strict-validated import, typed-`DELETE` erase-all.
- **Bilingual** — full EN/বাংলা toggle, persisted, with Bengali digits in BN mode.
- **Strict validation** — systolic 70–250, diastolic 40–150, pulse 30–200, systolic must exceed diastolic, no future dates, note capped at 200 characters. Malformed imports are rejected with existing data untouched.

## Stack

Vanilla HTML + CSS + JavaScript. No frameworks, no build step, no dependencies. Data lives in `localStorage` under the key `bp-tracker-bd-v1`.

## Prerequisites

Any modern browser. For tests: Node.js 18+ and Chromium (the smoke test uses `/opt/meta-chromium/chrome`).

## Run

Open `index.html` in a browser, or serve the folder with any static server:

```sh
npx serve .
# or
python3 -m http.server 8080
```

Tip: append `?asof=YYYY-MM-DD` to pin "today" (used by the deterministic test suite).

## Testing

```sh
node tests/unit.test.js   # 59 checks: categories, validation, averages, import
node tests/smoke.mjs      # 39 headless-Chrome checks: full UI flow, BN toggle,
                          # persistence, clear-all, 390px mobile, 0 console errors
```

## Deployment

Static site — publish the folder to GitHub Pages, Netlify, or any static host. No server code, no environment variables.

## Limitations

- **Not medical advice.** Categories follow the AHA 2017 thresholds, but this app does not diagnose or recommend treatment. If you feel unwell, contact a doctor or call 999. A crisis reading needs emergency care, not this app.
- Readings are only as good as the measuring device; cuff size, posture, and rest time all matter.
- Data lives in one browser's `localStorage` — export JSON regularly if you switch devices. Clearing browser data erases it.
- Demo-grade personal tool, not a clinical record system.

## Status

MVP complete. Unit + smoke tests green (see `TEST_RESULTS.md`).
