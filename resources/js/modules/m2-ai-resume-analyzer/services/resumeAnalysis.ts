// Rule-based resume analysis. Pure functions only: no network, no external AI.
// Produces the analysis fields stored in public.resume.
//
// TODO (Shafinaz): bina semula LOGIC enjin skor ini. Semua kamus/regex di bawah ialah DATA dan sudah
// disimpan (SCORE_WEIGHTS, STOPWORDS, ACTION_VERBS/ACTION_VERB_SET, WEAK_PHRASES, BUZZWORDS, SKILL_KEYWORD_SET,
// HEADING_PATTERNS, SKILL_EVIDENCE, BULLET_RE, EMAIL_RE, LINK_RE, MONTHS_RE, PRIORITY_ORDER) — guna terus.
// Helper lain yang anda perlukan (sudah siap dalam resources/js/lib, jangan ubah):
//   import { clamp, scoreLabel } from "@/lib/format"
//       clamp(v, min = 0, max = 100); scoreLabel: >=80 "Excellent", >=65 "Strong foundation", >=50 "Developing", else "Needs work"
//   import { detectSkillTags, roleSkills, skillLabel } from "@/lib/skills"
//       detectSkillTags(text) -> tag skill yang keyword-nya muncul (padanan perkataan penuh, ikut urutan SKILLS)
//       roleSkills(role) -> senarai tag wajib untuk role (ROLE_SKILLS), default ["communication","problem-solving","leadership","excel"]
//       skillLabel(tag) -> label paparan
import { SKILLS } from "@/lib/skills"
import type { ResumeScores, ResumeSuggestion } from "@/lib/types"
import type { AnalyzeInput, ResumeAnalysis, SectionKey } from "../types"

export const SCORE_WEIGHTS: ResumeScores = { keywords: 0.3, impact: 0.25, structure: 0.2, clarity: 0.15, ats: 0.1 }

// ---------------------------------------------------------------------------
// Dictionaries
// ---------------------------------------------------------------------------

const STOPWORDS = new Set(
  (
    "a an and are as at be been being but by can could did do does for from had has have he her his how i if in into is it its " +
    "me my of on or our out over she so than that the their them then there these they this those to too up us was we were what " +
    "when where which while who whom why will with within without would you your yours also any all more most other some such " +
    "only own same very just about above after again against before below between both during each few further here once under " +
    "until able etc via per across among upon well within must should may might shall need needs needed using use used " +
    // job-description filler
    "job role roles position candidate candidates applicant applicants company team teams work working looking join seeking " +
    "experience experiences year years strong good excellent great ability abilities skills skill knowledge understanding " +
    "requirement requirements responsibilities responsibility qualification qualifications preferred plus bonus including include " +
    "includes related relevant degree minimum least familiar familiarity proficient proficiency demonstrated proven opportunity " +
    "opportunities environment fast paced dynamic passionate highly hands new key day daily based within across ensure support " +
    "provide make help across closely wide range well others other develop like want get able will apply successful benefits " +
    "salary malaysia kuala lumpur hybrid remote office full time part intern internship graduate fresh"
  ).split(/\s+/),
)

const ACTION_VERBS = [
  "led", "lead", "built", "build", "developed", "designed", "launched", "improved", "increased", "reduced", "analysed", "analyzed",
  "created", "implemented", "delivered", "managed", "organised", "organized", "achieved", "automated", "optimised", "optimized",
  "streamlined", "coordinated", "initiated", "established", "spearheaded", "conducted", "generated", "mentored", "negotiated",
  "presented", "resolved", "won", "drove", "grew", "saved", "cut", "boosted", "collaborated", "engineered", "deployed",
  "researched", "trained", "secured", "facilitated", "executed", "produced", "redesigned", "migrated", "integrated", "accelerated",
  "expanded", "headed", "supervised", "planned", "programmed", "tested", "evaluated", "identified", "maintained", "authored",
  "published", "raised", "recruited", "pioneered", "transformed", "championed", "shipped", "scaled", "modelled", "modeled",
]
const ACTION_VERB_SET = new Set(ACTION_VERBS)

