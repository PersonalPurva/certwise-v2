// CertWise API - live check with the issuer
//
// The browser can't ask Credly / Coursera / edX directly (their sites don't allow it), so this small
// server-side helper does. It answers one question: does the issuer have a record of this certificate?
//
// Safety: we never fetch the link the user typed. We only pull the certificate ID out of it, check
// its format, and build the issuer's address ourselves - so the server can't be tricked into
// fetching some other website.

const UA = { "User-Agent": "CertWise-livecheck/2.0 (student project)", "Accept": "*/*" };
// Credly only sends the data record (not a web page) when we ask for JSON alone
const JSON_ONLY = { "User-Agent": UA["User-Agent"], "Accept": "application/json" };

// "https://www.credly.com/badges/<id>/public_url" -> { issuer: "credly", id: "<id>", ask: "<issuer address>" }
// returns null when we have no live check for this kind of link
function liveTarget(link) {
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(link.trim()) ? link.trim() : "https://" + link.trim());
  } catch (e) {
    return null;
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const parts = url.pathname.split("/").filter(p => p.length > 0);

  // Credly badge: /badges/<36-character id>
  if ((host === "credly.com" || host === "youracclaim.com") && parts[0] === "badges" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parts[1] || "")) {
    return { issuer: "credly", id: parts[1].toLowerCase(),
             ask: "https://www.credly.com/api/v1/obi/v2/badge_assertions/" + parts[1].toLowerCase() };
  }

  // Coursera course certificate: /verify/<CODE> or /account/accomplishments/verify/<CODE>
  // (specialization and professional-certificate links use a different check, so we leave those alone)
  if (host === "coursera.org") {
    const at = parts.indexOf("verify");
    const code = at >= 0 ? parts[at + 1] : "";
    if (at >= 0 && parts.length === at + 2 && /^[A-Z0-9]{8,16}$/.test(code)) {
      return { issuer: "coursera", id: code, ask: "https://www.coursera.org/api/certificate.v1/pdf/" + code };
    }
    return null;
  }

  // edX certificate: courses.edx.org/certificates/<32 hex characters>
  if (host === "courses.edx.org" && parts[0] === "certificates" && /^[0-9a-f]{32}$/i.test(parts[1] || "")) {
    return { issuer: "edx", id: parts[1].toLowerCase(), ask: "https://courses.edx.org/certificates/" + parts[1].toLowerCase() };
  }
  return null;
}

async function getJson(address, fetcher) {
  const res = await fetcher(address, { headers: JSON_ONLY, signal: AbortSignal.timeout(12000) });
  return res.ok ? await res.json() : null;
}

// returns { supported, issuer, exists, details }
//   supported: false -> we have no live check for this link
//   exists: true / false / null (null = the issuer did not give a clear answer)
//   details: for Credly, what the issuer's record says (badge name, issuer name, dates)
async function liveCheck(link, fetcher) {
  fetcher = fetcher || fetch;
  const target = liveTarget(link);
  if (!target) return { supported: false };
  const result = { supported: true, issuer: target.issuer, exists: null, details: {} };

  let res;
  try {
    res = await fetcher(target.ask, { headers: target.issuer === "credly" ? JSON_ONLY : UA, signal: AbortSignal.timeout(12000) });
  } catch (e) {
    return result;                       // the issuer's site didn't answer in time
  }

  if (res.status === 404 || res.status === 410) {
    result.exists = false;
  } else if (res.status === 200 && target.issuer === "credly") {
    // an Open Badges record: issue date, expiry, and a link to the badge's name and issuer.
    // "exists" is only true once we have actually read the record
    let record;
    try {
      record = await res.json();
    } catch (e) {
      return result;                     // not a record we can read: no clear answer
    }
    if (!record || typeof record !== "object" || !record.badge) return result;
    result.exists = true;
    result.details.issuedOn = String(record.issuedOn || "").slice(0, 10);
    if (record.expires) result.details.expires = String(record.expires).slice(0, 10);
    try {
      const badge = typeof record.badge === "string" && record.badge.startsWith("https://www.credly.com/")
        ? await getJson(record.badge, fetcher) : record.badge;
      if (badge && badge.name) {
        result.details.badgeName = badge.name;
        const iss = typeof badge.issuer === "string" && badge.issuer.startsWith("https://www.credly.com/")
          ? await getJson(badge.issuer, fetcher) : badge.issuer;
        if (iss && iss.name) result.details.issuerName = iss.name;
      }
    } catch (e) {
      // the badge exists, but its name could not be read - leave those details out
    }
  } else if (res.status === 200) {
    result.exists = true;
    if (res.body && res.body.cancel) res.body.cancel();   // Coursera sends the whole PDF: we only needed to know it exists
  }
  return result;
}

module.exports = { liveTarget, liveCheck };
