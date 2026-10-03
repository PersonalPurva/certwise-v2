// CertWise - page code (reads input, calls logic.js, shows results)

const TEAM = "Team Ctrl Freaks · She Solves 3.0";

// verified facts from the monthly refresh (data/live.js, written by refresh/refresh.mjs)
const LIVE_DATA = (typeof LIVE !== "undefined") ? LIVE : { refreshedOn: null, roles: {}, certs: {} };

// never put user text into the page without escaping it
function esc(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function $(id) {
  return document.getElementById(id);
}

function siteOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (e) {
    return "source";
  }
}

// small line icons, drawn as inline SVG
const ICONS = {
  check: "<path d='M22 11.08V12a10 10 0 1 1-5.93-9.14'/><polyline points='22 4 12 14.01 9 11.01'/>",
  cross: "<circle cx='12' cy='12' r='10'/><line x1='15' y1='9' x2='9' y2='15'/><line x1='9' y1='9' x2='15' y2='15'/>",
  alert: "<path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'/><line x1='12' y1='9' x2='12' y2='13'/><line x1='12' y1='17' x2='12.01' y2='17'/>",
  help: "<circle cx='12' cy='12' r='10'/><path d='M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3'/><line x1='12' y1='17' x2='12.01' y2='17'/>",
  open: "<path d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'/><polyline points='15 3 21 3 21 9'/><line x1='10' y1='14' x2='21' y2='3'/>",
  award: "<circle cx='12' cy='8' r='7'/><polyline points='8.21 13.89 7 23 12 20 17 23 15.79 13.88'/>",
  tag: "<path d='M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z'/><line x1='7' y1='7' x2='7.01' y2='7'/>",
  briefcase: "<rect x='2' y='7' width='20' height='14' rx='2' ry='2'/><path d='M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16'/>",
  bulb: "<path d='M9 18h6'/><path d='M10 22h4'/><path d='M12 2a7 7 0 0 0-4 12.74V17h8v-2.26A7 7 0 0 0 12 2z'/>",
  download: "<path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='7 10 12 15 17 10'/><line x1='12' y1='15' x2='12' y2='3'/>",
  edit: "<path d='M12 20h9'/><path d='M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z'/>"
};

function icon(name) {
  return "<svg class='ic' viewBox='0 0 24 24' aria-hidden='true'>" + ICONS[name] + "</svg>";
}

// which icon and short line goes with each result colour
const LEVEL_ICON = { green: "check", amber: "alert", red: "cross", grey: "help" };
const LEVEL_NOTE = {
  green: "Checkable on the issuer's own site",
  amber: "We couldn't confirm it",
  red: "Treat it as fake until proven otherwise",
  grey: "One more step needed"
};
// the same, when the answer came from the issuer itself (live check)
const LIVE_NOTE = {
  green: "The issuer has this certificate on record",
  amber: "The issuer's record doesn't fully match",
  red: "The issuer has no record of it"
};