const WEAK_PHRASES = [
  "responsible for",
  "helped with",
  "helped to",
  "assisted with",
  "assisted in",
  "duties included",
  "duties include",
  "worked on",
  "involved in",
  "tasked with",
  "participated in",
  "in charge of",
]

const BUZZWORDS = [
  "hardworking",
  "hard-working",
  "team player",
  "go-getter",
  "self-motivated",
  "detail-oriented",
  "results-driven",
  "think outside the box",
  "fast learner",
  "dynamic individual",
  "synergy",
]

const SKILL_KEYWORD_SET = new Set(SKILLS.flatMap((skill) => skill.keywords))

/** Section headings in English and Malay, tested against a normalised short line. */
const HEADING_PATTERNS: Record<Exclude<SectionKey, "contact">, RegExp> = {
  summary:
    /^((professional|career|personal|executive) )?(summary|profile|objective|objectives|overview|statement)\b|^about( me)?$|^(ringkasan|profil|objektif|tentang saya|ringkasan diri)\b/,
  experience:
    /^((work|professional|relevant|employment|career|industry|internship|working) )?(experience|experiences|history)\b|^(employment|internships?|industrial training|work history|career history)\b|^(pengalaman|latihan industri|sejarah pekerjaan)\b/,
  education:
    /^(education|educational background|academic|academics|academic background|academic qualifications?|qualifications)\b|^(pendidikan|kelayakan akademik|latar belakang pendidikan)\b/,
  skills:
    /^((technical|core|key|professional|soft|hard|relevant|computer|it) )?(skills|skill set|skillset|competencies|competences|expertise|proficiencies)\b|^(tools|technologies|tools (and|&) technologies|tech stack|languages)$|^(kemahiran|kebolehan)\b/,
  projects: /^((academic|personal|key|selected|relevant|side|final year) )?(projects?|portfolio)\b|^(projek|projek tahun akhir)\b/,
  certifications:
    /^(certifications?|certificates?|licen[cs]es?( (and|&) certifications?)?|awards?|honou?rs|achievements?|accomplishments|awards (and|&) achievements)\b|^(sijil|pensijilan|pencapaian|anugerah)\b/,
}

/** Concrete, role-relevant suggestions for adding evidence of a missing skill. */
const SKILL_EVIDENCE: Record<string, string> = {
  sql: "Add SQL evidence: mention a project where you queried data (joins, aggregations or window functions in MySQL/PostgreSQL) and the decision it informed.",
  "data-analysis": "Show data analysis: describe a dataset you cleaned and analysed, the tool you used (Excel, Python/pandas) and one insight it produced.",
  "data-visualization": "Show a dashboard you built in Tableau, Power BI or Looker Studio — who used it and what it helped them track.",
  excel: "Name concrete Excel skills (pivot tables, XLOOKUP/VLOOKUP, conditional formatting) and a task where they saved time.",
  statistics: "Add a statistics example: a regression, hypothesis test or significance check from coursework or a project, with the conclusion.",
  python: "Add a Python project line: the libraries used (pandas, NumPy, Flask…) and what the script or app achieved.",
  programming: "List your programming languages in the skills section and back one up with a project bullet describing what you built.",
  javascript: "Mention JavaScript/TypeScript work: a feature or app you built, the framework, and a measurable result (users, load time).",
  react: "Describe a React (or Vue/Angular) interface you built — the components, state management and who used it.",
  "web-development": "Add a web project with a link: the stack (HTML/CSS, REST API, backend) and what it does for users.",
  git: "Mention Git/GitHub: version control, pull requests or code reviews, and add your GitHub profile link to the header.",
  algorithms: "Reference data structures & algorithms practice — coursework, competitive programming or optimising code complexity.",
  "system-design": "Describe the architecture of something you built (APIs, database, cloud services such as AWS or Docker).",
  "product-management": "Show product work: a requirement, user story or roadmap item you owned, and the outcome after launch.",
  "product-analytics": "Add product metrics: a KPI you tracked (retention, conversion, DAU) and how your analysis moved it.",
  "ab-testing": "Mention an experiment: an A/B test you designed or analysed, the hypothesis and the result.",
  prioritization: "Show prioritisation: a time you ranked features or tasks (e.g. RICE, MoSCoW) and the trade-off you made.",
  agile: "Mention Agile/Scrum: sprints, stand-ups or Jira boards you worked with in a team project or internship.",
  "ux-design": "Add design evidence: wireframes or prototypes in Figma, a link to your portfolio, and a usability improvement.",
  "user-research": "Describe user research: interviews or surveys you ran, how many participants, and the insight you acted on.",
  communication: "Show communication with evidence: reports you wrote, stakeholders you briefed or presentations you delivered.",
  presentation: "Add a presentation example: a pitch, workshop or final-year presentation, the audience size and the outcome.",
  leadership: "Show leadership: a club, project team or event you led, the team size and what you delivered together.",
  "problem-solving": "Add a problem-solving story: an issue you diagnosed, the root cause and how your fix improved things.",
  "digital-marketing": "Add marketing results: a campaign or social account you ran, the channel and the reach/engagement/conversion numbers.",
  sales: "Show sales results: targets or quotas met, leads generated or deals closed, with numbers.",
  "customer-service": "Show customer service: volume handled, satisfaction score or a difficult case you resolved.",
}

