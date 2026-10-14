# TEST_RESULTS — blood-pressure-tracker-bd (run #55, 2026-10-14)

## Unit tests — 59/59 passed
`node tests/unit.test.js`

- Classification (AHA 2017): all 12 boundary checks, incl. 120/80 = Stage 1
  (diastolic rule), 180/120 = Stage 2 (crisis needs strictly over), 181/110
  and 150/121 = crisis.
- Validation: every range/whole-number/future/bad-date/bad-arm/note-length
  rule; sys<=dia rejected.
- Averages: 7-day and 30-day windows exact (120/130/140 -> 130.0 sys,
  80/85/90 -> 85.0 dia, pulse excludes nulls -> 75.0); empty -> null.
- Trend: 3 points in 30-day window, oldest first, coords in 0..100.
- Export/import: round-trip preserves ids; 6 malformed shapes rejected
  (bad JSON, wrong app, wrong version, non-array, out-of-range sys,
  duplicate ids).
- Bengali digits: "120/80" -> "১২০/৮০"; BN date contains Bengali day digits.
- i18n: EN/BN key sets identical; all BN strings non-empty (except the
  intentionally blank `colAction` header).

Test-side fixes only (2): sys-low and dia-high cases also trigger the
sys<=dia rule when the other value is left at its default — expectations
corrected to isolate one rule at a time; `colAction` excluded from the
non-empty check (blank by design). 0 app bugs found by unit tests.

## Headless-Chrome smoke — 39/39 passed
`node tests/smoke.mjs` (raw CDP, /opt/meta-chromium/chrome, ?asof=2026-10-14)

- Boot: EN title, lang button shows Bengali word, empty states.
- Add 118/76 (Normal) -> latest + category + avg 118.0/76.0; add 145/95
  (Stage 2) -> averages exact 131.5/85.5 for 7-day and 30-day.
- Invalid sys=60 rejected inline ("Systolic must be..."), total stays 2.
- Category filter stage2 -> 1 row; all -> 2 rows.
- Crisis 190/125 -> "Hypertensive crisis" badge + emergency banner visible.
- BN toggle: Bengali title/category, latest renders Bengali digits
  ("১৯০/১২৫"); BN + readings persist across reload (total "৩").
- Export/import API round-trip ok; malformed import rejected.
- Typed-DELETE clear-all via prompt dialog -> total 0 (Bengali "০").
- 390px mobile: no horizontal overflow. 0 console errors, 0 page errors,
  0 network requests.

Test-side fixes only (2): first reading changed 120/80 -> 118/76 because
120/80 is Stage 1 per AHA (the app was right, the test was wrong); clear-all
total expectation corrected to the Bengali digit "০" (lang still BN).
1 real app bug found by smoke: the language button had no `data-i18n`, so
render() never updated it — fixed, re-verified 39/39.

## Source hygiene
All shipped sources pure ASCII (Bengali emitted as \uXXXX escapes in JS;
verified with `grep -P '[^\x00-\x7F]'` — zero matches in .js/.mjs/.html).
