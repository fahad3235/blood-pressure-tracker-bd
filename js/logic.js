/* blood-pressure-tracker-bd -- offline bilingual blood pressure log.
   Pure logic (no DOM) is exported for node tests; the DOM wiring at the
   bottom runs only in a browser. Categories follow the AHA 2017 thresholds.
   All user-visible strings live in I18N; Bengali is written as \uXXXX
   escapes so every source file stays pure ASCII (push-safe). */
"use strict";

const STORAGE_KEY = "bp-tracker-bd-v1";
const APP_ID = "blood-pressure-tracker-bd";
const DATA_VERSION = 1;

/* ---- i18n ---- */
const I18N = {
  en: {
    appTitle: "Blood Pressure Tracker",
    appSubtitle: "Log your blood pressure readings and watch the trend.",
    langBtn: "\u09ac\u09be\u0982\u09b2\u09be",
    dashboard: "Dashboard",
    latest: "Latest reading",
    avg7: "7-day average",
    avg30: "30-day average",
    total: "Total readings",
    noReadings: "No readings yet",
    addReading: "Add a reading",
    date: "Date",
    time: "Time",
    systolic: "Systolic (upper)",
    diastolic: "Diastolic (lower)",
    pulse: "Pulse (optional)",
    arm: "Arm",
    armLeft: "Left",
    armRight: "Right",
    armUnknown: "Not recorded",
    note: "Note (optional)",
    save: "Save reading",
    readingSaved: "Reading saved.",
    trend: "Trend (last 30 days)",
    trendEmpty: "Add at least 2 readings to see a trend.",
    history: "History",
    filterAll: "All categories",
    delete: "Delete",
    confirmDelete: "Delete this reading?",
    data: "Data",
    export: "Export (JSON)",
    import: "Import (JSON)",
    clear: "Erase all data",
    clearPrompt: "Type DELETE to erase every reading.",
    clearDone: "All data erased.",
    importOk: "Import successful.",
    importBad: "Import rejected: file is not a valid Blood Pressure Tracker export.",
    exportName: "blood-pressure-tracker-export.json",
    cat_normal: "Normal",
    cat_elevated: "Elevated",
    cat_stage1: "Stage 1",
    cat_stage2: "Stage 2",
    cat_crisis: "Hypertensive crisis",
    crisisAlert: "Hypertensive crisis reading! Seek emergency medical care right away.",
    disclaimer: "Personal tracker only \u2014 not medical advice. If you feel unwell, contact a doctor or call 999. Crisis readings need emergency care, not this app.",
    errRequired: "All of date, time, systolic and diastolic are required.",
    errSysRange: "Systolic must be a whole number from 70 to 250.",
    errDiaRange: "Diastolic must be a whole number from 40 to 150.",
    errPulseRange: "Pulse must be a whole number from 30 to 200.",
    errSysGtDia: "Systolic must be higher than diastolic.",
    errFuture: "Date and time cannot be in the future.",
    errNoteLong: "Note must be 200 characters or fewer.",
    errBadDate: "Enter a valid date and time.",
    errBadArm: "Arm must be left, right, or not recorded.",
    colDate: "Date & time",
    colReading: "Reading",
    colPulse: "Pulse",
    colArm: "Arm",
    colCategory: "Category",
    colNote: "Note",
    colAction: "",
    emptyHistory: "No readings match this filter.",
    sysLabel: "Systolic",
    diaLabel: "Diastolic",
    beatsMin: "bpm",
    avgOf: "avg of",
    readingsWord: "readings",
    deleteTitle: "Delete reading",
    footerNote: "Your data never leaves this device. No accounts, no network requests."
  },
  bn: {
    appTitle: "\u09b0\u0995\u09cd\u09a4\u099a\u09be\u09aa \u099f\u09cd\u09b0\u09cd\u09af\u09be\u0995\u09be\u09b0",
    appSubtitle: "\u0986\u09aa\u09a8\u09be\u09b0 \u09b0\u0995\u09cd\u09a4\u099a\u09be\u09aa\u09c7\u09b0 \u09b0\u09bf\u09a1\u09bf\u0982 \u09b2\u0997 \u0995\u09b0\u09c1\u09a8 \u0993 \u099f\u09cd\u09b0\u09c7\u09a8\u09cd\u09a1 \u09a6\u09c7\u0996\u09c1\u09a8\u0964",
    langBtn: "English",
    dashboard: "\u09a1\u09cd\u09af\u09be\u09b6\u09ac\u09cb\u09b0\u09cd\u09a1",
    latest: "\u09b8\u09b0\u09cd\u09ac\u09b6\u09c7\u09b7 \u09b0\u09bf\u09a1\u09bf\u0982",
    avg7: "\u0997\u09a4 \u09ed \u09a6\u09bf\u09a8\u09c7\u09b0 \u0997\u09a1\u09bc",
    avg30: "\u0997\u09a4 \u09e9\u09e6 \u09a6\u09bf\u09a8\u09c7\u09b0 \u0997\u09a1\u09bc",
    total: "\u09ae\u09cb\u099f \u09b0\u09bf\u09a1\u09bf\u0982",
    noReadings: "\u098f\u0996\u09a8\u09cb \u0995\u09cb\u09a8\u09cb \u09b0\u09bf\u09a1\u09bf\u0982 \u09a8\u09c7\u0987",
    addReading: "\u09a8\u09a4\u09c1\u09a8 \u09b0\u09bf\u09a1\u09bf\u0982 \u09af\u09cb\u0997 \u0995\u09b0\u09c1\u09a8",
    date: "\u09a4\u09be\u09b0\u09bf\u0996",
    time: "\u09b8\u09ae\u09af\u09bc",
    systolic: "\u09b8\u09bf\u09b8\u09cd\u099f\u09cb\u09b2\u09bf\u0995 (\u0989\u09aa\u09b0\u09c7\u09b0)",
    diastolic: "\u09a1\u09be\u09af\u09bc\u09be\u09b8\u09cd\u099f\u09cb\u09b2\u09bf\u0995 (\u09a8\u09bf\u099a\u09c7\u09b0)",
    pulse: "\u09aa\u09be\u09b2\u09b8 (\u0990\u099a\u09cd\u099b\u09bf\u0995)",
    arm: "\u09ac\u09be\u09b9\u09c1",
    armLeft: "\u09ac\u09be\u09ae",
    armRight: "\u09a1\u09be\u09a8",
    armUnknown: "\u09b0\u09c7\u0995\u09b0\u09cd\u09a1 \u0995\u09b0\u09be \u09b9\u09af\u09bc\u09a8\u09bf",
    note: "\u09a8\u09cb\u099f (\u0990\u099a\u09cd\u099b\u09bf\u0995)",
    save: "\u09b0\u09bf\u09a1\u09bf\u0982 \u09b8\u0982\u09b0\u0995\u09cd\u09b7\u09a3 \u0995\u09b0\u09c1\u09a8",
    readingSaved: "\u09b0\u09bf\u09a1\u09bf\u0982 \u09b8\u0982\u09b0\u0995\u09cd\u09b7\u09bf\u09a4 \u09b9\u09af\u09bc\u09c7\u099b\u09c7\u0964",
    trend: "\u099f\u09cd\u09b0\u09c7\u09a8\u09cd\u09a1 (\u0997\u09a4 \u09e9\u09e6 \u09a6\u09bf\u09a8)",
    trendEmpty: "\u099f\u09cd\u09b0\u09c7\u09a8\u09cd\u09a1 \u09a6\u09c7\u0996\u09a4\u09c7 \u0995\u09ae\u09aa\u0995\u09cd\u09b7\u09c7 \u09e8\u099f\u09bf \u09b0\u09bf\u09a1\u09bf\u0982 \u09af\u09cb\u0997 \u0995\u09b0\u09c1\u09a8\u0964",
    history: "\u0987\u09a4\u09bf\u09b9\u09be\u09b8",
    filterAll: "\u09b8\u09ac \u0995\u09cd\u09af\u09be\u099f\u09be\u0997\u09b0\u09bf",
    delete: "\u09ae\u09c1\u099b\u09c1\u09a8",
    confirmDelete: "\u098f\u0987 \u09b0\u09bf\u09a1\u09bf\u0982\u099f\u09bf \u09ae\u09c1\u099b\u09c7 \u09ab\u09c7\u09b2\u09ac\u09c7\u09a8?",
    data: "\u09a1\u09c7\u099f\u09be",
    export: "\u098f\u0995\u09cd\u09b8\u09aa\u09cb\u09b0\u09cd\u099f (JSON)",
    import: "\u0987\u09ae\u09aa\u09cb\u09b0\u09cd\u099f (JSON)",
    clear: "\u09b8\u09ac \u09a1\u09c7\u099f\u09be \u09ae\u09c1\u099b\u09c1\u09a8",
    clearPrompt: "\u09b8\u09ac \u09b0\u09bf\u09a1\u09bf\u0982 \u09ae\u09c1\u099b\u09a4\u09c7 DELETE \u09b2\u09bf\u0996\u09c1\u09a8\u0964",
    clearDone: "\u09b8\u09ac \u09a1\u09c7\u099f\u09be \u09ae\u09c1\u099b\u09c7 \u09ab\u09c7\u09b2\u09be \u09b9\u09af\u09bc\u09c7\u099b\u09c7\u0964",
    importOk: "\u0987\u09ae\u09aa\u09cb\u09b0\u09cd\u099f \u09b8\u09ab\u09b2 \u09b9\u09af\u09bc\u09c7\u099b\u09c7\u0964",
    importBad: "\u0987\u09ae\u09aa\u09cb\u09b0\u09cd\u099f \u09ac\u09be\u09a4\u09bf\u09b2: \u09ab\u09be\u0987\u09b2\u099f\u09bf \u09ac\u09c8\u09a7 Blood Pressure Tracker \u098f\u0995\u09cd\u09b8\u09aa\u09cb\u09b0\u09cd\u099f \u09a8\u09af\u09bc\u0964",
    exportName: "blood-pressure-tracker-export.json",
    cat_normal: "\u09b8\u09cd\u09ac\u09be\u09ad\u09be\u09ac\u09bf\u0995",
    cat_elevated: "\u09b8\u09be\u09ae\u09be\u09a8\u09cd\u09af \u09ac\u09c7\u09b6\u09bf",
    cat_stage1: "\u09b8\u09cd\u099f\u09c7\u099c \u09e7",
    cat_stage2: "\u09b8\u09cd\u099f\u09c7\u099c \u09e8",
    cat_crisis: "\u09b8\u0982\u0995\u099f\u099c\u09a8\u0995",
    crisisAlert: "\u09b8\u0982\u0995\u099f\u099c\u09a8\u0995 \u09b0\u09bf\u09a1\u09bf\u0982! \u0985\u09ac\u09bf\u09b2\u09ae\u09cd\u09ac\u09c7 \u099c\u09b0\u09c1\u09b0\u09bf \u099a\u09bf\u0995\u09bf\u09ce\u09b8\u09be \u09b8\u09b9\u09be\u09af\u09bc\u09a4\u09be \u09a8\u09bf\u09a8\u0964",
    disclaimer: "\u09b6\u09c1\u09a7\u09c1 \u09ac\u09cd\u09af\u0995\u09cd\u09a4\u09bf\u0997\u09a4 \u099f\u09cd\u09b0\u09cd\u09af\u09be\u0995\u09be\u09b0 \u2014 \u099a\u09bf\u0995\u09bf\u09ce\u09b8\u09be \u09aa\u09b0\u09be\u09ae\u09b0\u09cd\u09b6 \u09a8\u09af\u09bc\u0964 \u0985\u09b8\u09c1\u09b8\u09cd\u09a5 \u09ac\u09cb\u09a7 \u0995\u09b0\u09b2\u09c7 \u09a1\u09be\u0995\u09cd\u09a4\u09be\u09b0\u09c7\u09b0 \u09b8\u0999\u09cd\u0997\u09c7 \u09af\u09cb\u0997\u09be\u09af\u09cb\u0997 \u0995\u09b0\u09c1\u09a8 \u09ac\u09be \u09ef\u09ef\u09ef-\u098f \u0995\u09b2 \u0995\u09b0\u09c1\u09a8\u0964 \u09b8\u0982\u0995\u099f\u099c\u09a8\u0995 \u09b0\u09bf\u09a1\u09bf\u0982\u09af\u09bc\u09c7 \u099c\u09b0\u09c1\u09b0\u09bf \u099a\u09bf\u0995\u09bf\u09ce\u09b8\u09be \u09a6\u09b0\u0995\u09be\u09b0, \u098f\u0987 \u0985\u09cd\u09af\u09be\u09aa \u09a8\u09af\u09bc\u0964",
    errRequired: "\u09a4\u09be\u09b0\u09bf\u0996, \u09b8\u09ae\u09af\u09bc, \u09b8\u09bf\u09b8\u09cd\u099f\u09cb\u09b2\u09bf\u0995 \u0993 \u09a1\u09be\u09af\u09bc\u09be\u09b8\u09cd\u099f\u09cb\u09b2\u09bf\u0995 \u2014 \u09b8\u09ac\u0987 \u09a6\u09bf\u09a4\u09c7 \u09b9\u09ac\u09c7\u0964",
    errSysRange: "\u09b8\u09bf\u09b8\u09cd\u099f\u09cb\u09b2\u09bf\u0995 \u09ed\u09e6 \u09a5\u09c7\u0995\u09c7 \u09e8\u09eb\u09e6-\u098f\u09b0 \u09ae\u09a7\u09cd\u09af\u09c7 \u09aa\u09c2\u09b0\u09cd\u09a3\u09b8\u0982\u0996\u09cd\u09af\u09be \u09b9\u09a4\u09c7 \u09b9\u09ac\u09c7\u0964",
    errDiaRange: "\u09a1\u09be\u09af\u09bc\u09be\u09b8\u09cd\u099f\u09cb\u09b2\u09bf\u0995 \u09ea\u09e6 \u09a5\u09c7\u0995\u09c7 \u09e7\u09eb\u09e6-\u098f\u09b0 \u09ae\u09a7\u09cd\u09af\u09c7 \u09aa\u09c2\u09b0\u09cd\u09a3\u09b8\u0982\u0996\u09cd\u09af\u09be \u09b9\u09a4\u09c7 \u09b9\u09ac\u09c7\u0964",
    errPulseRange: "\u09aa\u09be\u09b2\u09b8 \u09e9\u09e6 \u09a5\u09c7\u0995\u09c7 \u09e8\u09e6\u09e6-\u098f\u09b0 \u09ae\u09a7\u09cd\u09af\u09c7 \u09aa\u09c2\u09b0\u09cd\u09a3\u09b8\u0982\u0996\u09cd\u09af\u09be \u09b9\u09a4\u09c7 \u09b9\u09ac\u09c7\u0964",
    errSysGtDia: "\u09b8\u09bf\u09b8\u09cd\u099f\u09cb\u09b2\u09bf\u0995 \u09a1\u09be\u09af\u09bc\u09be\u09b8\u09cd\u099f\u09cb\u09b2\u09bf\u0995\u09c7\u09b0 \u099a\u09c7\u09af\u09bc\u09c7 \u09ac\u09c7\u09b6\u09bf \u09b9\u09a4\u09c7 \u09b9\u09ac\u09c7\u0964",
    errFuture: "\u09a4\u09be\u09b0\u09bf\u0996 \u0993 \u09b8\u09ae\u09af\u09bc \u09ad\u09ac\u09bf\u09b7\u09cd\u09af\u09a4\u09c7\u09b0 \u09b9\u09a4\u09c7 \u09aa\u09be\u09b0\u09ac\u09c7 \u09a8\u09be\u0964",
    errNoteLong: "\u09a8\u09cb\u099f \u09e8\u09e6\u09e6 \u0985\u0995\u09cd\u09b7\u09b0\u09c7\u09b0 \u09ae\u09a7\u09cd\u09af\u09c7 \u09b9\u09a4\u09c7 \u09b9\u09ac\u09c7\u0964",
    errBadDate: "\u09ac\u09c8\u09a7 \u09a4\u09be\u09b0\u09bf\u0996 \u0993 \u09b8\u09ae\u09af\u09bc \u09a6\u09bf\u09a8\u0964",
    errBadArm: "\u09ac\u09be\u09b9\u09c1 \u09ac\u09be\u09ae, \u09a1\u09be\u09a8 \u09ac\u09be \u09b0\u09c7\u0995\u09b0\u09cd\u09a1-\u09a8\u09be-\u0995\u09b0\u09be \u09b9\u09a4\u09c7 \u09b9\u09ac\u09c7\u0964",
    colDate: "\u09a4\u09be\u09b0\u09bf\u0996 \u0993 \u09b8\u09ae\u09af\u09bc",
    colReading: "\u09b0\u09bf\u09a1\u09bf\u0982",
    colPulse: "\u09aa\u09be\u09b2\u09b8",
    colArm: "\u09ac\u09be\u09b9\u09c1",
    colCategory: "\u0995\u09cd\u09af\u09be\u099f\u09be\u0997\u09b0\u09bf",
    colNote: "\u09a8\u09cb\u099f",
    colAction: "",
    emptyHistory: "\u098f\u0987 \u09ab\u09bf\u09b2\u09cd\u099f\u09be\u09b0\u09c7 \u0995\u09cb\u09a8\u09cb \u09b0\u09bf\u09a1\u09bf\u0982 \u09a8\u09c7\u0987\u0964",
    sysLabel: "\u09b8\u09bf\u09b8\u09cd\u099f\u09cb\u09b2\u09bf\u0995",
    diaLabel: "\u09a1\u09be\u09af\u09bc\u09be\u09b8\u09cd\u099f\u09cb\u09b2\u09bf\u0995",
    beatsMin: "bpm",
    avgOf: "\u0997\u09a1\u09bc",
    readingsWord: "\u099f\u09bf \u09b0\u09bf\u09a1\u09bf\u0982",
    deleteTitle: "\u09b0\u09bf\u09a1\u09bf\u0982 \u09ae\u09c1\u099b\u09c1\u09a8",
    footerNote: "\u0986\u09aa\u09a8\u09be\u09b0 \u09a1\u09c7\u099f\u09be \u098f\u0987 \u09a1\u09bf\u09ad\u09be\u0987\u09b8\u09c7\u09b0 \u09ac\u09be\u0987\u09b0\u09c7 \u09af\u09be\u09af\u09bc \u09a8\u09be\u0964 \u0995\u09cb\u09a8\u09cb \u0985\u09cd\u09af\u09be\u0995\u09be\u0989\u09a8\u09cd\u099f \u09a8\u09c7\u0987, \u0995\u09cb\u09a8\u09cb \u09a8\u09c7\u099f\u0993\u09af\u09bc\u09be\u09b0\u09cd\u0995 \u0985\u09a8\u09c1\u09b0\u09cb\u09a7 \u09a8\u09c7\u0987\u0964"
  }
};

