# CertWise (version 2) — is this certificate genuine, and what is it worth?

She Solves 3.0 · Team Ctrl Freaks · Track: Web & Software Development · Domain: Education

> This is the **Round 2 version**. The first version is at https://github.com/PersonalPurva/certwise
> (live at https://personalpurva.github.io/certwise/) and is unchanged. Version 2 adds: a **live check with the
> issuer**, a **text reader** for certificates with no QR code, **camera** QR scanning, checking **any**
> certificate with three questions, **13 more certificates**, a **downloadable PDF report**, tests on every push
> and a container file.

Students collect certificates but can't easily check two things: **is it genuine?** and **what is it worth in the
job market?** Every issuer verifies certificates in its own way (Credly badges, coursera.org/verify links,
NPTEL QR codes, Red Hat IDs...), copy-cat links can look official, and a perfectly genuine certificate can still
be worth very little. CertWise answers both questions in one check, with a source for every fact.

## Run it

- `npm start` and open http://localhost:5174 — this starts the page **and** the small API used by the live check.
- Tests: `npm test` (149 tests, no packages needed, never touches the real issuer websites).
- You can also double-click `index.html`. Everything works except the live check and the camera, which need the
  server (or https).
- In a container: `docker build -t certwise .` then `docker run -p 5174:5174 certwise`.

## Files

| File | What it does |
|---|---|
| `index.html`, `style.css`, `app.js` | The page: certificate name + verification link / ID / certificate file / camera + issuer → two answers |
| `logic.js` | **The core** — typo-tolerant search, the genuineness check, the market value score, the text reader's rules, higher-value picks |
| `serve.js` | The server: serves the page and the small API (`/api/health`, `/api/live`) |
| `api/live.js` | **Live check**: asks Credly, Coursera or edX whether a certificate exists, and reads the badge name, issuer and dates |
| `data/certs.js` | 44 certificates with checkable facts (issuer, exam type, price, eligibility, status) and proof links |
| `data/verify.js` | How each issuer verifies certificates (17 official methods, with proof) and UGC's fake university list |
| `data/roles.js` | The jobs a certificate leads to: demand and fresher salary, each with a source |
| `data/live.js` | Verified live facts written by the monthly refresh (empty until the first run) |
| `refresh/` | Monthly refresh: an AI (free Gemini or paid Claude) reads trusted pages; `verify.js` keeps a fact only if its exact quote is on the page |
| `.github/workflows/` | `ci.yml` runs the tests on every push; `refresh.yml` runs the monthly refresh |
| `Dockerfile` | A container for hosting the server |
| `tests/test_logic.js` | 149 automated tests; the `sample_*` files are made-up certificates for trying the upload |
| `project-log.html` | Everything we did, with the research and proof |

## 1. Is it genuine?

### First, in the browser (`checkGenuine` in logic.js)

| What we check | Result |
|---|---|
| The issuer is on UGC's list of 32 fake universities (Feb 2026) | **Fake university** |
| The certificate type has no official record (workshop, participation, paid "internship") | **Can't be verified** |
| The link is on the issuer's official verification site (credly.com/badges/..., coursera.org/verify/..., nptel.ac.in/noc/...) | **Official verification link** |
| The link is on the official site but not a verification page | **Official site, but not a verification page** |
| The link copies the issuer's name or is a small typo of it (coursera-verify.com, credlly.com) — found with edit distance | **Look-alike website** — treat as fake |
| Any other website | **Not the issuer's official site** |
| An ID in the right format (Red Hat 123-456-789) | **ID looks right — confirm it** on the official page |

### Then, live with the issuer (`api/live.js`, `applyLive` in logic.js)

When the link already looks official, the page asks our server, and the server asks the issuer itself:

| Issuer | What we ask | Real certificate | Made-up ID |
|---|---|---|---|
| Credly (AWS, Cisco, GitHub, Google Cloud, HashiCorp, Oracle...) | The badge's Open Badges record | Badge name, issuer, issue date, expiry | 404 |
| Coursera (course certificates) | The certificate for that code | 200 | 404, "Certificate code could not be found" |
| edX | The certificate page | 200 | 404 |

Results: **Confirmed by the issuer** · **No record at the issuer** · **Real, but a different certificate** (the
badge is for something else) · **Confirmed, but expired**. If the issuer gives no clear answer, our result is left
as it was — an unreadable answer never counts as "confirmed". The last step is still the issuer's own page, where
the holder's name is shown.

Safety: the server never fetches the link the user typed. It pulls out the ID, checks its format and builds the
issuer's address itself, so it can't be pointed at another website. It allows 30 checks a minute per address and
logs only the issuer and the answer, never the link. The link is sent in the request body, not in the web address.

The live check needs the server. On a static host like GitHub Pages the page still works; it just skips this step.

### Getting the link off the certificate

- **Upload a file:** PNG, JPG, WEBP or PDF, up to 5 MB (other types and bigger files are refused with a clear
  message — `checkFile`). Images and PDF pages are scanned for a QR code (jsQR, pdf.js).
- **No QR code?** The printed text is read instead (Tesseract OCR for images and scanned PDFs, pdf.js for normal
  PDFs) and searched for the certificate's name, a verification link, an ID like 123-456-789 and the name of a
  fake university (`findInText`). Whatever is found is filled into the form.
- **Camera:** `getUserMedia` opens the back camera and a frame is checked four times a second; the camera is
  switched off as soon as a code is found. Needs https or localhost.
- All of this runs in the browser — the file is never uploaded.

### Not in our list? (`customCert`, `checkGenuineAny`)

The user answers three questions — who issued it, how it was earned, whether it has a verification link or ID
(plus, optionally, which job it is for). The same score is worked out from those answers, and the result is
clearly marked *scored from your answers — we could not check those facts ourselves*.

## 2. What is it worth? (`marketValue` in logic.js)

Three checks, 0–2 points each:

| Check | 2 | 1 | 0 |
|---|---|---|---|
| Recognition (who gives it) | Company / body that owns the field, or an IIT | Learning platform | Unknown training company |
| Proof of skill (how you earn it) | Supervised exam | Online tests / projects | Attendance, or only finishing the videos / tasks |
| Job demand | ≥2 verified sources, or its jobs are "in demand" in cited reports | 1 source / "IT under pressure" / depends on the course | Not a credential employers ask for |

Score = points ÷ 6 → 70%+ High, 45–69% Medium, below 45% Low market value. We also show the price (with proof),
the fresher salary of the jobs it leads to (with sources), warnings (exam closed, needs work experience) and up to
three higher-value certificates in the same field. If the genuineness check finds a fake, the market value is 0%.

**Download report:** every result can be saved as a one-page PDF with clickable proof links (jsPDF, loaded only
when the button is pressed).

## How the data stays current (and honest)

The refresh runs with **one** of two keys (if both are set, the free one is used):

| | Free: `GEMINI_API_KEY` | Paid: `ANTHROPIC_API_KEY` |
|---|---|---|
| Where facts come from | Our script downloads the trusted pages already listed in our data; Gemini (`gemini-3.8-flash`) copies out the facts | Claude (`claude-opus-5-5`) searches the web and reads pages, so it can find new sources |
| What it updates | Price, status, salary, demand | The same, plus sources that say a certificate is in demand |
| Cost | ₹0 on the free tier | Pay per use |

Every fact comes back as `{value, url, quote}`. `refresh/verify.js` downloads the page itself and keeps the fact
only if the quote is on the page and every number in the value is inside the quote. Add the key as a repository
secret (Settings → Secrets and variables → Actions), then Actions → "Monthly data refresh" → Run workflow.
Never put a key in code, a commit or a chat.

## Demo script (about 3 minutes, with `npm start` running)

1. **AWS badge with a made-up ID** → *No record at the issuer*: the link is on the real Credly site, but Credly
   has no such badge. Paste a real public Credly badge link to see *Confirmed by the issuer* with its name and date.
2. **Look-alike Coursera link** (coursera-verify.com) → *Look-alike website* → market value 0% if fake.
3. Drop `tests/sample_text_cert.png` (no QR code) with the name box empty → the text is read, the name and link
   are filled in, and the check runs. `tests/sample_qr.pdf` shows the QR path.
4. **₹9 workshop** → *Can't be verified* + **0% Low market value** → higher-value picks.
5. **Fake university degree** → *Fake university* (UGC list, with proof).
6. **One not in our list** → answer the 3 questions → score, marked as based on your answers.
7. **Download report** on any result. On a phone: **Scan the QR code with your camera**.

## Answers to the obvious questions

- **Can you prove a certificate is genuine?** For Credly, Coursera and edX we ask the issuer directly and show its
  answer. For the others we prove the link points to the issuer's own record (or flag it as a copy-cat) and check
  the UGC list. The holder's name is always confirmed on the issuer's page — we never claim "100% genuine".
- **How is this different from the SIH25029 teams?** They check genuineness only (OCR / AI / blockchain on degree
  documents). We add the market value score and use each issuer's own verification, with no partnership needed.
- **Why is a genuine certificate scored low?** Genuine isn't valuable: a real ₹9 workshop certificate has no exam
  and no recognised issuer.
- **Is the upload safe?** The file never leaves the browser. Only the certificate's link is sent for a live check.
- **Who pays?** Free for students; placement cells could fund hosting. No commission from course sellers.
