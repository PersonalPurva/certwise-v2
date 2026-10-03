// CertWise - core logic (no HTML in this file)
// 1. findCert()     : match what the user typed to a certificate (handles typos)
// 2. checkGenuine() : is the certificate real? (official verification link / ID, UGC fake-university list)
//    checkFile()    : is the uploaded file an allowed type and size?   pickLink(): best link inside a PDF
// 3. marketValue()  : market value score from three checks (recognition, proof of skill, job demand)
// 4. betterValue()  : higher-value certificates in the same field
// 5. customCert() + checkGenuineAny() : a certificate that is NOT in our list, scored from the user's answers

// ---------- text helpers ----------

function normalize(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9+.\- ]/g, " ")   // keep letters, digits, + . - (for "security+", "1z0-811")
    .replace(/\s+/g, " ")
    .trim();
}

function words(text) {
  return normalize(text).split(" ").filter(w => w.length > 0);
}

// Levenshtein (edit) distance with a DP table:
// dp[i][j] = edits needed to turn the first i letters of a into the first j letters of b
function editDistance(a, b) {
  const dp = [];
  for (let i = 0; i <= a.length; i++) {
    dp.push([i]);
  }
  for (let j = 1; j <= b.length; j++) {
    dp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,        // delete
        dp[i][j - 1] + 1,        // insert
        dp[i - 1][j - 1] + cost  // replace (or keep)
      );
    }
  }
  return dp[a.length][b.length];
}

// two words "match" if they are equal or only a small typo apart
function wordsMatch(typed, real) {
  if (typed === real) return true;
  if (typed.length < 4) return false;          // short words must match exactly
  const allowed = typed.length >= 7 ? 2 : 1;
  return editDistance(typed, real) <= allowed;
}

// ---------- 1. find the certificate ----------

// returns a list of { cert, score } sorted best first (score 0..1)
function rankCerts(query, certs) {
  const q = normalize(query);
  const qWords = words(query).filter(w => !["certificate", "certification", "course", "exam", "the", "of", "for"].includes(w));
  const results = [];

  for (const cert of certs) {
    let score = 0;

    // exact alias or name inside the query (e.g. "rhcsa", "az-900")
    const names = [normalize(cert.name)].concat(cert.aliases.map(normalize));
    for (const n of names) {
      if (n.length > 0 && (q === n || q.includes(n) || n.includes(q))) {
        score = Math.max(score, q.length >= 3 ? 1 : 0.5);
      }
    }

    // otherwise: how many typed words appear (with typos allowed) in the name / aliases
    if (score < 1 && qWords.length > 0) {
      const certWords = words(cert.name + " " + cert.aliases.join(" ") + " " + cert.issuer + " " + (cert.keywords || ""));
      let found = 0;
      for (const w of qWords) {
        if (certWords.includes(w)) found += 1;                              // exact word
        else if (certWords.some(cw => wordsMatch(w, cw))) found += 0.9;     // small typo counts a little less
      }
      score = Math.max(score, found / qWords.length);
    }

    if (score > 0) results.push({ cert: cert, score: score });
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

function findCert(query, certs) {
  const ranked = rankCerts(query, certs);
  if (ranked.length > 0 && ranked[0].score >= 0.6) return ranked[0].cert;
  return null;
}

// ---------- 2. is it genuine? ----------

// "https://www.credly.com/badges/abc" -> "credly.com"; returns null if it isn't a web link
function hostOf(link) {
  let text = link.trim();
  if (!/^https?:\/\//i.test(text)) {
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$)/i.test(text)) return null;   // not even "site.com/..."
    text = "https://" + text;
  }
  try {
    return new URL(text).hostname.toLowerCase().replace(/^www\./, "");
  } catch (e) {
    return null;
  }
}