/* ---- Bengali digits ---- */
const BN_DIGITS = ["\u09e6", "\u09e7", "\u09e8", "\u09e9", "\u09ea", "\u09eb", "\u09ec", "\u09ed", "\u09ee", "\u09ef"];
function toBengaliDigits(str) {
  return String(str).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}
function localizeDigits(str, lang) {
  return lang === "bn" ? toBengaliDigits(str) : String(str);
}

/* ---- classification (AHA 2017) ----
   Crisis: sys > 180 OR dia > 120
   Stage 2: sys >= 140 OR dia >= 90
   Stage 1: sys 130-139 OR dia 80-89
   Elevated: sys 120-129 AND dia < 80
   Normal: sys < 120 AND dia < 80 */
function classifyBP(sys, dia) {
  if (sys > 180 || dia > 120) return "crisis";
  if (sys >= 140 || dia >= 90) return "stage2";
  if (sys >= 130 || dia >= 80) return "stage1";
  if (sys >= 120) return "elevated";
  return "normal";
}
const CATEGORY_ORDER = ["normal", "elevated", "stage1", "stage2", "crisis"];

/* ---- validation ---- */
function isWhole(n) { return Number.isInteger(n); }
function parseDateTime(dateStr, timeStr) {
  if (typeof dateStr !== "string" || typeof timeStr !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  if (!/^\d{2}:\d{2}$/.test(timeStr)) return null;
  const d = new Date(dateStr + "T" + timeStr + ":00");
  if (Number.isNaN(d.getTime())) return null;
  // Guard against overflow rollover (e.g. 2026-02-30 -> Mar 02).
  const [y, m, dd] = dateStr.split("-").map(Number);
  if (d.getFullYear() !== y || d.getMonth() + 1 !== m || d.getDate() !== dd) return null;
  return d;
}
function validateReading(r, now) {
  const errs = [];
  const nowDate = now instanceof Date ? now : new Date();
  if (!r || typeof r !== "object") return ["errRequired"];
  if (!r.date || !r.time) errs.push("errRequired");
  const dt = parseDateTime(r.date, r.time);
  if (r.date && r.time && !dt) errs.push("errBadDate");
  if (dt && dt.getTime() > nowDate.getTime() + 60000) errs.push("errFuture");
  if (r.sys === undefined || r.sys === null || r.sys === "") errs.push("errRequired");
  else if (!isWhole(r.sys) || r.sys < 70 || r.sys > 250) errs.push("errSysRange");
  if (r.dia === undefined || r.dia === null || r.dia === "") errs.push("errRequired");
  else if (!isWhole(r.dia) || r.dia < 40 || r.dia > 150) errs.push("errDiaRange");
  if (isWhole(r.sys) && isWhole(r.dia) && r.sys <= r.dia) errs.push("errSysGtDia");
  if (r.pulse !== undefined && r.pulse !== null && r.pulse !== "") {
    if (!isWhole(r.pulse) || r.pulse < 30 || r.pulse > 200) errs.push("errPulseRange");
  }
  if (r.arm !== undefined && r.arm !== null && r.arm !== "" && !["left", "right", "unknown"].includes(r.arm)) errs.push("errBadArm");
  if (typeof r.note === "string" && r.note.length > 200) errs.push("errNoteLong");
  return [...new Set(errs)];
}
function normalizeReading(r, now) {
  const errs = validateReading(r, now);
  if (errs.length) return { ok: false, errors: errs };
  return {
    ok: true,
    reading: {
      id: "r" + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36),
      date: r.date,
      time: r.time,
      sys: r.sys,
      dia: r.dia,
      pulse: (r.pulse === "" || r.pulse === null || r.pulse === undefined) ? null : r.pulse,
      arm: r.arm || "unknown",
      note: typeof r.note === "string" ? r.note.trim().slice(0, 200) : ""
    }
  };
}