// list of {name, url} -> links (only http/https links are ever made clickable)
function proofLinks(list) {
  return list.filter(s => /^https?:\/\//.test(s.url))
    .map(s => "<a href='" + esc(s.url) + "' target='_blank' rel='noopener'>" + esc(s.name) + "</a>").join(" · ");
}

// keys of SOURCES in data/roles.js -> links
function sourceLinks(keys) {
  return proofLinks((keys || []).filter(k => SOURCES[k]).map(k => SOURCES[k]));
}

// one verified fact: value, the exact quote, a link to the page and the date it was checked
function factHtml(f, showValue) {
  let html = showValue === false ? "" : "<b>" + esc(f.value) + "</b>";
  html += "<div class='quote'>“" + esc(f.quote) + "”<br>";
  if (/^https?:\/\//.test(f.url)) {
    html += "<a href='" + esc(f.url) + "' target='_blank' rel='noopener'>" + esc(siteOf(f.url)) + "</a>";
  }
  html += " · verified " + esc(f.checkedOn) + "</div>";
  return html;
}

// ---------- setup ----------

function setup() {
  $("checkBtn").addEventListener("click", () => runCheck(true));
  for (const id of ["certInput", "linkInput", "issuerInput"]) {
    $(id).addEventListener("keydown", e => { if (e.key === "Enter") runCheck(true); });
  }

  // example chips
  for (const a of document.querySelectorAll(".try")) {
    a.addEventListener("click", e => {
      e.preventDefault();
      $("certInput").value = a.dataset.cert;
      $("linkInput").value = a.dataset.link || "";
      $("issuerInput").value = a.dataset.issuer || "";
      fileNote("");
      runCheck(true);
    });
  }

  // the certificate file (photo, screenshot or PDF): choose it, or drag and drop it
  $("maxMb").textContent = MAX_FILE_MB;
  $("qrFile").addEventListener("change", () => {
    if ($("qrFile").files.length > 0) readFile($("qrFile").files[0]);
  });
  const drop = $("drop");
  drop.addEventListener("dragover", e => { e.preventDefault(); drop.classList.add("over"); });
  drop.addEventListener("dragleave", () => drop.classList.remove("over"));
  drop.addEventListener("drop", e => {
    e.preventDefault();
    drop.classList.remove("over");
    if (e.dataTransfer.files.length > 0) readFile(e.dataTransfer.files[0]);
  });

  // scan the QR code with the camera
  $("camBtn").addEventListener("click", startCamera);
  $("camClose").addEventListener("click", stopCamera);

  // is the CertWise API running? then the live check with the issuer is switched on
  findApi();

  // numbers in the header and footer come straight from our data files
  const ways = Object.keys(VERIFY_METHODS).filter(k => VERIFY_METHODS[k].domains.length > 0).length;
  $("statCerts").textContent = CERTS.length;
  $("statWays").textContent = ways;
  $("statFake").textContent = FAKE_UNIS.length;
  $("teamLine").textContent = TEAM;
  $("dataInfo").textContent = "Our list has " + CERTS.length + " certificates and " + ways +
    " official ways of verifying them. Live facts last refreshed: " +
    (LIVE_DATA.refreshedOn || "not yet") + ".";
}

// ---------- read the certificate file (image or PDF) ----------

const MAX_FILE_MB = 5;
const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";   // only loaded when a PDF is chosen

function fileNote(text, bad) {
  $("qrStatus").textContent = text;
  $("qrStatus").classList.toggle("bad", bad === true);
}

function readFile(file) {
  const ok = checkFile(file.name, file.type, file.size, MAX_FILE_MB);   // type and size limit (logic.js)
  if (!ok.ok) {
    fileNote(ok.why, true);
    $("qrFile").value = "";
    return;
  }
  if (typeof jsQR === "undefined") {
    fileNote("The QR reader didn't load (it needs an internet connection).", true);
    return;
  }
  fileNote("Reading " + file.name + "...");
  if (ok.kind === "pdf") readPdf(file);
  else readImage(file);
}

// put the link we found into the form and run the check
function useLink(link, note) {
  $("linkInput").value = link;
  fileNote(note);
  if ($("certInput").value.trim() !== "") runCheck(true);
}

// fill the form from what we could read on the certificate.
// found = result of findInText() (logic.js); qrLink = the link from a QR code, if there was one
// returns false when nothing useful was found
function fillFrom(found, qrLink, where) {
  const got = [];
  if (found.certId && $("certInput").value.trim() === "") {
    $("certInput").value = CERTS.find(c => c.id === found.certId).name;
    got.push("the certificate's name");
  }
  const link = qrLink || found.link || found.id;
  if (link) {
    $("linkInput").value = link;
    got.push(qrLink ? "its QR code" : (found.link ? "its link" : "its ID"));
  }
  if (found.fakeUni && $("issuerInput").value.trim() === "") {
    $("issuerInput").value = found.fakeUni.split(",")[0];
    got.push("the institute");
  }
  if (got.length === 0) return false;
  fileNote("Read from the " + where + ": " + got.join(", ") + ".");
  if ($("certInput").value.trim() !== "") runCheck(true);
  return true;
}

// load the text reader (Tesseract OCR) the first time a certificate has no QR code
const TESSERACT = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
let ocrReady = null;
function loadOcr() {
  if (!ocrReady) {
    ocrReady = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = TESSERACT;
      s.onload = resolve;
      s.onerror = () => { ocrReady = null; reject(new Error("the text reader did not load")); };
      document.head.appendChild(s);
    });
  }
  return ocrReady;
}

// the printed text on a picture of the certificate
async function textIn(canvas) {
  await loadOcr();
  const out = await Tesseract.recognize(canvas, "eng");
  return out.data.text || "";
}

// no QR code: read the text instead and look for the name, a link or an ID
async function readWords(canvas, where) {
  fileNote("No QR code - reading the text on the " + where + " (this takes a few seconds)...");
  try {
    const found = findInText(await textIn(canvas), CERTS, FAKE_UNIS, VERIFY_METHODS);
    if (!fillFrom(found, null, where)) {
      fileNote("We read the " + where + " but found no link, ID or certificate name we know. Type them in instead.", true);
    }
  } catch (e) {
    fileNote("No QR code found, and the text reader didn't load (it needs internet). Type the link instead.", true);
  }
}