// ---------------------------------------------------------------------------
// Regexes (data — kept)
// ---------------------------------------------------------------------------

const BULLET_RE = /^([•●▪◦‣∙·■►➢✓✔*–—\-o]|\d{1,2}[.)])\s+/
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
const LINK_RE = /(linkedin\.com|github\.com|behance\.net|portfolio|https?:\/\/)/i
const MONTHS_RE = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\b/gi

/** Suggestions are sorted High -> Medium -> Low (ties keep insertion order). */
const PRIORITY_ORDER: Record<ResumeSuggestion["priority"], number> = { High: 0, Medium: 1, Low: 2 }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
// TODO (Shafinaz): tulis semula helper berikut (private, tidak di-export):
//   escapeRegex(v)            -> escape aksara regex khas  . * + ? ^ $ { } ( ) | [ ] \ /
//   containsTerm(lower, term) -> RegExp(`(^|[^a-z0-9])${escapeRegex(term)}([^a-z0-9]|$)`, "i").test(lower)
//   words(text)               -> text.split(/\s+/) yang mengandungi sekurang-kurangnya satu huruf/nombor (/[\p{L}\p{N}]/u)
//   hasPhone(text)            -> ada padanan /\+?\d[\d\s().-]{7,16}\d/g yang mempunyai 9–15 digit DAN bukan julat tahun
//                                seperti "2019 - 2023" (/^(19|20)\d{2}\s*[-–]\s*(19|20)\d{2}$/)
//   normaliseHeading(line)    -> lowercase, buang bullet (BULLET_RE), ganti aksara selain huruf/space/&// dengan space
//                                (/[^\p{L}\s&/]/gu), gabung space, trim
//   headingKey(line)          -> null jika line.length > 50 atau heading ternormal kosong / > 6 perkataan;
//                                selain itu key pertama dalam HEADING_PATTERNS yang padan
//   stripBullet(line)         -> buang BULLET_RE di awal, trim
//   isQuantified(line)        -> true jika /\d+(\.\d+)?\s?%|\bRM\s?\d|\$\s?\d|\b\d+(\.\d+)?\s?(k|m|x)\b/i padan;
//                                selain itu buang tahun (\b(19|20)\d{2}\b), bulan (MONTHS_RE), nombor telefon
//                                (/\+?\d[\d\s().-]{7,16}\d/g) dan "CGPA/GPA x.xx(/4.00)", kemudian true jika masih ada /\b\d+\b/
//   firstWord(line)           -> perkataan pertama huruf a-z (lowercase) selepas stripBullet, atau ""
//   truncate(v, max = 70)     -> jika lebih panjang: v.slice(0, max - 1).trimEnd() + "…"
//   pct(part, total)          -> total ? part / total : 0
//   termInResume(lower, term) -> containsTerm untuk term + varian:
//                                  berakhir "s" & panjang > 4 -> tanpa "s"; selain itu + "s"
//                                  berakhir "ing" & panjang > 6 -> tanpa "ing"
//                                  berakhir "e" -> +"d", +"s", "e"->"ing"; selain itu jika tidak berakhir "s" -> +"ed", +"ing"
//                                  berakhir "ysis" -> "yse", "ysed", "yze", "yzed"