/* ---- state helpers ---- */
function emptyState() { return { lang: "en", readings: [] }; }
function sortReadings(readings) {
  return [...readings].sort((a, b) => {
    const da = (a.date + "T" + a.time), db = (b.date + "T" + b.time);
    if (da < db) return 1; if (da > db) return -1; return 0;
  });
}
function latestReading(readings) {
  if (!readings.length) return null;
  return sortReadings(readings)[0];
}
function dayStart(dateStr) { return new Date(dateStr + "T00:00:00"); }
function readingsInWindow(readings, days, asofStr) {
  const asof = dayStart(asofStr);
  const start = new Date(asof.getTime() - (days - 1) * 86400000);
  return readings.filter((r) => {
    const d = dayStart(r.date);
    return d >= start && d <= asof;
  });
}
function average(readings, days, asofStr) {
  const win = readingsInWindow(readings, days, asofStr);
  if (!win.length) return null;
  const sum = (f) => win.reduce((a, r) => a + (r[f] === null || r[f] === undefined ? 0 : r[f]), 0);
  const pulseVals = win.filter((r) => r.pulse !== null && r.pulse !== undefined);
  return {
    count: win.length,
    sys: Math.round((sum("sys") / win.length) * 10) / 10,
    dia: Math.round((sum("dia") / win.length) * 10) / 10,
    pulse: pulseVals.length ? Math.round((pulseVals.reduce((a, r) => a + r.pulse, 0) / pulseVals.length) * 10) / 10 : null
  };
}
function filterByCategory(readings, cat) {
  if (!cat || cat === "all") return sortReadings(readings);
  return sortReadings(readings).filter((r) => classifyBP(r.sys, r.dia) === cat);
}
/* SVG trend: one point per reading in the last 30 days, x by date, y 40..200. */
function trendPoints(readings, asofStr) {
  const win = sortReadings(readingsInWindow(readings, 30, asofStr)).reverse(); // oldest first
  const start = dayStart(asofStr).getTime() - 29 * 86400000;
  const span = 30 * 86400000;
  return win.map((r) => {
    const t = (dayStart(r.date).getTime() - start) / span;
    const yOf = (v) => 100 - ((Math.min(200, Math.max(40, v)) - 40) / 160) * 100;
    return { x: Math.round(t * 1000) / 10, sysY: Math.round(yOf(r.sys) * 10) / 10, diaY: Math.round(yOf(r.dia) * 10) / 10, date: r.date, sys: r.sys, dia: r.dia };
  });
}

