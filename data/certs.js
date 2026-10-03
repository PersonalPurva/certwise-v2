// CertWise - certificate data
// Each certificate only stores facts a student can check on the official page.
//
// issuerType : "vendor"   = the company / body whose technology or field it tests (AWS, Red Hat, CompTIA, ISC2...)
//              "academic" = IIT / IISc / university exam (NPTEL)
//              "platform" = online learning platform certificate (Coursera, freeCodeCamp, HackerRank...)
//              "unknown"  = training company / event organiser
// assessment : "proctored"  = supervised exam
//              "graded"     = online tests or projects, nobody supervises
//              "completion" = you get it for finishing the course (videos / tasks), no test
//              "attendance" = you get it for attending
// costBand   : "free" | "low" (under Rs 2,000) | "medium" (Rs 2,000 - 10,000) | "high" (above Rs 10,000)
// roles      : dev, web, cloud, sec, data, ai   ("all" = depends on which course you pick)
// aliases    : lowercase words we search for inside job posts
// keywords   : (optional) extra words only for the search box
// eligibility: null, or what you need before you are allowed to sit the exam
// status     : "active" or "closed"
// src        : proof links - the official page and a source for any special claim in the note
//
// IMPORTANT: prices change. Check every costNote on the official page before the demo
// and update CHECKED_ON below.

const CHECKED_ON = "2026-10-03 (each price matches the linked page)";

const ROLES = [
  { id: "dev",   name: "Software Developer" },
  { id: "web",   name: "Web Developer" },
  { id: "cloud", name: "Cloud / DevOps" },
  { id: "sec",   name: "Cybersecurity" },
  { id: "data",  name: "Data Analyst" },
  { id: "ai",    name: "AI / ML" }
];

