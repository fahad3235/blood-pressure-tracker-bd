/* blood-pressure-tracker-bd -- node unit tests. Run: node tests/unit.test.js */
"use strict";
const assert = require("assert");
const L = require("../js/logic.js");

let pass = 0;
function eq(name, actual, expected) { assert.deepStrictEqual(actual, expected, name); pass++; console.log("ok -", name); }

const NOW = new Date("2026-10-14T12:00:00");
const good = (over = {}) => ({ date: "2026-10-14", time: "08:00", sys: 120, dia: 80, pulse: 72, arm: "left", note: "", ...over });

/* classification boundaries (AHA 2017) */
eq("classify 119/79 normal", L.classifyBP(119, 79), "normal");
eq("classify 120/79 elevated", L.classifyBP(120, 79), "elevated");
eq("classify 129/79 elevated", L.classifyBP(129, 79), "elevated");
eq("classify 130/79 stage1", L.classifyBP(130, 79), "stage1");
eq("classify 120/80 stage1 (dia rules)", L.classifyBP(120, 80), "stage1");
eq("classify 139/89 stage1", L.classifyBP(139, 89), "stage1");
eq("classify 140/89 stage2", L.classifyBP(140, 89), "stage2");
eq("classify 139/90 stage2", L.classifyBP(139, 90), "stage2");
eq("classify 180/120 stage2 (crisis needs >)", L.classifyBP(180, 120), "stage2");
eq("classify 181/110 crisis", L.classifyBP(181, 110), "crisis");
eq("classify 150/121 crisis", L.classifyBP(150, 121), "crisis");
eq("classify 90/60 normal", L.classifyBP(90, 60), "normal");

/* validation */
eq("valid reading", L.validateReading(good(), NOW), []);
eq("missing fields", L.validateReading({ date: "", time: "", sys: "", dia: "" }, NOW).includes("errRequired"), true);
eq("sys low", L.validateReading(good({ sys: 69, dia: 60 }), NOW), ["errSysRange"]);
eq("sys high", L.validateReading(good({ sys: 251 }), NOW), ["errSysRange"]);
eq("sys decimal", L.validateReading(good({ sys: 120.5 }), NOW), ["errSysRange"]);
eq("dia low", L.validateReading(good({ dia: 39 }), NOW), ["errDiaRange"]);
eq("dia high", L.validateReading(good({ sys: 200, dia: 151 }), NOW), ["errDiaRange"]);
eq("sys<=dia", L.validateReading(good({ sys: 80, dia: 80 }), NOW), ["errSysGtDia"]);
eq("pulse low", L.validateReading(good({ pulse: 29 }), NOW), ["errPulseRange"]);
eq("pulse empty ok", L.validateReading(good({ pulse: "" }), NOW), []);
eq("pulse null ok", L.validateReading(good({ pulse: null }), NOW), []);
eq("future rejected", L.validateReading(good({ date: "2026-10-15", time: "08:00" }), NOW), ["errFuture"]);
eq("bad date 2026-02-30", L.validateReading(good({ date: "2026-02-30" }), NOW), ["errBadDate"]);
eq("bad arm", L.validateReading(good({ arm: "middle" }), NOW), ["errBadArm"]);
eq("note too long", L.validateReading(good({ note: "x".repeat(201) }), NOW), ["errNoteLong"]);

/* normalize */
const n = L.normalizeReading(good({ pulse: "" }), NOW);
eq("normalize ok + pulse null", n.ok && n.reading.pulse === null, true);
eq("normalize note trim", L.normalizeReading(good({ note: "  hi  " }), NOW).reading.note, "hi");