/** Top meaningful terms of a job description (frequency, then first appearance). */
export function extractJobTerms(jobDescription: string, limit = 15): string[] {
  // TODO (Shafinaz):
  // 1. tokens = jobDescription.toLowerCase().match(/[a-z][a-z0-9+#.]*[a-z0-9+#]/g) ?? []
  // 2. Untuk setiap token (buang titik di hujung): abaikan jika panjang < 3, ada dalam STOPWORDS, atau nombor sahaja.
  //    Kira count dan index kemunculan pertama.
  // 3. Susun count menurun, kemudian kemunculan pertama menaik; ambil `limit` teratas; pulangkan term sahaja.
  void [jobDescription, limit]
  return []
}

export function countWords(text?: string | null) {
  // TODO (Shafinaz): return text ? words(text).length : 0
  void text
  return 0
}

export function analyzeResume({ text, targetRole, jobDescription }: AnalyzeInput): ResumeAnalysis {
  // TODO (Shafinaz): algoritma asal (ikut tepat supaya skor sama):
  //
  // 0. SEDIAAN: resume = text.trim(); lower = resume.toLowerCase(); jd = (jobDescription ?? "").trim();
  //    wordCount = words(resume).length; lines = resume.split("\n") -> gabung whitespace, trim, buang yang kosong.
  //
  // 1. SECTIONS (semua false dahulu: contact, summary, experience, education, skills, projects, certifications)
  //    hasEmail = EMAIL_RE.test; phone = hasPhone(resume); hasLink = LINK_RE.test; sections.contact = hasEmail || phone.
  //    Setiap line yang headingKey(line) != null -> sections[key] = true dan simpan index-nya (headingLines).
  //
  // 2. KLASIFIKASI BARIS: bulletLines = lines yang padan BULLET_RE.
  //    contentLines = lines yang BUKAN heading, TIDAK mengandungi email/telefon, dan >= 5 perkataan.
  //
  // 3. KEYWORDS (skor "keywords")
  //    detected = detectSkillTags(resume); roleTags = roleSkills(targetRole);
  //    jdTags = jd ? detectSkillTags(jd) yang tiada dalam roleTags : []; requiredTags = [...roleTags, ...jdTags].
  //    Berat: 3 tag pertama roleTags = 2, tag role lain = 1, tag dari JD = 1.
  //    skillCoverage = pct(berat dipadan, jumlah berat). matchedTags / missingTags ikut urutan requiredTags.
  //    jdTerms (jika jd): extractJobTerms(jd, 25), buang term yang ialah perkataan dalam tajuk role (split /\s+/),
  //      dan buang term yang ialah keyword (SKILLS[].keywords) bagi matchedTags DAN sudah ada dalam resume; ambil 15.
  //    matchedTerms / missingTerms = jdTerms yang ada / tiada dalam resume (termInResume).
  //    termCoverage = jdTerms.length ? matched / jdTerms.length : skillCoverage.
  //    keywordCoverage = jd ? skillCoverage * 0.6 + termCoverage * 0.4 : skillCoverage.
  //    keywords = round(clamp(10 + 90 * keywordCoverage)).
  //    matched_keywords = [...matchedTags.map(skillLabel), ...matchedTerms]
  //    missing_keywords = [...missingTags.map(skillLabel), ...missingTerms]
  //
  // 4. IMPACT (skor "impact")
  //    impactLines = contentLines (jika kosong: lines dengan >= 3 perkataan).
  //    quantifiedLines = isQuantified; actionStartLines = firstWord dalam ACTION_VERB_SET;
  //    actionAnywhere = baris yang mana-mana perkataannya (huruf a-z sahaja) ada dalam ACTION_VERB_SET.
  //    weakHits: untuk SETIAP line (semua lines), WEAK_PHRASES pertama yang ada ->
  //      { phrase, line: ayat (stripBullet, split /(?<=[.!?])\s+/) yang mengandungi frasa, atau seluruh baris }.
  //    quantRatio = pct(quantified, impactLines); actionRatio = pct(actionStart + 0.5 * (actionAnywhere - actionStart), impactLines).
  //    impact = 25 + min(1, quantRatio / 0.35) * 35 + min(1, actionRatio / 0.5) * 30
  //             + 10 jika quantified >= 3 DAN actionStart >= 3
  //             - min(25, weakHits * 5);  jika impactLines < 3 -> impact = min(impact, 40).  round(clamp()).
  //
  // 5. STRUCTURE (skor "structure")
  //    contact +15; experience +15 (jika tiada experience tapi ada projects +8); education +15; skills +15;
  //    summary +8; projects +8; certifications +4;
  //    wordCount 300–900 +12; 200–299 atau 901–1200 +6; > 1200 +2;
  //    bulletLines >= 3 +8, >= 1 +4.  round(clamp()).
  //
  // 6. CLARITY (skor "clarity")
  //    sentences = contentLines -> stripBullet -> split /(?<=[.!?])\s+/ -> bilangan perkataan, simpan yang >= 3.
  //    avgSentence = purata (0 jika tiada). firstPerson = kiraan /\b(i|me|my|mine|myself|saya)\b/g dalam lower;
  //    firstPersonRate = pct(firstPerson, wordCount) * 100. longLines = lines > 40 perkataan.
  //    buzzwordsFound = BUZZWORDS yang ada dalam lower.
  //    repeatedWords: token /[a-z][a-z'-]{3,}/g dari contentLines (lowercase), abaikan STOPWORDS, SKILL_KEYWORD_SET dan
  //      perkataan tajuk role; threshold = max(5, ceil(wordCount * 0.012)); 3 teratas (count menurun) yang >= threshold.
  //    clarity = 100 - (avg > 25 ? min(25, (avg - 25) * 2) : 0) - (rate > 1.5 ? min(20, (rate - 1.5) * 6) : 0)
  //              - min(16, longLines * 4) - min(15, repeated * 5) - min(12, buzzwords * 3) - (tiada sentences ? 20 : 0).
  //    round(clamp(clarity, 20, 100))   <- minimum 20!
  //
  // 7. ATS (skor "ats")
  //    nonSpace = resume tanpa whitespace;
  //    specialChars = nonSpace selepas buang /[\p{L}\p{N}.,;:()'"’‘“”\-–—/&%+@#$|•●▪◦*!?_]/gu;
  //    specialRatio = pct(special, nonSpace); tableHints = bilangan "|" dalam resume + bilangan "\t" dalam `text` asal;
  //    tableLike = tableHints > 15.
  //    ats = (hasEmail ? 20 : 0) + (phone ? 10 : 0) + 12 × bilangan benar [experience || projects, education, skills]
  //          + (specialRatio < 0.015 ? 20 : specialRatio < 0.04 ? 10 : 0) + 14 * keywordCoverage
  //          - (tableLike ? 10 : 0) - (wordCount < 150 ? 10 : 0).  round(clamp()).
  //
  // 8. OVERALL = round(clamp( Σ scores[k] * SCORE_WEIGHTS[k] ))  (keywords .30, impact .25, structure .20, clarity .15, ats .10)
  //
  // 9. STRENGTHS (ikut urutan, simpan 6 pertama). Syarat -> teks asal:
  //    skillCoverage >= 0.6      -> `Strong skill alignment — covers ${matchedTags.length} of ${requiredTags.length} key skills for ${targetRole}.`
  //    else matchedTags.length   -> `Relevant skills present — ${3 label pertama, ", "} already match ${targetRole}.`
  //    quantified >= 3           -> `Quantified achievements — ${n} lines include numbers, which recruiters scan for first.`
  //    actionStart >= 3          -> `Action-oriented writing — ${n} lines open with strong verbs such as "${firstWord(baris pertama)}".`
  //    contact+experience+education+skills semua ada -> "Complete core structure — contact, experience, education and skills sections are all present."
  //    wordCount 300–900         -> `Good length — ${wordCount} words fits on one to two pages.`
  //    projects                  -> "Projects section — gives concrete proof of skills, valuable for early-career candidates."
  //    hasLink                   -> "Online presence — includes a LinkedIn, GitHub or portfolio link."
  //    jd && termCoverage >= 0.6 -> `Tailored to the job post — ${matchedTerms.length} of ${jdTerms.length} job-description terms appear.`
  //    clarity >= 85 && sentences >= 5 -> "Clear, concise sentences that are easy to skim."
  //    WEAKNESSES (ikut urutan, simpan 6 pertama):
  //    missingTags.length        -> `Missing key skills — no evidence of ${3 label pertama}${> 3 ? " and more" : ""}.`
  //    !contact                  -> "No contact details detected — add an email address and phone number at the top."
  //    !experience && !projects  -> "No experience or projects section — recruiters cannot see what you have done."
  //    quantified < 2            -> "Few measurable results — most lines describe tasks rather than outcomes."
  //    weakHits.length           -> `Passive phrasing — "${weakHits[0].phrase}" appears ${n} time${n > 1 ? "s" : ""}.`
  //    wordCount < 250           -> `Too brief — only ${wordCount} words; most strong resumes have 300–900.`
  //    else wordCount > 1100     -> `Too long — ${wordCount} words; trim to the most relevant 1–2 pages.`
  //    bullets < 3               -> "Few bullet points — dense paragraphs are harder for recruiters and ATS to scan."
  //    firstPersonRate > 1.5     -> `Heavy first-person use — "I/my" appears ${firstPerson} times.`
  //    avgSentence > 25          -> `Long sentences — average of ${Math.round(avgSentence)} words per sentence.`
  //    repeatedWords.length      -> `Repetitive wording — "${repeatedWords.join('", "')}" used many times.`
  //    jd && jdTerms.length && termCoverage < 0.4 -> `Low job-post match — only ${matched} of ${total} key job-description terms appear.`
  //    specialRatio >= 0.04 || tableLike -> "Formatting may confuse ATS — many symbols, tables or columns detected."
  //
  // 10. SUGGESTIONS { title, detail, priority } — tambah ikut urutan ini, kemudian susun ikut PRIORITY_ORDER
  //    (seri -> urutan asal) dan ambil 9 pertama. Syarat | priority | title | detail:
  //    !contact | High | "Add contact details" | "Put your email, phone number and LinkedIn URL in the header so recruiters and ATS can reach you."
  //    else !hasEmail | High | "Add an email address" | "ATS systems look for an email address in the header — add a professional one."
  //    3 missingTags pertama | High jika tag dalam 3 pertama roleTags ATAU index 0, selain itu Medium | `Show ${label} evidence` |
  //      SKILL_EVIDENCE[tag] ?? `Add evidence of ${label}: describe a project, internship or course where you used it and the result.`
  //    !experience && !projects | High | "Add an experience or projects section" |
  //      "Include internships, part-time work, final-year or personal projects. For each, add 2–4 bullets: what you did, how, and the result."
  //    quantRatio < 0.25 | impact < 50 ? High : Medium | "Quantify your achievements" |
  //      ada contoh: `Add a number to "${truncate(stripBullet(contoh))}" — e.g. users served, hours saved, % improvement or RM value.`
  //      tiada:      "Add numbers to your bullets — users served, hours saved, % improvement, team size or RM value."
  //      (contoh = actionStartLine pertama yang tidak quantified, ATAU impactLine tidak quantified, <= 30 perkataan, bukan baris weakHit)
  //    weakHits | Medium | "Replace passive phrases" |
  //      `Rewrite "${truncate(weakHits[0].line)}" as an achievement: start with a verb like Led, Built or Improved, then state the result.`
  //    else actionRatio < 0.3 && impactLines >= 3 | Medium | "Start bullets with action verbs" |
  //      'Open each bullet with a strong verb (Built, Analysed, Launched, Reduced) instead of a noun or "I".'
  //    jd && missingTerms | termCoverage < 0.4 ? High : Medium | "Mirror the job description" |
  //      `Where it is truthful, work these job-post terms into your bullets or skills: ${5 term pertama, ", "}.`
  //    !summary | Medium | "Add a targeted summary" |
  //      `Write 2–3 lines at the top: who you are, your strongest ${targetRole}-relevant skills, and the role you are seeking.`
  //    !skills | Medium | "Add a skills section" | `List tools and skills relevant to ${targetRole} under a clear "Skills" heading so ATS can match them.`
  //    !education | Medium | "Add your education" | "Include your institution, qualification, field of study, graduation year and CGPA if it is 3.0 or above."
  //    wordCount < 250 | Medium | "Expand your content" |
  //      `At ${wordCount} words the resume is thin. Add projects, coursework, activities or achievements to reach 300+ words.`
  //    else > 1100 | Medium | "Trim to the essentials" |
  //      `At ${wordCount} words it is long. Remove older or unrelated items and keep the most relevant 1–2 pages.`
  //    bullets < 3 | Medium | "Use bullet points" | "Break paragraphs into 3–5 bullets per role or project — each one a single achievement."
  //    !projects && (!experience || wordCount < 400) | Medium | "Add a projects section" |
  //      `Projects prove ${targetRole} skills when work experience is limited — include the tools used and the outcome.`
  //    firstPersonRate > 1.5 | Low | "Drop first-person pronouns" |
  //      'Resumes use implied first person: write "Built a dashboard…" instead of "I built a dashboard…".'
  //    avgSentence > 25 | Low | "Shorten long sentences" | "Keep bullets under about 20 words: one action, one method, one result."
  //    repeatedWords | Low | "Vary your wording" | `Replace some uses of "${repeatedWords[0]}" with more specific verbs or terms.`
  //    buzzwords | Low | "Replace clichés with evidence" | `Instead of "${buzzwordsFound[0]}", show the trait through a concrete example or result.`
  //    specialRatio >= 0.04 || tableLike | Low | "Simplify formatting" |
  //      "Avoid tables, text boxes, icons and multi-column layouts — use a single column with standard headings."
  //    !hasLink | Low | "Add a LinkedIn or portfolio link" | "A LinkedIn, GitHub or portfolio URL lets recruiters verify your work quickly."
  //    !certifications | Low | "Add certifications or awards" |
  //      `Relevant certificates (e.g. online courses for ${targetRole}) and awards strengthen early-career profiles.`
  //    suggestions.length < 3 | Low | "Tailor for each application" | "Paste the job description before analysing to see exactly which terms to add for that role."
  //
  // 11. SUMMARY: `Your resume scores ${overall}/100 for ${targetRole} (${scoreLabel(overall).toLowerCase()}). ` +
  //     `It shows ${matchedTags.length} of ${requiredTags.length} key skills` +
  //     (jd && jdTerms.length ? ` and ${matchedTerms.length} of ${jdTerms.length} job-description terms` : "") +
  //     `. Strongest area: <skor tertinggi>; biggest opportunity: <skor terendah>` +
  //     (ada suggestion ? ` — start with "<title pertama, lowercase>".` : ".")
  //     Nama dimensi: keyword match, impact, structure, clarity, ATS readability.
  //
  // 12. return { overall_score, scores: { ats, keywords, impact, structure, clarity }, detected_skills: detected,
  //     matched_keywords, missing_keywords, sections, strengths, weaknesses, suggestions, summary }
  void [text, targetRole, jobDescription]
  const sections: Record<SectionKey, boolean> = {
    contact: false,
    summary: false,
    experience: false,
    education: false,
    skills: false,
    projects: false,
    certifications: false,
  }
  const scores: ResumeScores = { ats: 0, keywords: 0, impact: 0, structure: 0, clarity: 0 }
  return {
    overall_score: 0,
    scores,
    detected_skills: [],
    matched_keywords: [],
    missing_keywords: [],
    sections,
    strengths: [],
    weaknesses: [],
    suggestions: [],
    summary: null,
  }
}
