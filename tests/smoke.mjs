/* blood-pressure-tracker-bd -- headless-Chrome smoke tests via raw CDP.
   Run: node tests/smoke.mjs
   Scenario (asof=2026-10-14): boot + empty states, add Normal + Stage 2 readings,
   exact 7-day averages, invalid input rejected, category filter, crisis banner,
   BN toggle + Bengali digits + reload persistence, export/import API, typed-DELETE
   clear-all via prompt dialog, 390px no-overflow, 0 console errors, 0 network reqs. */
import { launchChrome, waitPort, newPage, CDP, sleep, waitFor } from "./cdp.mjs";

const PORT = 9500 + (process.pid % 100);
const PROFILE = "/tmp/bp-smoke-profile-" + process.pid;
const APP = "file:///home/hatch/workspace/muse-project-factory/builds/blood-pressure-tracker-bd/index.html?asof=2026-10-14";

let pass = 0, fail = 0;
function eq(name, actual, expected) {
  if (actual === expected) pass++;
  else { fail++; console.log("FAIL", name, "| actual:", JSON.stringify(actual), "| expected:", JSON.stringify(expected)); }
}
function ok(name, cond) { if (cond) pass++; else { fail++; console.log("FAIL", name); } }
function contains(name, hay, needle) { ok(name, typeof hay === "string" && hay.includes(needle)); }
const J = (v) => JSON.stringify(v);