function pathOf(link) {
  let text = link.trim();
  if (!/^https?:\/\//i.test(text)) text = "https://" + text;
  try {
    return new URL(text).pathname.toLowerCase();
  } catch (e) {
    return "";
  }
}

// is host the official domain, or a part of it (e.g. "verify.comptia.org" is on "comptia.org")?
function onDomain(host, domain) {
  return host === domain || host.endsWith("." + domain);
}

// the "name" part of a domain: "credly.com" -> "credly", "nptel.ac.in" -> "nptel"
function brandOf(domain) {
  const parts = domain.split(".");
  let base = parts[parts.length - 2];
  if (parts.length >= 3 && ["ac", "co", "gov", "org", "edu", "net"].includes(base)) {
    base = parts[parts.length - 3];
  }
  return base;
}

// a copy-cat site: uses the brand name, or a small typo of it, but is NOT the official domain
function looksLike(host, domain) {
  if (onDomain(host, domain)) return false;
  const brand = brandOf(domain);
  if (brand.length < 5) return false;           // too short to judge ("learn", "isc2")
  const labels = host.split(/[.-]/);
  return host.includes(brand) || labels.some(l => l.length >= 4 && editDistance(l, brand) <= 2);
}

// a name without dots and dashes, so "Ltd." and "Ltd" compare equal
function plainName(text) {
  return normalize(text).replace(/[.\-]/g, " ").replace(/\s+/g, " ").trim();
}

// is the issuer one of UGC's fake universities? returns the list entry or null
function matchFakeUni(name, fakeUnis) {
  const typed = plainName(name);
  if (typed.length < 6) return null;
  for (const entry of fakeUnis) {
    const core = plainName(entry.split(",")[0].replace(/\(.*?\)/g, " "));   // name without place / short form
    if (typed.includes(core) || (typed.length >= 10 && core.includes(typed)) || editDistance(typed, core) <= 2) {
      return entry;
    }
  }
  return null;
}

// ---------- the uploaded certificate file ----------

const FILE_TYPES = { "image/png": "image", "image/jpeg": "image", "image/webp": "image", "application/pdf": "pdf" };
const FILE_EXTS = { png: "image", jpg: "image", jpeg: "image", webp: "image", pdf: "pdf" };

// is this file allowed? returns { ok: true, kind: "image" or "pdf" } or { ok: false, why: "..." }
function checkFile(name, type, sizeBytes, maxMb) {
  const ext = name.toLowerCase().split(".").pop();
  const kind = FILE_TYPES[type] || FILE_EXTS[ext];
  if (!kind) return { ok: false, why: "Only PNG, JPG or WEBP images and PDF files are accepted." };
  if (sizeBytes === 0) return { ok: false, why: "This file is empty." };
  const mb = sizeBytes / (1024 * 1024);
  if (mb > maxMb) {
    return { ok: false, why: "This file is " + mb.toFixed(1) + " MB - the limit is " + maxMb + " MB." };
  }
  return { ok: true, kind: kind };
}

// a PDF can hold several links: pick the one to check.
// best = an official verification page, then any official site, then a look-alike (so it gets flagged)
function pickLink(links, methods) {
  let best = null, bestScore = -1;
  for (const raw of links) {
    const link = raw.trim().replace(/[.,;:)\]]+$/, "");
    const host = hostOf(link);
    if (!host) continue;
    let score = 0;
    for (const key in methods) {
      for (const d of methods[key].domains) {
        if (onDomain(host, d)) {
          const onVerifyPage = methods[key].path !== "" && pathOf(link).includes(methods[key].path);
          score = Math.max(score, onVerifyPage ? 3 : 2);
        } else if (looksLike(host, d)) {
          score = Math.max(score, 1);
        }
      }
    }
    if (score > bestScore) { best = link; bestScore = score; }
  }
  return best;
}

// ---------- reading the text of a certificate (from OCR or from a PDF) ----------