/* ---- export / import (strict) ---- */
function exportData(state) {
  return JSON.stringify({ app: APP_ID, version: DATA_VERSION, exportedAt: new Date().toISOString(), readings: sortReadings(state.readings) }, null, 2);
}
function parseImport(text) {
  let obj;
  try { obj = JSON.parse(text); } catch (e) { return { ok: false }; }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return { ok: false };
  if (obj.app !== APP_ID || obj.version !== DATA_VERSION) return { ok: false };
  if (!Array.isArray(obj.readings)) return { ok: false };
  const seen = new Set();
  const out = [];
  for (const r of obj.readings) {
    if (!r || typeof r !== "object" || Array.isArray(r)) return { ok: false };
    if (typeof r.id !== "string" || !r.id || seen.has(r.id)) return { ok: false };
    seen.add(r.id);
    const errs = validateReading(r, new Date("2999-01-01T00:00:00"));
    // validateReading flags future dates; imports may hold old dates only, so
    // re-check without the future rule by testing against a far-future now
    // (done above) and dropping a stray errFuture is not needed: real exports
    // are always in the past relative to 2999.
    if (errs.length) return { ok: false };
    out.push({
      id: r.id, date: r.date, time: r.time, sys: r.sys, dia: r.dia,
      pulse: (r.pulse === "" || r.pulse === null || r.pulse === undefined) ? null : r.pulse,
      arm: r.arm || "unknown", note: typeof r.note === "string" ? r.note.slice(0, 200) : ""
    });
  }
  return { ok: true, readings: out };
}