// the QR code in a block of pixels, or null
function qrIn(canvas) {
  const ctx = canvas.getContext("2d");
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(pixels.data, canvas.width, canvas.height);
  return code && code.data ? code.data : null;
}

function readImage(file) {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    // big photos are shrunk first so the QR reader stays fast
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    const link = qrIn(canvas);
    URL.revokeObjectURL(url);
    if (link) useLink(link, "QR code read - the link is filled in above.");
    else readWords(canvas, "image");
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    fileNote("Couldn't open this image - try a PNG or JPG screenshot.", true);
  };
  img.src = url;
}

// load the PDF reader (pdf.js) the first time it is needed
let pdfReady = null;
function loadPdfJs() {
  if (!pdfReady) {
    pdfReady = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = PDFJS + "pdf.min.js";
      s.onload = () => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.js";
        resolve();
      };
      s.onerror = () => { pdfReady = null; reject(new Error("pdf.js did not load")); };
      document.head.appendChild(s);
    });
  }
  return pdfReady;
}

// a PDF certificate: collect its text and links, and look for a QR code on the first pages.
// a scanned PDF has no text of its own, so its first page is read with the text reader instead
async function readPdf(file) {
  try {
    await loadPdfJs();
  } catch (e) {
    fileNote("The PDF reader didn't load (it needs an internet connection). Try a screenshot instead.", true);
    return;
  }
  try {
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    let words = "";            // all the text and links in the PDF
    let qr = null;
    let firstPage = null;      // a picture of page 1, kept in case we need the text reader
    for (let n = 1; n <= Math.min(pdf.numPages, 3) && !qr; n++) {
      const page = await pdf.getPage(n);

      // clickable links, then the printed text
      for (const a of await page.getAnnotations()) {
        if (a.url) words += " " + a.url;
      }
      words += " " + (await page.getTextContent()).items.map(i => i.str).join(" ");

      // then draw the page and look for a QR code. "print" mode draws in one go
      // (the normal mode waits for the screen to repaint); give up on a page after 6 seconds
      const view = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(view.width);
      canvas.height = Math.round(view.height);
      const drawing = page.render({ canvasContext: canvas.getContext("2d"), viewport: view, intent: "print" });
      const drawn = await Promise.race([
        drawing.promise.then(() => true, () => false),
        new Promise(done => setTimeout(() => done(false), 6000))
      ]);
      if (!drawn) {
        drawing.cancel();
        continue;
      }
      if (n === 1) firstPage = canvas;
      qr = qrIn(canvas);
    }

    const found = findInText(words, CERTS, FAKE_UNIS, VERIFY_METHODS);
    if (fillFrom(found, qr, "PDF")) return;
    if (words.trim().length < 20 && firstPage) {
      await readWords(firstPage, "PDF");          // a scanned PDF: no text inside, so read the picture
    } else {
      fileNote("No QR code, link or ID found in this PDF. Type the link or ID printed on the certificate instead.", true);
    }
  } catch (e) {
    fileNote("Couldn't read this PDF - it may be damaged or password-protected. Try a screenshot of the certificate instead.", true);
  }
}

// ---------- scan the QR code with the camera ----------

let camStream = null;   // the camera, while it is on
let camTimer = null;

async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof jsQR === "undefined") {
    fileNote("The camera isn't available here (it needs https and an internet connection). Upload a photo instead.", true);
    return;
  }
  try {
    // "environment" = the back camera on a phone
    camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
  } catch (e) {
    fileNote("Couldn't open the camera (permission was not given, or there is no camera). Upload a photo instead.", true);
    return;
  }
  const video = $("camVideo");
  video.srcObject = camStream;
  await video.play();
  $("camBox").classList.remove("hidden");
  camTimer = setInterval(scanFrame, 250);   // look at a frame four times a second
}