const CERTS = [
  // ---------- Cloud / DevOps ----------
  {
    id: "aws-ccp", name: "AWS Certified Cloud Practitioner", issuer: "Amazon Web Services",
    issuerType: "vendor", assessment: "proctored", costBand: "medium",
    costNote: "Exam fee USD 100", roles: ["cloud"],
    aliases: ["aws certified cloud practitioner", "cloud practitioner", "clf-c02"],
    eligibility: null, status: "active",
    src: [
      { name: "AWS exam page", url: "https://aws.amazon.com/certification/certified-cloud-practitioner/" }
    ],
    note: "Entry-level cloud exam. Do a small AWS project first so the certificate has something behind it."
  },
  {
    id: "aws-saa", name: "AWS Certified Solutions Architect - Associate", issuer: "Amazon Web Services",
    issuerType: "vendor", assessment: "proctored", costBand: "high",
    costNote: "Exam fee USD 150", roles: ["cloud", "dev"],
    aliases: ["solutions architect associate", "aws certified solutions architect", "saa-c03", "aws saa"],
    eligibility: null, status: "active",
    src: [
      { name: "AWS exam page", url: "https://aws.amazon.com/certification/certified-solutions-architect-associate/" }
    ],
    note: "Better in 2nd or 3rd year, after hands-on AWS work."
  },
  {
    id: "aws-ai", name: "AWS Certified AI Practitioner", issuer: "Amazon Web Services",
    issuerType: "vendor", assessment: "proctored", costBand: "medium",
    costNote: "Exam fee USD 100", roles: ["ai", "cloud"],
    aliases: ["aws certified ai practitioner", "ai practitioner", "aif-c01"],
    eligibility: null, status: "active",
    src: [
      { name: "AWS exam page", url: "https://aws.amazon.com/certification/certified-ai-practitioner/" }
    ],
    note: "A real exam on AI basics - compare this with a paid 'AI tools' workshop certificate."
  },
  {
    id: "az-900", name: "Microsoft Azure Fundamentals (AZ-900)", issuer: "Microsoft",
    issuerType: "vendor", assessment: "proctored", costBand: "medium",
    costNote: "Exam fee (lower regional price in India)", roles: ["cloud"],
    aliases: ["az-900", "azure fundamentals"],
    eligibility: null, status: "active",
    src: [
      { name: "Microsoft Learn exam page", url: "https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/" }
    ],
    note: "Entry-level Azure exam."
  },
  {
    id: "az-104", name: "Microsoft Azure Administrator (AZ-104)", issuer: "Microsoft",
    issuerType: "vendor", assessment: "proctored", costBand: "medium",
    costNote: "Exam fee (regional price in India)", roles: ["cloud"],
    aliases: ["az-104", "azure administrator"],
    eligibility: null, status: "active",
    src: [
      { name: "Microsoft Learn exam page", url: "https://learn.microsoft.com/en-us/credentials/certifications/azure-administrator/" }
    ],
    note: "Meant for people who run Azure systems day to day."
  },
  {
    id: "gcp-cdl", name: "Google Cloud Digital Leader", issuer: "Google Cloud",
    issuerType: "vendor", assessment: "proctored", costBand: "medium",
    costNote: "Registration fee USD 99 (plus tax)", roles: ["cloud"],
    aliases: ["cloud digital leader"],
    eligibility: null, status: "active",
    src: [
      { name: "Google Cloud exam page", url: "https://cloud.google.com/learn/certification/cloud-digital-leader" }
    ],
    note: "Mostly concepts, not hands-on."
  },
  {
    id: "rhcsa", name: "Red Hat Certified System Administrator (RHCSA, EX200)", issuer: "Red Hat",
    issuerType: "vendor", assessment: "proctored", costBand: "high",
    costNote: "Rs 20,000 + 18% GST in India (USD 500 elsewhere), includes one free retake", roles: ["cloud", "sec"],
    aliases: ["rhcsa", "red hat certified system administrator", "ex200"],
    eligibility: null, status: "active",
    src: [
      { name: "Red Hat exam page", url: "https://www.redhat.com/en/services/certification/rhcsa" },
      { name: "RHCSA price in India (PassItExams)", url: "https://passitexams.com/articles/rhcsa-certification-cost/" }
    ],
    note: "Performance-based exam: you do real tasks on a Linux system."
  },
  {
    id: "cka", name: "Certified Kubernetes Administrator (CKA)", issuer: "Linux Foundation / CNCF",
    issuerType: "vendor", assessment: "proctored", costBand: "high",
    costNote: "Exam fee USD 445 (exam only)", roles: ["cloud"],
    aliases: ["cka", "certified kubernetes administrator"],
    eligibility: null, status: "active",
    src: [
      { name: "Linux Foundation exam page", url: "https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/" }
    ],
    note: "Advanced - learn Linux and Docker first."
  },
  {
    id: "terraform", name: "HashiCorp Certified: Terraform Associate", issuer: "HashiCorp",
    issuerType: "vendor", assessment: "proctored", costBand: "medium",
    costNote: "Exam fee USD 70.50", roles: ["cloud"],
    aliases: ["terraform associate", "hashicorp certified"],
    eligibility: null, status: "active",
    src: [
      { name: "HashiCorp certifications page", url: "https://developer.hashicorp.com/certifications" },
      { name: "Terraform Associate exam fee (Certland)", url: "https://certland.net/blog/hashicorp-terraform-associate-004-study-guide-2026/" }
    ],
    note: "Useful once you already use a cloud platform."
  },

  // ---------- Cybersecurity ----------
  {
    id: "secplus", name: "CompTIA Security+ (SY0-701)", issuer: "CompTIA",
    issuerType: "vendor", assessment: "proctored", costBand: "high",
    costNote: "Exam voucher USD 439 (list price since June 2026)", roles: ["sec"],
    aliases: ["security+", "security plus", "comptia security", "sy0-701"],
    eligibility: null, status: "active",
    src: [
      { name: "CompTIA exam page", url: "https://www.comptia.org/en-us/certifications/security/" },
      { name: "Security+ price (HackerDNA, 2026)", url: "https://hackerdna.com/blog/security-plus-certification-cost" }
    ],
    note: "Common entry-level security exam."
  },
  {
    id: "isc2-cc", name: "ISC2 Certified in Cybersecurity (CC)", issuer: "ISC2",
    issuerType: "vendor", assessment: "proctored", costBand: "high",
    costNote: "Exam USD 199 + USD 50 yearly fee. The free-exam offer ended on 20 May 2026.",
    roles: ["sec"],
    aliases: ["certified in cybersecurity", "isc2 cc", "(isc)2 cc"],
    eligibility: null, status: "active",
    src: [
      { name: "ISC2 CC page", url: "https://www.isc2.org/certifications/cc" },
      { name: "ISC2: free-exam program ending", url: "https://www.isc2.org/insights/2026/04/one-million-certified-cyber-conclusion" },
      { name: "CC price after the free program (Training Camp)", url: "https://trainingcamp.com/articles/isc2-cc-certification-guide-2026-exam-domains-cost-and-what-its-worth/" },
      { name: "ISC2 yearly fee (AMF)", url: "https://www.isc2.org/AMFs-Overview" }
    ],
    note: "This used to be free - a good example of why certificate advice gets out of date."
  },
  {
    id: "ceh", name: "Certified Ethical Hacker (CEH)", issuer: "EC-Council",
    issuerType: "vendor", assessment: "proctored", costBand: "high",
    costNote: "Exam voucher USD 950 - 1,199, plus a USD 100 application fee if you skip official training", roles: ["sec"],
    aliases: ["ceh", "certified ethical hacker"],
    eligibility: "Needs EC-Council official training, or 2 years of security work experience.",
    status: "active",
    src: [
      { name: "EC-Council CEH page", url: "https://www.eccouncil.org/train-certify/certified-ethical-hacker-ceh/" },
      { name: "EC-Council eligibility rules", url: "https://cert.eccouncil.org/application-process-eligibility.html" },
      { name: "CEH voucher price (Simplilearn)", url: "https://www.simplilearn.com/ceh-certification-cost-article" },
      { name: "CEH application fee (Readynez)", url: "https://www.readynez.com/en/blog/ceh-exam-cost-price-breakdown/" }
    ],
    note: "Not a first-year purchase - read the eligibility rules first."
  },
  {
    id: "cissp", name: "CISSP", issuer: "ISC2",
    issuerType: "vendor", assessment: "proctored", costBand: "high",
    costNote: "Exam fee USD 749", roles: ["sec"],
    aliases: ["cissp"],
    eligibility: "Needs 5 years of paid security work experience.",
    status: "active",
    src: [
      { name: "ISC2 CISSP page", url: "https://www.isc2.org/certifications/cissp" },
      { name: "ISC2 experience requirements", url: "https://www.isc2.org/certifications/cissp/cissp-experience-requirements" },
      { name: "CISSP exam fee (ExamCert)", url: "https://www.examcert.app/blog/cissp-exam-cost-2026/" }
    ],
    note: "A senior-level certification."
  },
  {
    id: "ccna", name: "Cisco CCNA (200-301)", issuer: "Cisco",
    issuerType: "vendor", assessment: "proctored", costBand: "high",
    costNote: "Exam fee USD 300", roles: ["sec", "cloud"],
    aliases: ["ccna", "cisco certified network associate"],
    eligibility: null, status: "active",
    src: [
      { name: "Cisco CCNA page", url: "https://www.cisco.com/site/us/en/learn/training-certifications/certifications/enterprise/ccna/index.html" }
    ],
    note: "Networking basics that security and cloud jobs build on."
  },
  {
    id: "netacad", name: "Cisco Networking Academy free course (e.g. Introduction to Cybersecurity)",
    issuer: "Cisco Networking Academy",
    issuerType: "platform", assessment: "graded", costBand: "free",
    costNote: "Free (official course page)", roles: ["sec"],
    aliases: ["networking academy", "netacad"],
    eligibility: null, status: "active",
    src: [
      { name: "Cisco NetAcad course page", url: "https://www.netacad.com/courses/introduction-to-cybersecurity" }
    ],
    note: "Good free starting point before paying for any security exam."
  },
  {
    id: "google-cyber", name: "Google Cybersecurity Professional Certificate (Coursera)", issuer: "Google, via Coursera",
    issuerType: "platform", assessment: "graded", costBand: "medium",
    costNote: "Coursera subscription; financial aid available", roles: ["sec"],
    aliases: ["google cybersecurity certificate", "google cybersecurity professional"],
    eligibility: null, status: "active",
    src: [
      { name: "Coursera course page", url: "https://www.coursera.org/professional-certificates/google-cybersecurity" }
    ],
    note: "Online course with practice-based assessments - no supervised exam is mentioned."
  },

  // ---------- Data / AI ----------
  {
    id: "google-data", name: "Google Data Analytics Professional Certificate (Coursera)", issuer: "Google, via Coursera",
    issuerType: "platform", assessment: "graded", costBand: "medium",
    costNote: "Coursera subscription; financial aid available", roles: ["data"],
    aliases: ["google data analytics"],
    eligibility: null, status: "active",
    src: [
      { name: "Coursera course page", url: "https://www.coursera.org/professional-certificates/google-data-analytics" }
    ],
    note: "Pair it with your own data project."
  },
  {
    id: "pl-300", name: "Microsoft Power BI Data Analyst (PL-300)", issuer: "Microsoft",
    issuerType: "vendor", assessment: "proctored", costBand: "medium",
    costNote: "Exam fee (regional price in India)", roles: ["data"],
    aliases: ["pl-300", "power bi data analyst"],
    eligibility: null, status: "active",
    src: [
      { name: "Microsoft Learn exam page", url: "https://learn.microsoft.com/en-us/credentials/certifications/data-analyst-associate/" }
    ],
    note: "A real, supervised exam on Power BI."
  },
  {
    id: "ml-spec", name: "Machine Learning Specialization (DeepLearning.AI & Stanford, Coursera)",
    issuer: "DeepLearning.AI, via Coursera",
    issuerType: "platform", assessment: "graded", costBand: "medium",
    costNote: "Coursera subscription; financial aid available", roles: ["ai", "data"],
    aliases: ["machine learning specialization", "deeplearning.ai"],
    eligibility: null, status: "active",
    src: [
      { name: "Coursera course page", url: "https://www.coursera.org/specializations/machine-learning-introduction" }
    ],
    note: "Great for learning - build your own ML projects alongside it, they show what you can do."
  },
  {
    id: "kaggle", name: "Kaggle Learn course certificate", issuer: "Kaggle",
    issuerType: "platform", assessment: "graded", costBand: "free",
    costNote: "No fee shown on the official page", roles: ["data", "ai"],
    aliases: ["kaggle learn"],
    eligibility: null, status: "active",
    src: [
      { name: "Kaggle Learn", url: "https://www.kaggle.com/learn" }
    ],
    note: "Short free courses with coding exercises."
  },
  {
    id: "tf-dev", name: "TensorFlow Developer Certificate", issuer: "Google (TensorFlow team)",
    issuerType: "vendor", assessment: "proctored", costBand: "medium",
    costNote: "No longer sold", roles: ["ai"],
    aliases: ["tensorflow developer certificate"],
    eligibility: null, status: "closed",
    src: [
      { name: "Official TensorFlow certificate page", url: "https://www.tensorflow.org/certificate" }
    ],
    note: "The official TensorFlow page says the exam has been closed, so it cannot be earned now."
  },

  // ---------- Programming / Web ----------
  {
    id: "nptel", name: "NPTEL course certificate (IITs / IISc, via SWAYAM)", issuer: "NPTEL (IITs and IISc)",
    issuerType: "academic", assessment: "proctored", costBand: "low",
    costNote: "Course is free; exam fee Rs 500 - 1,000 depending on the course", roles: ["all"],
    aliases: ["nptel", "swayam"],
    eligibility: null, status: "active",
    src: [
      { name: "NPTEL", url: "https://nptel.ac.in/" },
      { name: "NPTEL exam fee and certificate rules (Careers360)", url: "https://www.careers360.com/exams/nptel" }
    ],
    note: "Proctored exam. Ask your college whether it accepts NPTEL / SWAYAM credits, and pick the course that matches your role."
  },
  {
    id: "oracle-java-found", name: "Oracle Java Foundations (1Z0-811)", issuer: "Oracle",
    issuerType: "vendor", assessment: "proctored", costBand: "medium",
    costNote: "Price set per country - see the Oracle exam page", roles: ["dev"],
    aliases: ["1z0-811", "java foundations"],
    eligibility: null, status: "active",
    src: [
      { name: "Oracle exam page", url: "https://education.oracle.com/java-foundations/pexam_1Z0-811" }
    ],
    note: "Beginner Java exam."
  },
  {
    id: "oracle-java-se", name: "Oracle Certified Professional: Java SE 17 Developer (1Z0-829)", issuer: "Oracle",
    issuerType: "vendor", assessment: "proctored", costBand: "high",
    costNote: "Exam fee about USD 245 in most countries", roles: ["dev"],
    aliases: ["1z0-829", "java se 17 developer", "oracle certified professional"],
    eligibility: null, status: "active",
    src: [
      { name: "Oracle exam page", url: "https://education.oracle.com/java-se-17-developer/pexam_1Z0-829" },
      { name: "Oracle OCP exam cost (PassItExams)", url: "https://passitexams.com/articles/oracle-certifications-cost/" }
    ],
    note: "Hard exam - only worth it if you will work in Java."
  },
  {
    id: "meta-fe", name: "Meta Front-End Developer Professional Certificate (Coursera)", issuer: "Meta, via Coursera",
    issuerType: "platform", assessment: "graded", costBand: "medium",
    costNote: "Coursera subscription; financial aid available", roles: ["web"],
    aliases: ["meta front-end developer", "meta front end developer"],
    eligibility: null, status: "active",
    src: [
      { name: "Coursera course page", url: "https://www.coursera.org/professional-certificates/meta-front-end-developer" }
    ],
    note: "Your portfolio site will matter more than the certificate."
  },
  {
    id: "fcc", name: "freeCodeCamp certification (e.g. Responsive Web Design)", issuer: "freeCodeCamp",
    issuerType: "platform", assessment: "graded", costBand: "free",
    costNote: "No fee shown on the official page", roles: ["web", "dev"],
    aliases: ["freecodecamp"],
    eligibility: null, status: "active",
    src: [
      { name: "freeCodeCamp curriculum", url: "https://www.freecodecamp.org/learn" },
      { name: "freeCodeCamp: certifications are project-based", url: "https://www.freecodecamp.org/news/freecodecamp-certifications/" }
    ],
    note: "The certifications are project-based - and those projects are what you show recruiters."
  },
  {
    id: "hackerrank", name: "HackerRank skill certificate (e.g. Problem Solving)", issuer: "HackerRank",
    issuerType: "platform", assessment: "graded", costBand: "free",
    costNote: "No fee shown on the official page", roles: ["dev"],
    aliases: ["hackerrank certified", "hackerrank certification", "hackerrank certificate"],
    eligibility: null, status: "active",
    src: [
      { name: "HackerRank skills verification", url: "https://www.hackerrank.com/skills-verification" }
    ],
    note: "An online skills test - fine to take, but your coding practice matters more."
  },
  {
    id: "springboard", name: "Infosys Springboard course certificate", issuer: "Infosys Springboard",
    issuerType: "platform", assessment: "graded", costBand: "free",
    costNote: "No fee shown on the official page", roles: ["dev", "web", "data"],
    aliases: ["infosys springboard"],
    eligibility: null, status: "active",
    src: [
      { name: "Infosys Springboard", url: "https://infyspringboard.onwingspan.com/" }
    ],
    note: "Free courses with online tests."
  },

  // ---------- More platforms and exams (added in version 2, each fact checked on 3 Oct 2026) ----------
  {
    id: "udemy", name: "Udemy course certificate of completion", issuer: "Udemy",
    issuerType: "platform", assessment: "completion", costBand: "low",
    costNote: "Paid courses only - the price depends on the course (free courses give no certificate)", roles: ["all"],
    aliases: ["udemy"],
    eligibility: null, status: "active",
    src: [
      { name: "Udemy: certificates of completion FAQ", url: "https://support.udemy.com/hc/en-us/articles/14291607637015-Certificates-of-Completion-Frequently-Asked-Questions" }
    ],
    note: "Udemy itself says it \"is not an accredited institution\". Good for learning - show a project you built with it."
  },
  {
    id: "linkedin-learning", name: "LinkedIn Learning certificate of completion", issuer: "LinkedIn Learning",
    issuerType: "platform", assessment: "completion", costBand: "medium",
    costNote: "Needs a LinkedIn Learning subscription", roles: ["all"],
    aliases: ["linkedin learning"],
    eligibility: null, status: "active",
    src: [
      { name: "LinkedIn help: certificates of completion", url: "https://www.linkedin.com/help/learning/answer/a705867" }
    ],
    note: "You get it after watching all the videos of a course - there is no test."
  },
  {
    id: "edx", name: "edX verified certificate", issuer: "edX (with the university that runs the course)",
    issuerType: "platform", assessment: "graded", costBand: "medium",
    costNote: "A single course from about USD 50", roles: ["all"],
    aliases: ["edx"],
    eligibility: null, status: "active",
    src: [
      { name: "edX: verified certificates", url: "https://www.edx.org/verified-certificate" }
    ],
    note: "Includes graded assignments. Pick the course that matches the job you want."
  },
  {
    id: "ibm-ds", name: "IBM Data Science Professional Certificate (Coursera)", issuer: "IBM, via Coursera",
    issuerType: "platform", assessment: "graded", costBand: "medium",
    costNote: "Coursera subscription; financial aid available", roles: ["data", "ai"],
    aliases: ["ibm data science"],
    eligibility: null, status: "active",
    src: [
      { name: "Coursera course page", url: "https://www.coursera.org/professional-certificates/ibm-data-science" }
    ],
    note: "Pair it with your own data project."
  },
  {
    id: "great-learning", name: "Great Learning Academy course certificate", issuer: "Great Learning",
    issuerType: "platform", assessment: "graded", costBand: "low",
    costNote: "Course content is free; certificates need an Academy Pro+ subscription (Rs 999 a month incl. GST)", roles: ["all"],
    aliases: ["great learning", "greatlearning"],
    eligibility: null, status: "active",
    src: [
      { name: "Great Learning Academy", url: "https://www.mygreatlearning.com/academy" }
    ],
    note: "Short courses with quizzes - fine for a first look at a topic."
  },
  {
    id: "internshala", name: "Internshala Trainings certificate", issuer: "Internshala Trainings",
    issuerType: "platform", assessment: "graded", costBand: "low",
    costNote: "Many 4-8 week trainings are listed at Rs 999 (list price Rs 2,999)", roles: ["all"],
    aliases: ["internshala"],
    eligibility: null, status: "active",
    src: [
      { name: "Internshala Trainings", url: "https://trainings.internshala.com/" },
      { name: "How a training is completed (quizzes, final exam)", url: "https://trainings.internshala.com/web-development-course/" }
    ],
    note: "Has quizzes, module tests and a final exam - but it is a training certificate, not an internship."
  },
  {
    id: "tcs-ion", name: "TCS iON Career Edge - Young Professional", issuer: "TCS iON",
    issuerType: "platform", assessment: "graded", costBand: "free",
    costNote: "Free (official course page)", roles: ["all"],
    aliases: ["tcs ion", "career edge", "young professional"],
    eligibility: null, status: "active",
    src: [
      { name: "TCS iON course page", url: "https://www.tcsion.com/courses/career-edge-young-professional/" }
    ],
    note: "A free 15-day course on communication and job-readiness skills with an end-of-course assessment - it is not a technical certificate."
  },
  {
    id: "ai-900", name: "Microsoft Azure AI Fundamentals (AI-900)", issuer: "Microsoft",
    issuerType: "vendor", assessment: "proctored", costBand: "medium",
    costNote: "Exam fee depends on the country (see the official page)", roles: ["ai", "cloud"],
    aliases: ["ai-900", "azure ai fundamentals"],
    eligibility: null, status: "active",
    src: [
      { name: "Microsoft Learn exam page", url: "https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-fundamentals/" }
    ],
    note: "Entry-level exam on AI concepts and Azure AI services."
  },
  {
    id: "github-found", name: "GitHub Foundations certification", issuer: "GitHub",
    issuerType: "vendor", assessment: "graded", costBand: "medium",
    costNote: "USD 99; the fee is waived for students verified through GitHub Education", roles: ["dev", "web"],
    aliases: ["github foundations", "gh-900"],
    eligibility: null, status: "active",
    src: [
      { name: "GitHub blog: fee waived for students, non-proctored exam", url: "https://github.blog/news-insights/company-news/students-start-building-your-skills-with-the-github-foundations-certification" },
      { name: "GitHub Foundations price (Fast Lane)", url: "https://www.flane.ch/certification/ghf" }
    ],
    note: "GitHub's blog says the student exam is non-proctored. Free for verified students, so it costs only your time."
  },
  {
    id: "gcp-ace", name: "Google Cloud Associate Cloud Engineer", issuer: "Google Cloud",
    issuerType: "vendor", assessment: "proctored", costBand: "high",
    costNote: "Registration fee USD 125 (plus tax)", roles: ["cloud"],
    aliases: ["associate cloud engineer"],
    eligibility: null, status: "active",
    src: [
      { name: "Google Cloud exam page", url: "https://cloud.google.com/learn/certification/cloud-engineer" }
    ],
    note: "Hands-on Google Cloud work first - this is the step after Cloud Digital Leader."
  },
  {
    id: "aws-dva", name: "AWS Certified Developer - Associate", issuer: "Amazon Web Services",
    issuerType: "vendor", assessment: "proctored", costBand: "high",
    costNote: "Exam fee USD 150", roles: ["cloud", "dev"],
    aliases: ["aws certified developer", "developer associate", "dva-c02"],
    eligibility: null, status: "active",
    src: [
      { name: "AWS exam page", url: "https://aws.amazon.com/certification/certified-developer-associate/" }
    ],
    note: "Better after you have built and deployed something on AWS."
  },
  {
    id: "forage", name: "Forage job simulation certificate", issuer: "Forage",
    issuerType: "platform", assessment: "completion", costBand: "free",
    costNote: "Free (official page)", roles: ["all"],
    aliases: ["forage"], keywords: "job simulation virtual experience programme",
    eligibility: null, status: "active",
    src: [
      { name: "Forage", url: "https://www.theforage.com/" }
    ],
    note: "You compare your work with model answers - nobody grades it. Useful to try out a job, not as proof of skill."
  },
  {
    id: "simplilearn", name: "Simplilearn SkillUp free course certificate", issuer: "Simplilearn",
    issuerType: "platform", assessment: "completion", costBand: "free",
    costNote: "Free (official SkillUp page)", roles: ["all"],
    aliases: ["simplilearn", "skillup"],
    eligibility: null, status: "active",
    src: [
      { name: "Simplilearn SkillUp", url: "https://www.simplilearn.com/skillup-free-online-courses" }
    ],
    note: "A completion certificate for a free course."
  },

  // ---------- Common low-value types (no company names on purpose) ----------
  {
    id: "workshop", name: "Paid live workshop / webinar certificate (Rs 9 - Rs 499 type)", issuer: "Training company",
    issuerType: "unknown", assessment: "attendance", costBand: "low",
    costNote: "Small entry fee", roles: ["all"],
    aliases: [], keywords: "workshop webinar masterclass live session ai tools",
    eligibility: null, status: "active",
    src: [
      { name: "ASCI study of edtech ads (Storyboard18)", url: "https://www.storyboard18.com/how-it-works/31-out-of-100-edtech-ads-made-superlative-claims-asci-report-12731.htm" }
    ],
    note: "An attendance certificate does not show you can do anything. Edtech ads often make claims they can't back up - if you liked the topic, find a free course with a graded test or a real exam instead."
  },
  {
    id: "participation", name: "Certificate of participation (seminar / webinar / event)", issuer: "Event organiser",
    issuerType: "unknown", assessment: "attendance", costBand: "free",
    costNote: "Free", roles: ["all"],
    aliases: [], keywords: "participation seminar webinar event fest",
    eligibility: null, status: "active",
    src: [],
    note: "Attend for learning if you like - it doesn't need a line on your resume."
  },
  {
    id: "paid-internship", name: "'Internship' or 'training' certificate that you pay for", issuer: "Training company",
    issuerType: "unknown", assessment: "attendance", costBand: "medium",
    costNote: "Fee asked from the student", roles: ["all"],
    aliases: [], keywords: "internship training paid virtual",
    eligibility: null, status: "active",
    src: [
      { name: "IIT Roorkee warning (Careers360)", url: "https://news.careers360.com/iit-roorkee-fake-internship-scam-warning-third-party-training-fraud-students-launched-global-spark-ihub" }
    ],
    note: "Real internships pay you, not the other way round. IIT Roorkee has publicly warned students about fake paid training and internship programmes."
  }
];

// lets the Node test script read the same data
if (typeof module !== "undefined") {
  module.exports = { CERTS, ROLES, CHECKED_ON };
}