/* ---- formatting ---- */
function fmtReading(r, lang) {
  return localizeDigits(r.sys + "/" + r.dia, lang);
}
function fmtDate(dateStr, lang) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthsBn = ["\u099c\u09be\u09a8\u09c1\u09af\u09bc\u09be\u09b0\u09bf", "\u09ab\u09c7\u09ac\u09cd\u09b0\u09c1\u09af\u09bc\u09be\u09b0\u09bf", "\u09ae\u09be\u09b0\u09cd\u099a", "\u098f\u09aa\u09cd\u09b0\u09bf\u09b2", "\u09ae\u09c7", "\u099c\u09c1\u09a8", "\u099c\u09c1\u09b2\u09be\u0987", "\u0986\u0997\u09b8\u09cd\u099f", "\u09b8\u09c7\u09aa\u09cd\u099f\u09c7\u09ae\u09cd\u09ac\u09b0", "\u0985\u0995\u09cd\u099f\u09cb\u09ac\u09b0", "\u09a8\u09ad\u09c7\u09ae\u09cd\u09ac\u09b0", "\u09a1\u09bf\u09b8\u09c7\u09ae\u09cd\u09ac\u09b0"];
  const s = lang === "bn" ? (d + " " + monthsBn[m - 1] + " " + y) : (monthsEn[m - 1] + " " + d + ", " + y);
  return localizeDigits(s, lang);
}
function fmtOneDecimal(n, lang) {
  const s = n.toFixed(1);
  return localizeDigits(s, lang);
}

