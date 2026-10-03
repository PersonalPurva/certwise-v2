// CertWise server (version 2): the web page + a small API.   node serve.js  ->  http://localhost:5174
//
//   /                 the app (static files)
//   /api/health       tells the page that the API is here
//   /api/live         (POST {"link": "..."}) asks the issuer (Credly, Coursera, edX) whether this certificate exists
//
// The page still works without this server (for example on GitHub Pages) - only the live check is skipped.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { liveCheck } = require("./api/live.js");

const ROOT = __dirname;
const PORT = process.env.PORT || 5174;
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || "";     // set this if the page is hosted on another site
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json",
                ".png": "image/png", ".pdf": "application/pdf" };

// at most 30 live checks a minute from one address, so nobody can use us to hammer the issuers
const LIMIT = 30;
const seen = new Map();          // address -> list of request times in the last minute
function allowed(address) {
  const now = Date.now();
  const times = (seen.get(address) || []).filter(t => now - t < 60000);
  if (times.length >= LIMIT) {
    seen.set(address, times);
    return false;
  }
  times.push(now);
  seen.set(address, times);
  return true;
}

function sendJson(res, status, data) {
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  if (ALLOW_ORIGIN) headers["Access-Control-Allow-Origin"] = ALLOW_ORIGIN;
  res.writeHead(status, headers);
  res.end(JSON.stringify(data));
}

// read a small JSON body (the link is sent in the body, not in the web address)
function readBody(req) {
  return new Promise((resolve, reject) => {
    let text = "";
    req.on("data", chunk => {
      text += chunk;
      if (text.length > 2000) reject(new Error("too long"));
    });
    req.on("end", () => {
      try { resolve(JSON.parse(text || "{}")); } catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

async function api(req, res, url) {
  if (url.pathname === "/api/health") {
    return sendJson(res, 200, { ok: true, live: ["credly", "coursera", "edx"] });
  }
  if (url.pathname === "/api/live") {
    if (req.method !== "POST") return sendJson(res, 405, { error: "use POST with {\"link\": \"...\"}" });
    let link = "";
    try { link = String((await readBody(req)).link || ""); } catch (e) { link = ""; }
    if (link === "" || link.length > 500) return sendJson(res, 400, { error: "send {\"link\": \"the certificate's link\"}" });
    if (!allowed(req.socket.remoteAddress)) return sendJson(res, 429, { error: "too many checks - wait a minute" });
    const result = await liveCheck(link);
    // audit line: when, which issuer, what answer - never the link or the ID
    console.log(new Date().toISOString(), "live check:", result.issuer || "unsupported", "exists =", result.exists);
    return sendJson(res, 200, result);
  }
  sendJson(res, 404, { error: "no such API" });
}

http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname.startsWith("/api/")) {
    api(req, res, url).catch(() => sendJson(res, 500, { error: "the check failed" }));
    return;
  }

  let file = decodeURIComponent(url.pathname);
  if (file === "/") file = "/index.html";
  const full = path.join(ROOT, file);
  // block ../ tricks, hidden files (.env, .git) and node_modules
  if (!full.startsWith(ROOT) || /(^|[\\/])\.|node_modules/.test(file)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  fs.readFile(full, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end("Not found");
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(full)] || "text/plain" });
    res.end(data);
  });
}).listen(PORT, () => console.log("CertWise running at http://localhost:" + PORT));