function scanFrame() {
  const video = $("camVideo");
  if (!camStream || video.videoWidth === 0) return;
  const scale = Math.min(1, 800 / Math.max(video.videoWidth, video.videoHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
  const link = qrIn(canvas);
  if (link) {
    stopCamera();
    useLink(link, "QR code scanned with the camera - the link is filled in above.");
  }
}

function stopCamera() {
  clearInterval(camTimer);
  if (camStream) {
    for (const track of camStream.getTracks()) track.stop();   // switches the camera light off
  }
  camStream = null;
  $("camVideo").srcObject = null;
  $("camBox").classList.add("hidden");
}

// ---------- the check ----------

let last = null;   // the newest result, kept for "Download report"

function runCheck(scroll) {
  const query = $("certInput").value.trim();
  const input = { link: $("linkInput").value.trim(), issuer: $("issuerInput").value.trim() };
  const out = $("result");
  last = null;

  if (query === "") {
    out.innerHTML = "<section class='box result'><p>Type the certificate's name first.</p></section>";
    return;
  }

  const cert = findCert(query, CERTS);
  if (!cert) {
    out.innerHTML = notFoundHtml(query);
    $("customBtn").addEventListener("click", () => runCustom(query));
    if (input.issuer && matchFakeUni(input.issuer, FAKE_UNIS)) runCustom(query);   // a fake university needs no answers
  } else {
    const g = checkGenuine(cert, input, VERIFY_METHODS, CERT_VERIFY, FAKE_UNIS);
    const v = marketValue(cert, ROLES, ROLE_INFO, LIVE_DATA);
    last = { cert: cert, g: g, v: v, input: input };
    showResult();
    askIssuer();
  }
  wirePicks();
  if (scroll) out.scrollIntoView({ behavior: "smooth", block: "start" });
}

// draw the newest result (last) - in the main box, or under the three questions for an unlisted certificate
function showResult() {
  const html = resultHtml(last.cert, last.g, last.v);
  if (last.cert.custom) $("customResult").innerHTML = html;
  else $("result").innerHTML = "<section class='box result'>" + html + "</section>";
  $("reportBtn").addEventListener("click", downloadReport);
  wirePicks();
}

// ---------- live check: ask the issuer itself (needs the CertWise API - run "npm start") ----------

let apiReady = false;    // is our API reachable? (it isn't on a plain file or on GitHub Pages)
let checkNo = 0;         // so a slow answer for an old check can't overwrite a newer one

function findApi() {
  if (!location.protocol.startsWith("http")) return;
  fetch("api/health")
    .then(res => (res.ok ? res.json() : null))
    .then(info => {
      apiReady = !!(info && info.ok);
      if (apiReady) $("apiInfo").textContent = "Live check with the issuer is on (Credly, Coursera, edX).";
    })
    .catch(() => { apiReady = false; });
}

// only when the link already looks official: ask the issuer whether the certificate really exists
async function askIssuer() {
  if (!apiReady || !last || last.input.link === "" || last.g.level !== "green") return;
  const mine = ++checkNo;
  const note = $("liveNote");
  if (note) note.textContent = "Asking the issuer...";
  try {
    const res = await fetch("api/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ link: last.input.link })     // only the link is sent - never the file
    });
    const live = res.ok ? await res.json() : null;
    if (mine !== checkNo || !last) return;
    const today = new Date().toISOString().slice(0, 10);
    const better = applyLive(last.g, live, last.cert, CERTS, today);
    if (better !== last.g) {
      last.g = better;
      showResult();
    } else if ($("liveNote")) {
      $("liveNote").textContent = live && live.supported ? "The issuer didn't answer just now - we checked the link only." : "";
    }
  } catch (e) {
    if ($("liveNote")) $("liveNote").textContent = "";
  }
}

// the two answer panels with a heading and the report button
function resultHtml(cert, g, v) {
  return "<div class='result-head'><div class='tile'>" + icon("award") + "</div>" +
    "<div class='grow'><h3>" + esc(cert.name) + "</h3><div class='small'>Issued by " + esc(cert.issuer) + "</div></div>" +
    "<button id='reportBtn' class='ghost'>" + icon("download") + " Download report</button></div>" +
    (cert.custom ? "<div class='warn'>" + icon("edit") + "<span>This certificate is not in our list, so it is scored from " +
      "<b>your answers</b>. We could not check those facts ourselves.</span></div>" : "") +
    "<div class='two'>" + genuineHtml(cert, g) + valueHtml(cert, v, g) + "</div>";
}

// ---------- a certificate that is not in our list: three quick questions ----------

const QUESTIONS = [
  { id: "issuer", ask: "Who issued it?", options: [
    ["vendor", "The company or body that owns the field (like AWS, Microsoft, Cisco, CompTIA)"],
    ["academic", "An IIT or a university, with its own exam"],
    ["platform", "An online learning platform (like Coursera, Udemy, edX)"],
    ["unknown", "A training company or event organiser - or I'm not sure"]
  ] },
  { id: "earned", ask: "How was it earned?", options: [
    ["proctored", "By passing a supervised exam"],
    ["graded", "By passing online tests or projects"],
    ["completion", "By finishing the videos or tasks"],
    ["attendance", "Just by attending"]
  ] },
  { id: "hasLink", ask: "Does it have a verification link, QR code or ID?", options: [
    ["yes", "Yes"],
    ["no", "No"]
  ] }
];

function notFoundHtml(query) {
  let html = "<section class='box result'><div class='result-head'><div class='tile'>" + icon("help") + "</div>" +
    "<div><h3>\"" + esc(query) + "\" is not in our list yet</h3>" +
    "<div class='small'>Answer 3 quick questions and we will still check it.</div></div></div>";
  const close = rankCerts(query, CERTS).filter(r => r.score >= 0.3).slice(0, 3);
  if (close.length > 0) {
    html += "<div class='chips'>Did you mean: " + close.map(r => "<a href='#' class='pick' data-name='" + esc(r.cert.name) + "'>" +
      esc(r.cert.name) + "</a>").join(" ") + "</div>";
  }
  html += "<div class='asks3'>";
  QUESTIONS.forEach((q, i) => {
    html += "<fieldset class='q'><legend><span class='num'>" + (i + 1) + "</span> " + esc(q.ask) + "</legend>";
    for (const [value, text] of q.options) {
      html += "<label class='opt'><input type='radio' name='q_" + q.id + "' value='" + value + "'> " + esc(text) + "</label>";
    }
    html += "</fieldset>";
  });
  html += "</div><label class='field-label' for='q_field'>Which job is it for? <span class='optional'>(optional)</span></label>" +
    "<select id='q_field'><option value=''>Not sure / general</option>";
  for (const r of ROLES) html += "<option value='" + r.id + "'>" + esc(r.name) + "</option>";
  html += "</select><p id='customNote' class='small'></p>" +
    "<button id='customBtn' class='primary'>" + icon("check") + " Score this certificate</button>" +
    "<div id='customResult'></div></section>";
  return html;
}

function runCustom(query) {
  const input = { link: $("linkInput").value.trim(), issuer: $("issuerInput").value.trim() };
  const picked = id => {
    const on = document.querySelector("input[name='q_" + id + "']:checked");
    return on ? on.value : "";
  };
  const fakeUni = input.issuer && matchFakeUni(input.issuer, FAKE_UNIS);
  const answers = { issuer: picked("issuer"), earned: picked("earned"), field: $("q_field").value };
  const hasLink = picked("hasLink");

  if (!fakeUni && (!answers.issuer || !answers.earned || !hasLink)) {
    $("customNote").textContent = "Please answer all three questions.";
    return;
  }
  $("customNote").textContent = "";
  // a fake university: the answers don't matter, so use the lowest ones
  if (!answers.issuer) answers.issuer = "unknown";
  if (!answers.earned) answers.earned = "attendance";

  const cert = customCert(query, input.issuer, answers);
  const g = checkGenuineAny(input, hasLink, VERIFY_METHODS, FAKE_UNIS);
  const v = marketValue(cert, ROLES, ROLE_INFO, LIVE_DATA);
  last = { cert: cert, g: g, v: v, input: input };
  showResult();
  askIssuer();
  $("customResult").scrollIntoView({ behavior: "smooth", block: "start" });
}

// the coloured block with an icon and the verdict
function statusHtml(level, verdict, note) {
  return "<div class='status " + level + "'><div class='status-icon'>" + icon(LEVEL_ICON[level]) + "</div>" +
    "<div><div class='verdict'>" + esc(verdict) + "</div><div class='status-sub'>" + esc(note) + "</div></div></div>";
}

function genuineHtml(cert, g) {
  const fakeUni = g.verdict === "Fake university";
  let html = "<div class='panel' data-level='" + g.level + "'>" +
    "<div class='panel-title'><span class='num'>1</span> Is it genuine?</div>";
  html += statusHtml(g.level, g.verdict, fakeUni ? "Not a valid university" : (g.live ? LIVE_NOTE[g.level] : LEVEL_NOTE[g.level]));
  html += "<ul class='reasons'>";
  for (const r of g.reasons) html += "<li>" + esc(r) + "</li>";
  html += "</ul>";
  // the live check writes here while it waits; afterwards a small tag shows the answer came from the issuer
  html += g.live ? "<div class='livetag'>" + icon("check") + " Live check with the issuer</div>"
                 : "<div id='liveNote' class='small'></div>";
  if (g.page) {
    html += "<a class='button' href='" + esc(g.page) + "' target='_blank' rel='noopener'>" + icon("open") + " Open the official check</a>";
  }
  if (fakeUni) {
    html += "<p class='proof'><b>Proof:</b> " + proofLinks([FAKE_UNIS_SRC]) + "</p>";
  } else if (g.method) {
    html += "<div class='howbox'><b>How " + esc(cert.issuer) + " certificates are verified:</b> " + esc(g.method.how);
    if (g.method.src.length > 0) html += "<br><b>Proof:</b> " + proofLinks(g.method.src);
    html += "</div>";
  } else {
    // a certificate that is not in our list: we don't know how its issuer verifies
    html += "<div class='howbox'><b>Tip:</b> a real certificate almost always has a verification link or ID " +
      "on the issuer's own website. If it has neither, anyone could have made it.</div>";
  }
  return html + "</div>";
}

// a ring that fills up to the percent
function gaugeHtml(percent, level) {
  const around = 2 * Math.PI * 52;                 // length of the ring
  const empty = around * (1 - percent / 100);      // the part left unfilled
  return "<svg class='gauge " + level + "' viewBox='0 0 120 120' role='img' aria-label='" + percent + " percent'>" +
    "<circle class='gauge-bg' cx='60' cy='60' r='52'/>" +
    "<circle class='gauge-fg' cx='60' cy='60' r='52' stroke-dasharray='" + around.toFixed(1) +
    "' stroke-dashoffset='" + empty.toFixed(1) + "'/>" +
    "<text x='60' y='69' text-anchor='middle'>" + percent + "%</text></svg>";
}

// points as filled / empty dots, e.g. 1 of 2 -> ● ○
function dotsHtml(points, max) {
  let html = "<span class='dots' title='" + points + " of " + max + " points'>";
  for (let i = 0; i < max; i++) html += "<span class='dot" + (i < points ? " on" : "") + "'></span>";
  return html + "</span>";
}

function valueHtml(cert, v, g) {
  const fake = g.level === "red";
  let html = "<div class='panel' data-level='" + (fake ? "red" : v.level) + "'>" +
    "<div class='panel-title'><span class='num'>2</span> What is it worth?</div>";

  if (g.verdict === "Fake university") {
    // nothing else to score: a certificate from a fake university is not valid at all
    return html + "<div class='gauge-row'>" + gaugeHtml(0, "red") +
      "<div><div class='verdict red-text'>No market value</div>" +
      "<div class='status-sub'>A degree or certificate from a fake university is not valid for jobs or higher studies.</div></div></div></div>";
  }
  if (fake) {
    html += "<div class='gauge-row'>" + gaugeHtml(0, "red") +
      "<div><div class='verdict red-text'>No market value if it is fake</div>" +
      "<div class='status-sub'>A fake certificate is worth nothing - and showing one can cost you the job.</div></div></div>" +
      "<p class='small'>For a genuine " + esc(cert.name) + ", the score would be:</p>";
  }
  html += "<div class='gauge-row'>" + gaugeHtml(v.percent, v.level) +
    "<div><div class='verdict " + v.level + "-text'>" + esc(v.band) + (fake ? " (if genuine)" : "") + "</div>" +
    "<div class='status-sub'>" + v.total + " of " + v.max + " points from 3 checks</div></div></div>";
  if (v.warning) html += "<div class='warn'>" + icon("alert") + "<span>" + esc(v.warning) + "</span></div>";

  html += "<div class='checks'>";
  for (const ch of v.checks) {
    html += "<div class='check-row'><div class='check-head'><span>" + esc(ch.name) + "</span>" +
      dotsHtml(ch.points, ch.max) + "</div><div class='check-why'>" + esc(ch.reason);
    if (ch.src && ch.src.length > 0) html += "<br>Proof: " + sourceLinks(ch.src);
    html += "</div></div>";
  }
  html += "</div>";

  // price (hand-checked, with proof) + newest verified facts from the monthly refresh
  if (cert.costNote) {
    html += "<div class='fact'>" + icon("tag") + "<div><b>Price:</b> " + esc(cert.costNote);
    if (cert.src.length > 0) html += "<div class='proof'>Proof: " + proofLinks(cert.src) + "</div>";
    html += "</div></div>";
  }
  const lc = LIVE_DATA.certs[cert.id];
  if (lc && (lc.price || lc.status)) {
    html += "<p><b>Latest verified facts:</b></p>";
    if (lc.price) html += "<p>Price: " + factHtml(lc.price) + "</p>";
    if (lc.status) html += "<p>Status: " + factHtml(lc.status) + "</p>";
  }
  if (lc && lc.demand && lc.demand.length > 0) {
    html += "<p><b>Sources that call it in demand:</b></p><ul>";
    for (const d of lc.demand) html += "<li>" + factHtml(d, false) + "</li>";
    html += "</ul>";
  }

  // the jobs it leads to, with fresher salary
  if (v.jobs.length > 0) {
    html += "<div class='fact'>" + icon("briefcase") + "<div><b>Jobs it leads to</b> (fresher pay in India)</div></div><div class='jobs'>";
    for (const j of v.jobs) {
      const liveRole = LIVE_DATA.roles[j.id];
      if (liveRole && liveRole.salary) {
        html += "<div class='job'><b>" + esc(j.name) + "</b>" + factHtml(liveRole.salary) + "</div>";
      } else {
        html += "<div class='job'><b>" + esc(j.name) + "</b>" + esc(j.info.salary.range) +
          "<div class='proof'>Source: " + sourceLinks(j.info.salary.src) + "</div></div>";
      }
    }
    html += "</div><p class='proof'>" + esc(PUNE_NOTE.text) + " (" + sourceLinks(PUNE_NOTE.src) + ").</p>";
  }

  if (cert.note) html += "<div class='fact'>" + icon("bulb") + "<div><span class='adv'>our advice</span> " + esc(cert.note) + "</div></div>";

  const better = betterValue(cert, CERTS, ROLES, ROLE_INFO, LIVE_DATA, 3);
  if (better.length > 0) {
    html += "<div class='alts'><b>Higher value in the same field</b><ul>";
    for (const b of better) {
      html += "<li><a href='#' class='pick' data-name='" + esc(b.cert.name) + "'>" + esc(b.cert.name) + "</a> " +
        b.percent + "% · " + esc(b.cert.costNote) + "</li>";
    }
    html += "</ul></div>";
  }
  return html + "</div>";
}

// "did you mean" and "higher value" links check that certificate
function wirePicks() {
  for (const a of document.querySelectorAll(".pick")) {
    if (a.dataset.wired) continue;     // already has its click handler
    a.dataset.wired = "yes";
    a.addEventListener("click", e => {
      e.preventDefault();
      $("certInput").value = a.dataset.name;
      $("linkInput").value = "";
      $("issuerInput").value = "";
      fileNote("");
      runCheck(true);
    });
  }
}

// ---------- download the result as a PDF report ----------

const JSPDF = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";   // only loaded when asked for

let pdfWriterReady = null;
function loadPdfWriter() {
  if (!pdfWriterReady) {
    pdfWriterReady = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = JSPDF;
      s.onload = resolve;
      s.onerror = () => { pdfWriterReady = null; reject(new Error("jsPDF did not load")); };
      document.head.appendChild(s);
    });
  }
  return pdfWriterReady;
}