/* ---- storage (browser) ---- */
function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object" || !Array.isArray(obj.readings)) return emptyState();
    const parsed = parseImport(JSON.stringify({ app: APP_ID, version: DATA_VERSION, readings: obj.readings }));
    const lang = obj.lang === "bn" ? "bn" : "en";
    return { lang, readings: parsed.ok ? parsed.readings : [] };
  } catch (e) { return emptyState(); }
}
function saveState(state) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* storage full/blocked: keep in-memory */ }
}

/* ---- DOM wiring (browser only) ---- */
function todayStr(asof) {
  const d = asof ? new Date(asof + "T00:00:00") : new Date();
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}
function initApp() {
  const params = new URLSearchParams(window.location.search);
  const asof = params.get("asof") || todayStr();
  const state = loadState();
  const t = (k) => I18N[state.lang][k] || I18N.en[k] || k;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  function render() {
    document.documentElement.lang = state.lang === "bn" ? "bn" : "en";
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      el.textContent = t(key);
    });
    document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
      el.placeholder = t(el.getAttribute("data-i18n-ph"));
    });
    const latest = latestReading(state.readings);
    const a7 = average(state.readings, 7, asof);
    const a30 = average(state.readings, 30, asof);
    $("statLatest").textContent = latest ? fmtReading(latest, state.lang) : t("noReadings");
    const latestCat = $("statLatestCat");
    if (latest) {
      const c = classifyBP(latest.sys, latest.dia);
      latestCat.textContent = t("cat_" + c);
      latestCat.className = "badge badge-" + c;
      latestCat.style.display = "";
    } else { latestCat.style.display = "none"; }
    $("statAvg7").textContent = a7 ? fmtOneDecimal(a7.sys, state.lang) + "/" + fmtOneDecimal(a7.dia, state.lang) : "\u2014";
    $("statAvg7Sub").textContent = a7 ? t("avgOf") + " " + localizeDigits(a7.count, state.lang) + " " + t("readingsWord") : "";
    $("statAvg30").textContent = a30 ? fmtOneDecimal(a30.sys, state.lang) + "/" + fmtOneDecimal(a30.dia, state.lang) : "\u2014";
    $("statAvg30Sub").textContent = a30 ? t("avgOf") + " " + localizeDigits(a30.count, state.lang) + " " + t("readingsWord") : "";
    $("statTotal").textContent = localizeDigits(state.readings.length, state.lang);
    const crisis = $("crisisBanner");
    if (latest && classifyBP(latest.sys, latest.dia) === "crisis") {
      crisis.textContent = t("crisisAlert");
      crisis.style.display = "";
    } else { crisis.style.display = "none"; }
    renderTrend();
    renderHistory();
    $("formMsg").textContent = "";
    $("dataMsg").textContent = "";
    $("filterCat").value = currentFilter;
  }

  function renderTrend() {
    const pts = trendPoints(state.readings, asof);
    const svg = $("trendSvg");
    const empty = $("trendEmpty");
    if (pts.length < 2) {
      svg.innerHTML = "";
      empty.textContent = t("trendEmpty");
      empty.style.display = "";
      return;
    }
    empty.style.display = "none";
    const W = 100, H = 100;
    const line = (key) => pts.map((p, i) => (i === 0 ? "M" : "L") + p.x + " " + p[key]).join(" ");
    const dots = pts.map((p) => '<circle cx="' + p.x + '" cy="' + p.sysY + '" r="1.6" fill="#c0392b"><title>' + esc(p.date + " " + p.sys + "/" + p.dia) + "</title></circle>").join("");
    const dotsD = pts.map((p) => '<circle cx="' + p.x + '" cy="' + p.diaY + '" r="1.6" fill="#2471a3"><title>' + esc(p.date + " " + p.sys + "/" + p.dia) + "</title></circle>").join("");
    svg.innerHTML = '<polyline points="' + pts.map((p) => p.x + "," + p.sysY).join(" ") + '" fill="none" stroke="#c0392b" stroke-width="1.4"/>' +
      '<polyline points="' + pts.map((p) => p.x + "," + p.diaY).join(" ") + '" fill="none" stroke="#2471a3" stroke-width="1.4"/>' + dots + dotsD;
    void line;
  }

  let currentFilter = "all";
  function renderHistory() {
    const rows = filterByCategory(state.readings, currentFilter);
    const tbody = $("histBody");
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty">' + esc(t("emptyHistory")) + "</td></tr>";
      return;
    }
    tbody.innerHTML = rows.map((r) => {
      const c = classifyBP(r.sys, r.dia);
      return "<tr><td>" + esc(fmtDate(r.date, state.lang)) + " " + esc(localizeDigits(r.time, state.lang)) + "</td>" +
        "<td><strong>" + esc(fmtReading(r, state.lang)) + "</strong></td>" +
        "<td>" + (r.pulse === null ? "\u2014" : esc(localizeDigits(r.pulse, state.lang))) + "</td>" +
        "<td>" + esc(t(r.arm === "left" ? "armLeft" : r.arm === "right" ? "armRight" : "armUnknown")) + "</td>" +
        '<td><span class="badge badge-' + c + '">' + esc(t("cat_" + c)) + "</span></td>" +
        "<td>" + esc(r.note) + "</td>" +
        '<td><button type="button" class="btn btn-small btn-danger" data-del="' + esc(r.id) + '" title="' + esc(t("deleteTitle")) + '">' + esc(t("delete")) + "</button></td></tr>";
    }).join("");
    tbody.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!window.confirm(t("confirmDelete"))) return;
        state.readings = state.readings.filter((r) => r.id !== btn.getAttribute("data-del"));
        saveState(state);
        render();
      });
    });
  }

  $("langBtn").addEventListener("click", () => {
    state.lang = state.lang === "bn" ? "en" : "bn";
    saveState(state);
    render();
  });
  $("filterCat").addEventListener("change", (e) => { currentFilter = e.target.value; renderHistory(); });

  $("addForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const num = (id) => {
      const v = $(id).value.trim();
      if (v === "") return "";
      const n = Number(v);
      return Number.isInteger(n) ? n : NaN;
    };
    const input = {
      date: $("f-date").value, time: $("f-time").value,
      sys: num("f-sys"), dia: num("f-dia"), pulse: num("f-pulse"),
      arm: $("f-arm").value, note: $("f-note").value
    };
    const errs = validateReading(input, new Date(asof + "T23:59:59"));
    const msg = $("formMsg");
    if (errs.length) {
      msg.textContent = errs.map((k) => t(k)).join(" ");
      msg.className = "msg msg-error";
      return;
    }
    const res = normalizeReading(input, new Date(asof + "T23:59:59"));
    if (!res.ok) { msg.textContent = res.errors.map((k) => t(k)).join(" "); msg.className = "msg msg-error"; return; }
    state.readings.push(res.reading);
    saveState(state);
    $("addForm").reset();
    $("f-date").value = todayStr(asof);
    msg.textContent = t("readingSaved");
    msg.className = "msg msg-ok";
    render();
    $("formMsg").textContent = t("readingSaved");
    $("formMsg").className = "msg msg-ok";
  });

  $("exportBtn").addEventListener("click", () => {
    const blob = new Blob([exportData(state)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = t("exportName");
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    $("dataMsg").textContent = "";
  });
  $("importFile").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = parseImport(String(reader.result || ""));
      const msg = $("dataMsg");
      if (!res.ok) { msg.textContent = t("importBad"); msg.className = "msg msg-error"; return; }
      state.readings = res.readings;
      saveState(state);
      render();
      $("dataMsg").textContent = t("importOk");
      $("dataMsg").className = "msg msg-ok";
    };
    reader.readAsText(file);
    e.target.value = "";
  });
  $("clearBtn").addEventListener("click", () => {
    const v = window.prompt(t("clearPrompt"), "");
    if (v === null) return;
    if (v.trim() !== "DELETE") return;
    state.readings = [];
    saveState(state);
    render();
    $("dataMsg").textContent = t("clearDone");
    $("dataMsg").className = "msg msg-ok";
  });

  // Defaults for the form.
  $("f-date").value = todayStr(asof);
  const now = new Date();
  $("f-time").value = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
  render();
  window.__BP = { state, asof, I18N, classifyBP, validateReading, average, parseImport, exportData };
  window.__BP_READY = true;
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initApp);
  else initApp();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    I18N, classifyBP, validateReading, normalizeReading, emptyState, sortReadings,
    latestReading, readingsInWindow, average, filterByCategory, trendPoints,
    exportData, parseImport, fmtReading, fmtDate, fmtOneDecimal, toBengaliDigits,
    localizeDigits, parseDateTime, STORAGE_KEY, APP_ID, DATA_VERSION
  };
}