const chrome = launchChrome(PORT, PROFILE);
try {
  await waitPort(PORT);
  const target = await newPage(PORT, APP);
  const cdp = new CDP(target.webSocketDebuggerUrl);
  await cdp.connect();

  const consoleErrors = [], pageErrors = [], netReqs = [];
  cdp.on("Runtime.consoleAPICalled", (p) => {
    if (p.type === "error") consoleErrors.push(p.args.map(a => a.value || a.description || "").join(" "));
  });
  cdp.on("Runtime.exceptionThrown", (p) => pageErrors.push(JSON.stringify(p.exceptionDetails).slice(0, 300)));
  cdp.on("Log.entryAdded", (p) => { if (p.entry && p.entry.level === "error") consoleErrors.push(p.entry.text); });
  cdp.on("Network.requestWillBeSent", (p) => {
    if (p.request && p.request.url && !p.request.url.startsWith("file:") && !p.request.url.startsWith("data:")) netReqs.push(p.request.url);
  });
  // Auto-answer the typed-DELETE prompt during the clear-all step.
  cdp.on("Page.javascriptDialogOpening", (p) => {
    cdp.send("Page.handleJavaScriptDialog", { accept: true, promptText: "DELETE" }).catch(() => {});
  });
  await cdp.send("Runtime.enable");
  await cdp.send("Page.enable");
  await cdp.send("Log.enable");
  await cdp.send("Network.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

  await waitFor(cdp, "window.__BP_READY === true");
  const ev = (js) => cdp.eval(js);
  async function click(sel) {
    const done = await ev("(function(){var e=document.querySelector(" + J(sel) + "); if(!e) return false; e.click(); return true;})()");
    if (!done) throw new Error("click target missing: " + sel);
    await sleep(250);
  }
  async function setVal(id, val) { await ev("document.getElementById(" + J(id) + ").value = " + J(val) + ";"); }
  async function text(id) { return await ev("document.getElementById(" + J(id) + ").textContent.trim()"); }
  async function addReading(date, time, sys, dia, pulse) {
    await setVal("f-date", date); await setVal("f-time", time);
    await setVal("f-sys", String(sys)); await setVal("f-dia", String(dia));
    await setVal("f-pulse", pulse === null ? "" : String(pulse));
    await click("#addForm button[type=submit]");
  }

  // 1. boot + empty states
  eq("asof honored", await ev("window.__BP.asof"), "2026-10-14");
  eq("h1 EN", await text("dashH"), "Dashboard");
  eq("app title EN", await ev("document.querySelector('h1').textContent"), "Blood Pressure Tracker");
  eq("langBtn shows Bangla word", await text("langBtn"), "\u09ac\u09be\u0982\u09b2\u09be");
  eq("statLatest empty", await text("statLatest"), "No readings yet");
  eq("statTotal 0", await text("statTotal"), "0");
  contains("trend empty msg", await text("trendEmpty"), "at least 2 readings");
  contains("history empty", await ev("document.getElementById('histBody').textContent"), "No readings match");

  // 2. add Normal reading 118/76
  await addReading("2026-10-14", "08:00", 118, 76, 72);
  eq("form ok msg", await text("formMsg"), "Reading saved.");
  eq("statLatest 118/76", await text("statLatest"), "118/76");
  eq("cat Normal", await text("statLatestCat"), "Normal");
  eq("total 1", await text("statTotal"), "1");
  eq("avg7 118/76", await text("statAvg7"), "118.0/76.0");

  // 3. add Stage 2 reading 145/95
  await addReading("2026-10-14", "09:00", 145, 95, 78);
  eq("statLatest 145/95", await text("statLatest"), "145/95");
  eq("cat Stage 2", await text("statLatestCat"), "Stage 2");
  eq("avg7 exact 131.5/85.5", await text("statAvg7"), "131.5/85.5");
  eq("avg30 exact 131.5/85.5", await text("statAvg30"), "131.5/85.5");
  eq("total 2", await text("statTotal"), "2");
  eq("history rows 2", await ev("document.querySelectorAll('#histBody tr').length"), 2);

  // 4. invalid input rejected (sys 60)
  await addReading("2026-10-14", "10:00", 60, 80, null);
  contains("invalid sys error", await text("formMsg"), "Systolic must be");
  eq("total still 2 after invalid", await text("statTotal"), "2");

  // 5. category filter
  await ev("document.getElementById('filterCat').value = 'stage2'; document.getElementById('filterCat').dispatchEvent(new Event('change'));");
  await sleep(200);
  eq("filter stage2 -> 1 row", await ev("document.querySelectorAll('#histBody tr').length"), 1);
  await ev("document.getElementById('filterCat').value = 'all'; document.getElementById('filterCat').dispatchEvent(new Event('change'));");
  await sleep(200);
  eq("filter all -> 2 rows", await ev("document.querySelectorAll('#histBody tr').length"), 2);

  // 6. crisis banner
  await addReading("2026-10-14", "11:00", 190, 125, 90);
  eq("crisis cat", await text("statLatestCat"), "Hypertensive crisis");
  eq("crisis banner visible", await ev("document.getElementById('crisisBanner').style.display"), "");
  contains("crisis banner text", await text("crisisBanner"), "emergency");

  // 7. BN toggle + Bengali digits + reload persistence
  await click("#langBtn");
  eq("h1 BN", await ev("document.querySelector('h1').textContent"), await ev("window.__BP.I18N.bn.appTitle"));
  eq("statLatest BN digits", await text("statLatest"), "\u09e7\u09ef\u09e6/\u09e7\u09e8\u09eb");
  eq("cat BN", await text("statLatestCat"), await ev("window.__BP.I18N.bn.cat_crisis"));
  await cdp.send("Page.navigate", { url: APP });
  await waitFor(cdp, "window.__BP_READY === true");
  eq("BN persists after reload", await ev("document.querySelector('h1').textContent"), await ev("window.__BP.I18N.bn.appTitle"));
  eq("readings persist after reload", await text("statTotal"), "\u09e9");

  // 8. export/import API round-trip + malformed rejected
  eq("export/import round-trip", await ev("window.__BP.parseImport(window.__BP.exportData(window.__BP.state)).ok"), true);
  eq("malformed import rejected", await ev("window.__BP.parseImport('{\"app\":\"nope\"}').ok"), false);

  // 9. typed-DELETE clear-all via prompt dialog
  await click("#clearBtn");
  await sleep(400);
  eq("total 0 after clear (BN digit)", await text("statTotal"), "\u09e6");
  eq("clear msg", await text("dataMsg"), await ev("window.__BP.I18N.bn.clearDone"));

  // 10. 390px mobile no-overflow
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await sleep(300);
  eq("390px no horizontal overflow", await ev("document.documentElement.scrollWidth <= 390"), true);

  // 11. error + network hygiene
  eq("0 console errors", consoleErrors.length, 0);
  eq("0 page errors", pageErrors.length, 0);
  eq("0 network requests", netReqs.length, 0);

  console.log("\n" + pass + " smoke checks passed, " + fail + " failed");
  if (fail) process.exitCode = 1;
} finally {
  try { chrome.kill(); } catch (e) {}
}