/* averages + window (asof 2026-10-14) */
const readings = [
  { id: "a", date: "2026-10-14", time: "08:00", sys: 120, dia: 80, pulse: 70, arm: "left", note: "" },
  { id: "b", date: "2026-10-13", time: "08:00", sys: 130, dia: 85, pulse: 80, arm: "left", note: "" },
  { id: "c", date: "2026-10-08", time: "08:00", sys: 140, dia: 90, pulse: null, arm: "right", note: "" },
  { id: "d", date: "2026-09-01", time: "08:00", sys: 110, dia: 70, pulse: 60, arm: "left", note: "" }
];
eq("window 7d count", L.readingsInWindow(readings, 7, "2026-10-14").length, 3);
eq("window 30d count", L.readingsInWindow(readings, 30, "2026-10-14").length, 3);
eq("avg 7d", L.average(readings, 7, "2026-10-14"), { count: 3, sys: 130, dia: 85, pulse: 75 });
eq("avg 30d", L.average(readings, 30, "2026-10-14"), { count: 3, sys: 130, dia: 85, pulse: 75 });
eq("avg empty null", L.average([], 7, "2026-10-14"), null);
eq("latest", L.latestReading(readings).id, "a");
eq("sort newest first", L.sortReadings(readings).map((r) => r.id).join(","), "a,b,c,d");

/* filter by category */
eq("filter stage2", L.filterByCategory(readings, "stage2").map((r) => r.id).join(","), "c");
eq("filter all", L.filterByCategory(readings, "all").length, 4);

/* trend points */
const pts = L.trendPoints(readings, "2026-10-14");
eq("trend count (30d window)", pts.length, 3);
eq("trend oldest first", pts[0].date, "2026-10-08");
eq("trend x range", pts[0].x >= 0 && pts[pts.length - 1].x <= 100, true);
eq("trend sysY in range", pts.every((p) => p.sysY >= 0 && p.sysY <= 100), true);

/* export / import round-trip */
const state = { lang: "en", readings };
const exported = L.exportData(state);
const parsed = L.parseImport(exported);
eq("import round-trip ok", parsed.ok, true);
eq("import round-trip ids", parsed.readings.map((r) => r.id).join(","), "a,b,c,d");
const malformed = [
  "not json", "{}", '{"app":"other","version":1,"readings":[]}',
  '{"app":"blood-pressure-tracker-bd","version":2,"readings":[]}',
  '{"app":"blood-pressure-tracker-bd","version":1,"readings":"nope"}',
  '{"app":"blood-pressure-tracker-bd","version":1,"readings":[{"id":"x","date":"2026-10-14","time":"08:00","sys":50,"dia":80}]}',
  '{"app":"blood-pressure-tracker-bd","version":1,"readings":[{"id":"x","date":"2026-10-14","time":"08:00","sys":120,"dia":80},{"id":"x","date":"2026-10-13","time":"08:00","sys":120,"dia":80}]}'
];
malformed.forEach((m, i) => eq("malformed import rejected #" + i, L.parseImport(m).ok, false));

/* Bengali digits + formatting */
eq("bengali digits 120/80", L.toBengaliDigits("120/80"), "\u09e7\u09e8\u09e6/\u09ee\u09e6");
eq("fmtReading bn", L.fmtReading({ sys: 120, dia: 80 }, "bn"), "\u09e7\u09e8\u09e6/\u09ee\u09e6");
eq("fmtReading en", L.fmtReading({ sys: 120, dia: 80 }, "en"), "120/80");
eq("fmtDate en", L.fmtDate("2026-10-14", "en"), "Oct 14, 2026");
eq("fmtDate bn digits", L.fmtDate("2026-10-14", "bn").includes("\u09e7\u09ea"), true);
eq("fmtOneDecimal bn", L.fmtOneDecimal(130.5, "bn"), "\u09e7\u09e9\u09e6.\u09eb");

/* i18n completeness: every en key exists in bn */
const enKeys = Object.keys(L.I18N.en).sort();
const bnKeys = Object.keys(L.I18N.bn).sort();
eq("i18n keys match", bnKeys, enKeys);
eq("bn strings non-empty (except colAction)", Object.entries(L.I18N.bn).filter(([k]) => k !== "colAction").every(([, v]) => typeof v === "string" && v.length > 0), true);

console.log("\n" + pass + " unit checks passed");