// what can we recognise in the text? returns { link, id, certId, fakeUni } (null where nothing was found)
function findInText(text, certs, fakeUnis, methods) {
  const found = { link: null, id: null, certId: null, fakeUni: null };
  const flat = text.replace(/\s+/g, " ");

  // a verification link, printed with or without https://
  const links = flat.match(/https?:\/\/[^\s"'<>]+|(?:[a-z0-9-]+\.)+[a-z]{2,}\/[^\s"'<>]+/gi) || [];
  found.link = pickLink(links, methods);

  // an ID like 123-456-789 (Red Hat)
  const id = flat.match(/\b\d{3}-\d{3}-\d{3}\b/);
  if (id) found.id = id[0];

  // which certificate is it? the longest known name that appears as whole words wins
  const words = " " + normalize(flat) + " ";
  let longest = 0;
  for (const c of certs) {
    for (const a of c.aliases) {
      const name = normalize(a);
      if (name.length > longest && words.includes(" " + name + " ")) {
        longest = name.length;
        found.certId = c.id;
      }
    }
  }

  // is a fake university named on it?
  const plain = " " + plainName(flat) + " ";
  for (const entry of fakeUnis) {
    const core = plainName(entry.split(",")[0].replace(/\(.*?\)/g, " "));
    if (plain.includes(" " + core + " ")) found.fakeUni = entry;
  }
  return found;
}

// ---------- the issuer's own answer (from the CertWise API, api/live.js) ----------

// is the badge the issuer showed us the same certificate the user typed?
function sameCert(cert, badgeName, certs) {
  if (cert.custom) return true;                       // not in our list: nothing to compare with
  const hit = findCert(badgeName, certs);
  if (hit && hit.id === cert.id) return true;
  const badge = normalize(badgeName);
  return cert.aliases.some(a => badge.includes(normalize(a)));
}

// g = result of checkGenuine(); live = answer of the API; today = "2026-10-03"
// returns a new result when the issuer gave a clear answer, otherwise g unchanged
function applyLive(g, live, cert, certs, today) {
  if (!live || !live.supported || live.exists === null || live.exists === undefined) return g;
  const site = { credly: "Credly", coursera: "Coursera", edx: "edX" }[live.issuer] || "The issuer";
  const out = { level: "green", verdict: "Confirmed by the issuer", reasons: [], method: g.method, page: g.page, live: true };

  if (live.exists === false) {
    out.level = "red";
    out.verdict = "No record at the issuer";
    out.reasons.push(site + " has no public record of this certificate ID. It may be made up, revoked or set to private - " +
      "treat it as unverified until the holder gives a working link.");
    return out;
  }

  const d = live.details || {};
  let line;
  if (d.badgeName) {
    line = "We asked " + site + " directly: it has a record of this certificate - \"" + d.badgeName + "\"" +
      (d.issuerName ? ", issued by " + d.issuerName : "") + (d.issuedOn ? ", on " + d.issuedOn : "");
  } else {
    line = "We asked " + site + " directly: a certificate with this ID exists";   // the issuer gives no more details
  }
  out.reasons.push(line + ".");

  if (d.badgeName && !sameCert(cert, d.badgeName, certs)) {
    out.level = "amber";
    out.verdict = "Real, but a different certificate";
    out.reasons.push("The record is for \"" + d.badgeName + "\", not for " + cert.name + ". Check which certificate the holder really has.");
  } else if (d.expires && d.expires < today) {
    out.level = "amber";
    out.verdict = "Confirmed, but expired";
    out.reasons.push("It expired on " + d.expires + ".");
  } else if (d.expires) {
    out.reasons.push("It is valid until " + d.expires + ".");
  }
  out.reasons.push(d.badgeName ? "Last step: open the official page to check the holder's name."
                               : "Last step: open the official page to check that the course and the holder's name match.");
  return out;
}

// input = { link: "...", issuer: "..." } (both optional)
// returns { level, verdict, reasons, method, page }
function checkGenuine(cert, input, methods, certVerify, fakeUnis) {
  const method = methods[certVerify[cert.id]] || methods.unknownpage;
  const result = { level: "grey", verdict: "", reasons: [], method: method, page: method.page };

  // a) issued by a fake university?
  if (input.issuer) {
    const fake = matchFakeUni(input.issuer, fakeUnis);
    if (fake) {
      result.level = "red";
      result.verdict = "Fake university";
      result.reasons.push("\"" + fake + "\" is on UGC's list of fake universities (February 2026). " +
        "Its degrees and certificates are not valid for jobs or higher studies.");
      result.page = null;
      return result;
    }
  }

  // b) no official way to check it at all
  if (method.domains.length === 0) {
    result.level = "amber";
    result.verdict = method === methods.none ? "Can't be verified" : "No public check found";
    result.reasons.push(method.how);
    return result;
  }

  const text = (input.link || "").trim();
  if (text === "") {
    result.verdict = "Not checked yet";
    result.reasons.push("Paste the verification link or ID from the certificate. " + method.how);
    return result;
  }

  // c) a web link
  const host = hostOf(text);
  if (host) {
    if (method.domains.some(d => onDomain(host, d))) {
      if (method.path === "" || pathOf(text).includes(method.path)) {
        result.level = "green";
        result.verdict = "Official verification link";
        result.reasons.push("The link is on " + host + ", the official place to check " + cert.issuer + " certificates.");
        result.reasons.push("Last step: open it. If it shows the same name, certificate and date, the certificate is genuine.");
        result.page = text.startsWith("http") ? text : "https://" + text;
      } else {
        result.level = "amber";
        result.verdict = "Official site, but not a verification page";
        result.reasons.push("The link is on " + host + ", but a real verification link looks like this: " +
          method.domains[0] + method.path + "... " + method.how);
      }
      return result;
    }

    const allDomains = [];
    for (const key in methods) {
      for (const d of methods[key].domains) {
        if (!allDomains.includes(d)) allDomains.push(d);
      }
    }
    const copied = allDomains.find(d => looksLike(host, d));
    if (copied) {
      result.level = "red";
      result.verdict = "Look-alike website";
      result.reasons.push("\"" + host + "\" looks like " + copied + " but it is a different website. " +
        "Fake certificates often point to copy-cat sites, so treat this certificate as fake until checked.");
      return result;
    }

    const other = allDomains.find(d => onDomain(host, d));
    result.level = "amber";
    result.verdict = "Not the issuer's official site";
    if (other) {
      result.reasons.push("This is a " + other + " link, but " + cert.issuer + " certificates are checked through: " + method.name + ".");
    } else {
      result.reasons.push(host + " is not where " + cert.issuer + " certificates are checked. Ask for the official link. " + method.how);
    }
    return result;
  }

  // d) an ID / code
  if (method.idRe) {
    if (new RegExp(method.idRe).test(text)) {
      result.verdict = "ID looks right - confirm it";
      result.reasons.push("The ID has the right format. Enter it on the official page to see the holder's name and status.");
    } else {
      result.level = "amber";
      result.verdict = "ID doesn't match the format";
      result.reasons.push(cert.issuer + " IDs look like " + method.idHint + ". Check the number again, or treat the certificate as doubtful.");
    }
  } else {
    result.verdict = "Check the ID on the official page";
    result.reasons.push(method.how);
  }
  return result;
}

// ---------- 3. market value score ----------

// live = LIVE from data/live.js; returns the list of verified sources, or null if never looked up
function demandSources(cert, live) {
  if (!live || !live.certs || !live.certs[cert.id]) return null;
  const demand = live.certs[cert.id].demand;
  return Array.isArray(demand) ? demand : null;   // no list = demand not looked up yet (free refresh)
}

const ISSUER_POINTS = {
  vendor:   [2, "Issued by the company or body whose technology / field it tests."],
  academic: [2, "IIT / IISc course with a supervised university-style exam."],
  platform: [1, "Well-known learning platform, but anyone can enrol and finish."],
  unknown:  [0, "Not a known issuer - a recruiter can't tell what it proves."]
};

const ASSESS_POINTS = {
  proctored:  [2, "You must pass a supervised exam."],
  graded:     [1, "You pass online tests or projects, but nobody supervises them."],
  completion: [0, "You get it for finishing the videos or tasks - there is no test."],
  attendance: [0, "You get it just for attending."]
};

// demand labels in data/roles.js (each one comes from a cited report)
const DEMAND_POINTS = { "Growing fast": 2, "In demand": 2, "IT under pressure": 1 };

// the jobs a certificate leads to, with their demand (best one first)
function jobsFor(cert, roles, roleInfo) {
  const list = [];
  for (const id of cert.roles) {
    if (id === "all" || !roleInfo[id]) continue;
    const role = roles.find(r => r.id === id);
    list.push({ id: id, name: role ? role.name : id, info: roleInfo[id],
                points: DEMAND_POINTS[roleInfo[id].demand.label] || 0 });
  }
  list.sort((a, b) => b.points - a.points);
  return list;
}

function marketValue(cert, roles, roleInfo, live) {
  const checks = [];

  // check 1: who gives it
  const iss = ISSUER_POINTS[cert.issuerType];
  checks.push({ name: "Recognition (who gives it)", points: iss[0], max: 2, reason: iss[1] });

  // check 2: how you earn it
  const as = ASSESS_POINTS[cert.assessment];
  checks.push({ name: "Proof of skill (how you earn it)", points: as[0], max: 2, reason: as[1] });

  // check 3: is it in demand? verified sources from the monthly refresh first, otherwise demand for its jobs
  const jobs = jobsFor(cert, roles, roleInfo);
  const demand = demandSources(cert, live);
  if (cert.aliases.length === 0) {
    checks.push({ name: "Job demand", points: 0, max: 2,
      reason: cert.custom ? "An unknown issuer - employers are unlikely to ask for it."
                          : "Not a named credential, so employers can't ask for it." });
  } else if (demand !== null) {
    const pts = demand.length >= 2 ? 2 : demand.length;
    checks.push({ name: "Job demand", points: pts, max: 2, src: [],
      reason: demand.length === 0 ? "No verified source calls it in demand."
        : "Called in demand by " + demand.length + " verified source" + (demand.length > 1 ? "s" : "") + "." });
  } else if (jobs.length === 0) {
    checks.push({ name: "Job demand", points: 1, max: 2, reason: "Depends on the course you pick." });
  } else {
    const best = jobs[0];
    checks.push({ name: "Job demand", points: best.points, max: 2, src: best.info.demand.src,
      reason: "It leads to " + best.name + " jobs: " + best.info.demand.note });
  }

  let total = 0, max = 0;
  for (const c of checks) {
    total += c.points;
    max += c.max;
  }
  const percent = Math.round((total / max) * 100);

  let band, level;
  if (percent >= 70) { band = "High market value"; level = "green"; }
  else if (percent >= 45) { band = "Medium market value"; level = "amber"; }
  else { band = "Low market value"; level = "red"; }

  // things that matter more than the score
  let warning = null;
  if (cert.status === "closed") warning = "No longer offered - it can't be earned now.";
  else if (cert.eligibility) warning = "Not for freshers yet: " + cert.eligibility;

  return { cert: cert, checks: checks, total: total, max: max, percent: percent,
           band: band, level: level, warning: warning, jobs: jobs, demand: demand };
}

// ---------- a certificate that is NOT in our list ----------

// build a certificate from the user's answers, so marketValue() can score it.
// answers = { issuer: "vendor" | "academic" | "platform" | "unknown",
//             earned: "proctored" | "graded" | "completion" | "attendance",
//             field: a role id like "cloud", or "" }
function customCert(name, issuerName, answers) {
  return {
    id: "custom", custom: true, name: name, issuer: issuerName || "the issuer",
    issuerType: answers.issuer, assessment: answers.earned,
    costBand: "medium", costNote: "", roles: answers.field ? [answers.field] : ["all"],
    aliases: answers.issuer === "unknown" ? [] : [name.toLowerCase()],   // unknown issuer = not a named credential
    eligibility: null, status: "active", src: [], note: ""
  };
}

// genuineness for a certificate we don't know: we can't know the issuer's own website,
// so we look for a known verification site, a copy-cat site or a fake university
// hasLink = "yes" / "no" (the user's answer to "does it have a verification link or ID?")
function checkGenuineAny(input, hasLink, methods, fakeUnis) {
  const result = { level: "grey", verdict: "", reasons: [], method: null, page: null };

  if (input.issuer) {
    const fake = matchFakeUni(input.issuer, fakeUnis);
    if (fake) {
      result.level = "red";
      result.verdict = "Fake university";
      result.reasons.push("\"" + fake + "\" is on UGC's list of fake universities (February 2026). " +
        "Its degrees and certificates are not valid for jobs or higher studies.");
      return result;
    }
  }

  const text = (input.link || "").trim();
  if (text === "") {
    if (hasLink === "no") {
      result.level = "amber";
      result.verdict = "Can't be verified";
      result.reasons.push("A certificate with no verification link or ID has no record anyone can check. Anyone could have made it.");
    } else {
      result.verdict = "Not checked yet";
      result.reasons.push("Paste the verification link or ID printed on the certificate in step 2.");
    }
    return result;
  }

  const host = hostOf(text);
  if (!host) {
    result.verdict = "Check the ID with the issuer";
    result.reasons.push("We don't have this issuer's ID format. Enter the ID on the issuer's own website - " +
      "find that website yourself, not through a link on the certificate.");
    return result;
  }

  const allDomains = [];
  for (const key in methods) {
    for (const d of methods[key].domains) {
      if (!allDomains.includes(d)) allDomains.push(d);
    }
  }
  const known = allDomains.find(d => onDomain(host, d));
  if (known) {
    result.level = "green";
    result.verdict = "Known verification site";
    result.reasons.push("The link is on " + known + ", a site that issuers use to verify certificates.");
    result.reasons.push("Last step: open it. It should show the same name, certificate and issuer.");
    result.page = text.startsWith("http") ? text : "https://" + text;
    return result;
  }
  const copied = allDomains.find(d => looksLike(host, d));
  if (copied) {
    result.level = "red";
    result.verdict = "Look-alike website";
    result.reasons.push("\"" + host + "\" looks like " + copied + " but it is a different website. " +
      "Fake certificates often point to copy-cat sites, so treat this certificate as fake until checked.");
    return result;
  }
  result.verdict = "We don't know this website";
  result.reasons.push(host + " is not a verification site we know. Check that it really belongs to the issuer: " +
    "search for the issuer's official website yourself and compare the address.");
  return result;
}

// ---------- 4. higher-value certificates in the same field ----------

function costRank(cert) {
  return ["free", "low", "medium", "high"].indexOf(cert.costBand);
}

// up to `howMany` certificates that share a job with this one and score higher; cheaper first on a tie
function betterValue(cert, certs, roles, roleInfo, live, howMany) {
  const mine = marketValue(cert, roles, roleInfo, live);
  const fields = cert.roles.filter(r => r !== "all");
  const list = [];
  for (const c of certs) {
    if (c.id === cert.id || c.status === "closed" || c.eligibility) continue;
    // same field; for a general certificate (workshop, NPTEL...) suggest free / low-cost ones instead
    if (fields.length > 0 && !c.roles.some(r => fields.includes(r))) continue;
    if (fields.length === 0 && costRank(c) > 1) continue;
    const v = marketValue(c, roles, roleInfo, live);
    if (v.percent > mine.percent) list.push(v);
  }
  list.sort((a, b) => (b.percent - a.percent) || (costRank(a.cert) - costRank(b.cert)));
  return list.slice(0, howMany);
}

if (typeof module !== "undefined") {
  module.exports = { normalize, editDistance, rankCerts, findCert, hostOf, looksLike, matchFakeUni,
                     checkFile, pickLink, checkGenuine, demandSources, marketValue, betterValue,
                     customCert, checkGenuineAny, findInText, sameCert, applyLive };
}