// the PDF's built-in font only knows Latin letters, so swap the few other symbols we use
function plainText(text) {
  return String(text)
    .replace(/₹\s?/g, "Rs ")
    .replace(/[“”]/g, "\"").replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-").replace(/→/g, "->")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "");
}

const REPORT_COLOR = { green: [27, 127, 59], amber: [148, 98, 0], red: [179, 38, 30], grey: [71, 85, 105] };

// build the report from the newest result (last) and return the PDF document
function reportDoc() {
  const doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4" });
  const LEFT = 15, WIDTH = 180, BOTTOM = 282;
  let y = 20;

  // write wrapped text, then move down; a full page starts a new one
  function write(text, size, style, color) {
    doc.setFont("helvetica", style || "normal");
    doc.setFontSize(size);
    const c = color || [22, 36, 30];
    doc.setTextColor(c[0], c[1], c[2]);
    for (const line of doc.splitTextToSize(plainText(text), WIDTH)) {
      if (y > BOTTOM) { doc.addPage(); y = 20; }
      doc.text(line, LEFT, y);
      y += size * 0.42;
    }
  }
  // a label followed by clickable links, one per line
  function links(label, list) {
    const ok = list.filter(s => /^https?:\/\//.test(s.url));
    if (ok.length === 0) return;
    write(label, 9, "bold", [91, 107, 99]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(11, 95, 165);
    for (const s of ok) {
      if (y > BOTTOM) { doc.addPage(); y = 20; }
      // the name and the website, clickable (a full web address is often too long for one line)
      const shown = doc.splitTextToSize(plainText(s.name + " (" + siteOf(s.url) + ")"), WIDTH)[0];
      doc.textWithLink(shown, LEFT, y, { url: s.url });
      y += 4.2;
    }
  }
  function heading(text) {
    y += 4;
    write(text, 13, "bold", [46, 109, 93]);
    y += 1;
  }
  const srcList = keys => (keys || []).filter(k => SOURCES[k]).map(k => SOURCES[k]);

  const cert = last.cert, g = last.g, v = last.v;
  const fake = g.level === "red";

  write("CertWise report", 20, "bold", [46, 109, 93]);
  write("Is this certificate genuine, and what is it worth?  ·  Checked on " + new Date().toLocaleString("en-IN"), 9, "normal", [91, 107, 99]);
  y += 4;
  write(cert.name, 14, "bold");
  write("Issued by " + cert.issuer, 10, "normal", [91, 107, 99]);
  if (last.input.link) write("Link / ID checked: " + last.input.link, 9);
  if (last.input.issuer) write("Institute checked: " + last.input.issuer, 9);
  if (cert.custom) write("This certificate is not in our list. It is scored from the user's own answers, which CertWise could not check.", 9, "italic", REPORT_COLOR.amber);

  heading("1. Is it genuine?");
  write(g.verdict, 12, "bold", REPORT_COLOR[g.level]);
  if (g.live) write("Checked live with the issuer.", 9, "italic", [91, 107, 99]);
  for (const r of g.reasons) write("- " + r, 10);
  if (g.page) links("Official check:", [{ name: "Open the official page", url: g.page }]);
  if (g.verdict === "Fake university") {
    links("Proof:", [FAKE_UNIS_SRC]);
  } else if (g.method) {
    write("How " + cert.issuer + " certificates are verified: " + g.method.how, 9, "normal", [91, 107, 99]);
    links("Proof:", g.method.src);
  }

  heading("2. What is it worth?");
  if (g.verdict === "Fake university") {
    write("0% - No market value. A degree or certificate from a fake university is not valid for jobs or higher studies.", 12, "bold", REPORT_COLOR.red);
    y += 5;
    write("CertWise checks the link, the ID format, public lists and published facts. It sells no courses and takes no commission.", 8, "italic", [91, 107, 99]);
    return doc;
  }
  if (fake) write("0% - No market value if it is fake.", 12, "bold", REPORT_COLOR.red);
  write((fake ? "For a genuine one: " : "") + v.percent + "% - " + v.band + " (" + v.total + " of " + v.max + " points)", 12, "bold",
        fake ? REPORT_COLOR.grey : REPORT_COLOR[v.level]);
  if (v.warning) write("Note: " + v.warning, 10, "normal", REPORT_COLOR.amber);
  y += 1;
  for (const ch of v.checks) {
    write(ch.name + ": " + ch.points + " / " + ch.max, 10, "bold");
    write(ch.reason, 10);
    links("Proof:", srcList(ch.src));
    y += 1;
  }
  if (cert.costNote) {
    write("Price: " + cert.costNote, 10, "bold");
    links("Proof:", cert.src);
  }
  if (v.jobs.length > 0) {
    y += 1;
    write("Jobs it leads to (fresher pay in India)", 10, "bold");
    for (const j of v.jobs) {
      write("- " + j.name + ": " + j.info.salary.range, 10);
      links("Source:", srcList(j.info.salary.src));
    }
    write(PUNE_NOTE.text + ".", 9, "normal", [91, 107, 99]);
  }
  if (cert.note) {
    y += 1;
    write("Our advice: " + cert.note, 10, "italic");
  }
  const better = betterValue(cert, CERTS, ROLES, ROLE_INFO, LIVE_DATA, 3);
  if (better.length > 0) {
    y += 1;
    write("Higher value in the same field", 10, "bold");
    for (const b of better) write("- " + b.cert.name + ": " + b.percent + "% · " + b.cert.costNote, 10);
  }

  y += 5;
  write("CertWise checks the link, the ID format, public lists and published facts. It cannot read the issuer's own records, " +
    "so always confirm on the issuer's official page. CertWise sells no courses and takes no commission.", 8, "italic", [91, 107, 99]);
  return doc;
}

async function downloadReport() {
  if (!last) return;
  const btn = $("reportBtn");
  const label = btn.innerHTML;
  btn.textContent = "Preparing...";
  try {
    await loadPdfWriter();
    const name = last.cert.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 40);
    reportDoc().save("CertWise-report-" + name + ".pdf");
    btn.innerHTML = label;
  } catch (e) {
    btn.textContent = "Couldn't make the PDF (needs internet)";
  }
}

setup();
