import type {
  InterviewType,
  Difficulty,
  Language,
  Persona,
  QuestionItem,
  QuestionSource,
  ResumeContext,
} from "../types"

/* ------------------------------------------------------------------------ */
/* Roles                                                                    */
/* ------------------------------------------------------------------------ */

/** The 6 role chips shown on the setup page, in this order. */
export const ROLE_CHIPS = [
  "Associate Product Analyst",
  "Software Engineer",
  "Data Analyst",
  "Product Manager",
  "UX Designer",
  "Customer Support",
] as const

type RoleChip = (typeof ROLE_CHIPS)[number]

/** Keep for compatibility: ROLE_CHIPS plus "Marketing Specialist", "Sales Representative", "Business Analyst". */
export const AVAILABLE_ROLES: string[] = [
  ...ROLE_CHIPS,
  "Marketing Specialist",
  "Sales Representative",
  "Business Analyst",
]

/** Lower-cased, whitespace-collapsed role names (and aliases) mapped to a chip role with its own bank. */
const ROLE_ALIASES: Record<string, RoleChip> = {
  "associate product analyst": "Associate Product Analyst",
  "product analyst": "Associate Product Analyst",
  "software engineer": "Software Engineer",
  "software developer": "Software Engineer",
  "data analyst": "Data Analyst",
  "product manager": "Product Manager",
  "ux designer": "UX Designer",
  "ui/ux designer": "UX Designer",
  "ux/ui designer": "UX Designer",
  "customer support": "Customer Support",
  "customer support specialist": "Customer Support",
}

function resolveRole(role: string): RoleChip | null {
  const key = role.trim().toLowerCase().replace(/\s+/g, " ")
  return ROLE_ALIASES[key] ?? null
}

/* ------------------------------------------------------------------------ */
/* Question banks                                                           */
/* ------------------------------------------------------------------------ */

interface BankQuestion {
  d: Difficulty
  t: string
  /** Natural opening question; placed first when selected. */
  opener?: boolean
}

interface TypeBank {
  general: BankQuestion[]
  roles: Partial<Record<RoleChip, BankQuestion[]>>
}

type LanguageBank = Record<InterviewType, TypeBank>

const E = (t: string): BankQuestion => ({ d: "Easy", t })
const M = (t: string): BankQuestion => ({ d: "Medium", t })
const H = (t: string): BankQuestion => ({ d: "Hard", t })
const OPEN = (t: string): BankQuestion => ({ d: "Easy", t, opener: true })

const BANK_EN: LanguageBank = {
  hr: {
    general: [
      OPEN("Tell me about yourself and what attracted you to this role."),
      E("What are your key strengths, and what is one area you are actively working to improve?"),
      E("Why are you interested in joining our company over other opportunities?"),
      E("What do you enjoy doing outside of work or study, and what has it taught you?"),
      M("Describe a challenging work situation or tight deadline and how you handled the pressure."),
      M("Where do you see your career going in the next three to five years?"),
      M("What type of workplace culture and management style helps you perform at your best?"),
      M("How do you handle disagreements or different perspectives when working within a multidisciplinary team?"),
      H("What are your salary expectations for this role, and how did you arrive at that figure?"),
      H("Tell me about a gap or a change of direction in your resume. What happened, and what did you learn from it?"),
      H("If you received two offers, ours and another with higher pay, how would you decide which one to accept?"),
      H("What would your previous supervisor or lecturer say is the hardest thing about working with you?"),
      H("Why should we hire you instead of another candidate with more experience?"),
    ],
    roles: {
      "Associate Product Analyst": [
        E("What product do you use every day, and what is one thing you would measure to know whether it is doing well?"),
        M("Why do you want to start your career as a product analyst rather than in a pure data or business role?"),
      ],
      "Software Engineer": [
        E("What got you into software engineering, and what kind of engineering work energises you most?"),
        M("How do you keep your technical skills up to date outside of your job or coursework?"),
      ],
      "Data Analyst": [
        E("What draws you to working with data, and what kind of questions do you enjoy answering?"),
        M("How do you see the data analyst role changing in the next few years, and how are you preparing for it?"),
      ],
      "Product Manager": [
        M("Why product management, and what in your background prepares you for it?"),
        H("Product managers often have responsibility without authority. How do you feel about that, and how would you work with it?"),
      ],
      "UX Designer": [
        E("What got you interested in UX design, and which product do you think has a great user experience?"),
        M("How do you react when users or stakeholders strongly dislike a design you are proud of?"),
      ],
      "Customer Support": [
        E("Why do you want to work in customer support, and what does good service mean to you?"),
        M("Support work can involve shifts, weekends and public holidays. How do you manage your energy and stay motivated?"),
      ],
    },
  },
  behavioral: {
    general: [
      E("Tell me about a time you worked in a team to complete a project. What was your contribution?"),
      E("Describe a time you learned a new skill or tool quickly to get something done."),
      E("Give an example of a time you helped a teammate or classmate who was struggling."),
      M("Describe a challenging project you contributed to. What was your specific role and the measurable outcome?"),
      M("Tell me about a time you had a conflict with a teammate or stakeholder. How did you resolve it?"),
      M("Give an example of an ambitious goal you set for yourself and the steps you took to achieve it."),
      M("Describe a time a project did not go according to plan. What lessons did you learn from the setback?"),
      H("Tell me about a time you had to persuade team members or clients to adopt your recommended approach."),
      H("Describe a decision you made with incomplete information. How did it turn out, and what would you change?"),
      H("Tell me about a mistake you made that affected other people. How did you handle it, and what did you change afterwards?"),
      H("Describe a situation where you had to push back on a request from someone more senior than you."),
    ],
    roles: {
      "Associate Product Analyst": [
        E("Tell me about a time you used data to answer a question or make a decision, even a small one."),
        E("Describe a time you had to explain a number or a chart to someone who found it confusing."),
        E("Tell me about a time you were curious about why something happened and dug into it on your own."),
        M("Tell me about a project where you used data or metrics to improve a product or an operational process."),
        M("Describe a time you received critical feedback on an analysis. How did you respond?"),
        M("Walk me through a situation where you had to present complex findings to non-technical business leaders."),
        H("How have you prioritised product features or bug fixes when stakeholders had competing requirements?"),
        H("Tell me about a time you identified an unmet user need and turned it into actionable user stories."),
        H("Describe a time your analysis led to a recommendation that turned out to be wrong. What did you do next?"),
      ],
      "Software Engineer": [
        E("Tell me about a coding project, at work, at university or on your own, that you enjoyed building. What was your part?"),
        E("Describe a time you had to learn a new language or framework quickly for a project."),
        E("Tell me about a time you asked for help on a technical problem. How did you decide when to ask?"),
        M("Describe a challenging bug or performance bottleneck you investigated and resolved."),
        M("Walk me through a situation where you disagreed with a technical design decision. How was it resolved?"),
        M("Describe a project where you introduced or improved automated testing or a CI/CD pipeline."),
        H("Tell me about a time you had to balance shipping code quickly against keeping the architecture clean."),
        H("Tell me about a time you mentored a junior engineer or pushed for better code review practices."),
        H("Describe a production incident you were involved in. What was your role, and what changed afterwards?"),
      ],
      "Data Analyst": [
        E("Tell me about a report or dashboard you built. Who used it, and what did they use it for?"),
        E("Describe a time you found an error in a spreadsheet or report. What did you do about it?"),
        E("Tell me about a time you had to learn a new data tool, such as Power BI, Tableau or Python, for a task."),
        M("Walk me through an end-to-end analytics project, from data extraction and cleaning to dashboard delivery."),
        M("Describe a situation where the data was messy, incomplete or contradictory. How did you handle it?"),
        M("Tell me about a time someone asked you for data without a clear question. How did you find out what they really needed?"),
        H("Tell me about a time your insights influenced an important business decision."),
        H("Describe a time your analysis showed something stakeholders did not want to hear. How did you present it?"),
        H("Tell me about a time you had to deliver an analysis under a very tight deadline. What did you cut, and why?"),
      ],
      "Product Manager": [
        E("Tell me about a product you love and one feature you would change. Why?"),
        E("Describe a time you organised a group of people to deliver something on time."),
        E("Tell me about a time you talked to users or customers to understand a problem."),
        M("Tell me about a time you had to say no to a feature request from an important stakeholder."),
        M("Describe a product or feature you launched. How did you decide it was ready, and how did you measure success?"),
        M("Describe a time you had to change a plan halfway because new information came in."),
        H("Tell me about a time you had to trade off scope, quality and deadline. What did you choose, and why?"),
        H("Describe a situation where engineering, design and business teams disagreed on direction. How did you align them?"),
        H("Tell me about a product decision you made that turned out badly. What did you learn?"),
      ],
      "UX Designer": [
        E("Walk me through a design project in your portfolio. What problem were you solving?"),
        E("Tell me about a time you received feedback on your design. What did you change?"),
        E("Tell me about a time you designed something for people very different from yourself."),
        M("Describe a time user research changed your original design direction."),
        M("Tell me about a time you had to balance user needs with business goals or technical limits."),
        M("Describe how you presented a design to stakeholders and handled their questions."),
        H("Describe a time a developer or product manager pushed back on your design. How did you handle it?"),
        H("Tell me about a design decision that did not work well once it was live. What did you learn?"),
        H("Tell me about a time you had to design under a very tight deadline. What did you compromise on?"),
      ],
      "Customer Support": [
        E("Tell me about a time you helped a customer or a member of the public with a problem."),
        E("Describe a time you had to stay patient with someone who was frustrated."),
        E("Tell me about a time you went the extra mile for someone."),
        M("Tell me about a time you dealt with an angry customer. What did you say, and how did it end?"),
        M("Describe a time you could not give a customer what they wanted. How did you handle it?"),
        M("Describe a time you worked with another team to solve a customer's problem."),
        H("Tell me about a time you noticed a recurring customer complaint and helped fix the root cause."),
        H("Describe a time you had many urgent tickets or calls at once. How did you prioritise?"),
        H("Tell me about a time you made a mistake with a customer. How did you put it right?"),
      ],
    },
  },
  technical: {
    general: [
      E("What is the most important tool or method in your workflow, and why do you prefer it?"),
      E("Explain a complex concept in your field as if you were explaining it to a non-technical colleague."),
      E("Which software or tools are you most comfortable with, and how did you learn them?"),
      M("How do you structure your problem-solving process when facing an ambiguous problem with missing information?"),
      M("Describe how you test, validate and check your work before handing it over to stakeholders."),
      M("Tell me about a time you had to troubleshoot a problem you had never seen before. What steps did you take?"),
      M("How do you organise your work and documentation so someone else could pick it up if you were away?"),
      H("Describe a project you are proud of from a planning and execution point of view. What trade-offs did you make?"),
      H("If you were given a task in an area you know very little about, with a one-week deadline, how would you approach it?"),
      H("How would you measure whether a piece of work you delivered actually achieved its goal?"),
      H("Tell me about a technical decision you later realised was wrong. How did you fix it?"),
    ],
    roles: {
      "Associate Product Analyst": [
        E("What is the difference between daily active users and retention, and why would you track both?"),
        E("How would you build a simple funnel to see where users drop off in a food delivery app's checkout?"),
        E("How would you explain conversion rate to a new teammate, and how is it calculated?"),
        M("Explain the difference between leading and lagging indicators using a realistic customer funnel example."),
        M("If qualitative user feedback conflicts with analytics data, how do you decide what is true?"),
        M("Which core metrics, such as acquisition cost, lifetime value, retention, churn or NPS, would you monitor for a subscription app, and why?"),
        H("How would you design an A/B test for a new onboarding flow? Explain the hypothesis, sample size and success metrics."),
        H("How would you investigate a sudden drop in a mobile app's weekly active users?"),
        H("How would you estimate the opportunity of adding a buy now, pay later option to an e-commerce checkout?"),
      ],
      "Software Engineer": [
        E("What happens, step by step, when you type a URL into a browser and press Enter?"),
        E("What is the difference between git merge and git rebase, and when would you use each?"),
        E("What is the difference between a stack and a queue? Give a real use for each."),
        M("Explain how RESTful API design differs from GraphQL or RPC, and when you would choose each."),
        M("Describe how you handle asynchronous state, concurrency and caching in a modern web app."),
        M("How do you decide what to cover with unit tests and what to cover with integration tests?"),
        H("How do you design database indexes for high-throughput queries, and what are the trade-offs?"),
        H("Walk me through how you would secure a web application against common OWASP Top 10 risks such as SQL injection, XSS, CSRF and broken authentication."),
        H("How would you design a system that sends payment reminders to a very large number of users without overloading your servers?"),
      ],
      "Data Analyst": [
        E("What is the difference between an INNER JOIN and a LEFT JOIN? Give an example of when you would use each."),
        E("Which chart would you use to show monthly sales over a year, and which would you avoid? Why?"),
        E("How would you remove duplicate rows from a dataset, in Excel or in SQL?"),
        M("How do you ensure data accuracy, validate assumptions and avoid misleading conclusions?"),
        M("Walk me through a SQL query you wrote using window functions such as ROW_NUMBER, LAG or LEAD with PARTITION BY."),
        M("Explain the difference between OLTP and OLAP systems, including star and snowflake schemas."),
        H("How do you detect anomalies or outliers in time-series data without throwing away valuable signals?"),
        H("Sales went up after a marketing campaign. How would you check whether the campaign actually caused it?"),
        H("How would you design a dashboard for a retail chain's regional managers? What goes on the first screen, and why?"),
      ],
      "Product Manager": [
        E("How would you write a good user story for a feature that lets users save items to a wishlist?"),
        E("What is the difference between an MVP and a full product launch?"),
        E("What would you include in a simple product requirements document for a new feature?"),
        M("How would you prioritise a backlog of twenty feature requests? Which framework would you use, and why?"),
        M("Which metrics would you track for an e-wallet app in Malaysia, and which one would be your north star metric?"),
        M("How would you define success for a new referral programme in a ride-hailing app?"),
        H("Checkout conversion dropped after a redesign. Walk me through how you would diagnose it and decide whether to roll back."),
        H("How would you decide whether to build a feature in-house, buy a third-party tool or partner with another company?"),
        H("Engineering tells you the release is two weeks behind. How would you decide what to cut?"),
      ],
      "UX Designer": [
        E("What is the difference between UX design and UI design?"),
        E("What is a wireframe, and when would you use a low-fidelity prototype instead of a high-fidelity one?"),
        E("What is a user persona, and how would you build one from real research?"),
        M("How would you plan a usability test for a new mobile banking feature? Who would you recruit, and what would you measure?"),
        M("How do you use components and auto layout in Figma to keep a design system consistent?"),
        M("How do you turn notes from user interviews into clear design insights?"),
        H("How do you make a design accessible for users with low vision or users who rely on screen readers?"),
        H("A form in a government services app has a high drop-off rate. How would you find out why and redesign it?"),
        H("How would you design an app for users who switch comfortably between Bahasa Melayu and English?"),
      ],
      "Customer Support": [
        E("What does good customer service look like over live chat compared with over the phone?"),
        E("How would you write a clear and friendly reply to a customer asking the same question for the third time?"),
        E("How would you greet a customer and verify their identity before discussing their account?"),
        M("Which helpdesk or CRM tools have you used, and how did you use them to track and follow up on cases?"),
        M("A customer says they were charged twice for one online order. Walk me through the steps you would take."),
        M("How do you write case notes so a colleague can continue without asking the customer to repeat themselves?"),
        H("How do you decide when to escalate a case to a supervisor or another team, and what information do you include?"),
        H("Which metrics, such as first response time, resolution time or customer satisfaction, would you use to judge support quality, and how can each one mislead?"),
        H("A product issue is causing many complaints on social media. How would you respond publicly and internally?"),
      ],
    },
  },
}

const BANK_MS: LanguageBank = {
  hr: {
    general: [
      OPEN("Boleh ceritakan sedikit tentang diri anda dan apa yang menarik minat anda kepada jawatan ini?"),
      E("Apakah kekuatan utama anda, dan apakah satu aspek yang sedang anda perbaiki?"),
      E("Mengapa anda memilih syarikat kami berbanding peluang kerjaya lain di luar sana?"),
      E("Apa yang anda suka lakukan pada masa lapang, dan apakah yang anda pelajari daripadanya?"),
      M("Ceritakan pengalaman anda menguruskan beban tugas yang berat atau tarikh akhir yang sangat ketat."),
      M("Di manakah anda melihat haluan kerjaya anda dalam tempoh tiga hingga lima tahun akan datang?"),
      M("Apakah jenis budaya kerja dan gaya pengurusan yang membantu anda memberikan prestasi terbaik?"),
      M("Bagaimana anda menangani perbezaan pendapat apabila bekerja dalam pasukan yang terdiri daripada pelbagai latar belakang?"),
      H("Berapakah gaji yang anda harapkan untuk jawatan ini, dan bagaimana anda menentukan angka tersebut?"),
      H("Terdapat jurang masa atau perubahan arah dalam resume anda. Boleh terangkan apa yang berlaku dan apa pengajarannya?"),
      H("Jika anda menerima dua tawaran kerja, satu daripada kami dan satu lagi dengan gaji lebih tinggi, bagaimana anda membuat keputusan?"),
      H("Apakah yang akan dikatakan oleh bekas penyelia atau pensyarah anda tentang perkara paling sukar apabila bekerja dengan anda?"),
      H("Mengapa kami patut memilih anda berbanding calon lain yang lebih berpengalaman?"),
    ],
    roles: {
      "Associate Product Analyst": [
        E("Apakah produk yang anda gunakan setiap hari, dan apakah satu perkara yang anda akan ukur untuk tahu sama ada ia berjaya?"),
        M("Mengapa anda mahu memulakan kerjaya sebagai penganalisis produk, dan bukan dalam bidang data atau perniagaan semata-mata?"),
      ],
      "Software Engineer": [
        E("Apa yang membuatkan anda berminat dengan kejuruteraan perisian, dan jenis kerja apa yang paling anda nikmati?"),
        M("Bagaimana anda memastikan kemahiran teknikal anda sentiasa terkini di luar waktu kerja atau kuliah?"),
      ],
      "Data Analyst": [
        E("Apa yang menarik minat anda untuk bekerja dengan data, dan soalan jenis apa yang anda seronok cari jawapannya?"),
        M("Pada pandangan anda, bagaimana peranan penganalisis data akan berubah dalam beberapa tahun lagi, dan bagaimana anda bersedia untuknya?"),
      ],
      "Product Manager": [
        M("Mengapa anda memilih pengurusan produk, dan apakah latar belakang anda yang menyokong pilihan ini?"),
        H("Pengurus produk selalunya bertanggungjawab tanpa mempunyai kuasa langsung ke atas pasukan. Bagaimana anda melihat perkara ini, dan bagaimana anda akan bekerja dalam keadaan begitu?"),
      ],
      "UX Designer": [
        E("Apa yang membuatkan anda berminat dengan reka bentuk UX, dan produk mana yang anda rasa mempunyai pengalaman pengguna yang hebat?"),
        M("Bagaimana reaksi anda apabila pengguna atau pihak berkepentingan langsung tidak menyukai reka bentuk yang anda banggakan?"),
      ],
      "Customer Support": [
        E("Mengapa anda mahu bekerja dalam bidang khidmat pelanggan, dan apakah maksud perkhidmatan yang baik bagi anda?"),
        M("Kerja khidmat pelanggan mungkin melibatkan syif, hujung minggu dan cuti umum. Bagaimana anda menjaga tenaga dan motivasi anda?"),
      ],
    },
  },
  behavioral: {
    general: [
      E("Ceritakan satu pengalaman anda bekerja dalam pasukan untuk menyiapkan sesuatu projek. Apakah sumbangan anda?"),
      E("Ceritakan bagaimana anda mempelajari kemahiran atau perisian baharu dalam masa yang singkat untuk menyiapkan sesuatu tugasan."),
      E("Berikan contoh ketika anda membantu rakan sekerja atau rakan sekelas yang sedang menghadapi kesukaran."),
      M("Ceritakan satu projek mencabar yang pernah anda kendalikan. Apakah peranan anda dan apakah hasilnya?"),
      M("Ceritakan pengalaman anda menghadapi perselisihan pendapat dengan rakan sepasukan dan cara anda menyelesaikannya."),
      M("Berikan contoh matlamat penting yang anda sasarkan dan tindakan berdisiplin yang anda ambil untuk mencapainya."),
      M("Ceritakan pengalaman anda menghadapi kegagalan atau kesilapan kerja. Apakah pengajaran yang anda peroleh?"),
      H("Kongsi pengalaman anda meyakinkan pihak berkepentingan (stakeholders) untuk menerima cadangan atau idea anda."),
      H("Ceritakan satu keputusan yang anda buat walaupun maklumat yang ada tidak lengkap. Apakah hasilnya, dan apa yang akan anda ubah?"),
      H("Ceritakan satu kesilapan anda yang memberi kesan kepada orang lain. Bagaimana anda menanganinya dan apa yang anda ubah selepas itu?"),
      H("Ceritakan situasi di mana anda terpaksa mempersoalkan atau menolak permintaan daripada orang yang lebih senior."),
    ],
    roles: {
      "Associate Product Analyst": [
        E("Ceritakan satu situasi di mana anda menggunakan data untuk menjawab soalan atau membuat keputusan, walaupun dalam perkara kecil."),
        E("Ceritakan pengalaman anda menerangkan satu angka atau carta kepada seseorang yang keliru dengannya."),
        E("Ceritakan satu situasi di mana anda ingin tahu mengapa sesuatu berlaku lalu menyiasatnya atas inisiatif sendiri."),
        M("Ceritakan satu projek di mana anda menggunakan data atau metrik untuk menambah baik produk atau proses kerja."),
        M("Ceritakan pengalaman anda menerima maklum balas yang kritikal terhadap analisis anda. Bagaimana anda bertindak balas?"),
        M("Bagaimana anda membentangkan dapatan analisis yang rumit kepada pengurusan yang tidak berlatar belakang teknikal? Berikan contoh."),
        H("Bagaimana anda pernah menentukan keutamaan antara ciri baharu dan pembaikan pepijat apabila setiap pihak berkepentingan mempunyai permintaan yang berbeza?"),
        H("Ceritakan bagaimana anda mengenal pasti keperluan pengguna yang belum dipenuhi dan menukarnya kepada user stories yang boleh dilaksanakan."),
        H("Ceritakan satu situasi di mana analisis anda membawa kepada cadangan yang akhirnya salah. Apakah tindakan anda selepas itu?"),
      ],
      "Software Engineer": [
        E("Ceritakan satu projek pengaturcaraan yang anda seronok bangunkan, sama ada di tempat kerja, universiti atau projek peribadi. Apakah bahagian anda?"),
        E("Ceritakan pengalaman anda terpaksa mempelajari bahasa pengaturcaraan atau framework baharu dengan cepat untuk sesuatu projek."),
        E("Ceritakan bila kali terakhir anda meminta bantuan untuk masalah teknikal. Bagaimana anda tahu sudah tiba masanya untuk bertanya?"),
        M("Ceritakan satu pepijat atau masalah prestasi yang sukar yang pernah anda siasat dan selesaikan."),
        M("Ceritakan situasi di mana anda tidak bersetuju dengan keputusan reka bentuk teknikal. Bagaimana ia diselesaikan?"),
        M("Ceritakan satu projek di mana anda memperkenalkan atau menambah baik ujian automatik atau saluran CI/CD."),
        H("Ceritakan bagaimana anda mengimbangi antara menyiapkan kod dengan cepat dan mengekalkan seni bina perisian yang kemas."),
        H("Ceritakan pengalaman anda membimbing jurutera junior atau menggalakkan amalan semakan kod yang lebih baik."),
        H("Ceritakan satu insiden di sistem produksi yang melibatkan anda. Apakah peranan anda dan apa yang berubah selepas itu?"),
      ],
      "Data Analyst": [
        E("Ceritakan tentang satu laporan atau dashboard yang pernah anda bina. Siapa yang menggunakannya dan untuk tujuan apa?"),
        E("Ceritakan pengalaman anda menemui kesilapan dalam hamparan (spreadsheet) atau laporan. Apakah tindakan anda?"),
        E("Ceritakan bagaimana anda mempelajari alat data baharu seperti Power BI, Tableau atau Python untuk menyiapkan sesuatu tugasan."),
        M("Terangkan satu projek analitik anda dari awal hingga akhir, bermula daripada pengekstrakan dan pembersihan data hingga penyediaan dashboard."),
        M("Ceritakan situasi di mana data yang anda terima tidak kemas, tidak lengkap atau bercanggah. Bagaimana anda menanganinya?"),
        M("Ceritakan pengalaman apabila seseorang meminta data tanpa soalan yang jelas. Bagaimana anda mengenal pasti keperluan sebenar mereka?"),
        H("Ceritakan bagaimana dapatan analisis anda mempengaruhi satu keputusan perniagaan yang penting."),
        H("Ceritakan situasi di mana analisis anda menunjukkan sesuatu yang tidak mahu didengar oleh pihak berkepentingan. Bagaimana anda menyampaikannya?"),
        H("Ceritakan pengalaman anda menyiapkan analisis dengan tarikh akhir yang sangat ketat. Apakah yang anda ketepikan, dan mengapa?"),
      ],
      "Product Manager": [
        E("Ceritakan tentang satu produk yang anda gemari dan satu ciri yang anda ingin ubah. Mengapa?"),
        E("Ceritakan pengalaman anda menyelaras sekumpulan orang untuk menyiapkan sesuatu tepat pada masanya."),
        E("Ceritakan pengalaman anda bercakap dengan pengguna atau pelanggan untuk memahami sesuatu masalah."),
        M("Ceritakan situasi di mana anda terpaksa menolak permintaan ciri daripada pihak berkepentingan yang penting."),
        M("Ceritakan satu produk atau ciri yang anda lancarkan. Bagaimana anda tahu ia sudah sedia, dan bagaimana anda mengukur kejayaannya?"),
        M("Ceritakan situasi di mana anda terpaksa mengubah rancangan di pertengahan jalan kerana ada maklumat baharu."),
        H("Ceritakan bagaimana anda membuat pilihan antara skop, kualiti dan tarikh akhir dalam satu projek. Apakah yang anda pilih dan mengapa?"),
        H("Ceritakan situasi di mana pasukan kejuruteraan, reka bentuk dan perniagaan tidak sependapat tentang hala tuju. Bagaimana anda menyatukan mereka?"),
        H("Ceritakan satu keputusan produk yang anda buat tetapi akhirnya tidak menjadi. Apakah pengajarannya?"),
      ],
      "UX Designer": [
        E("Ceritakan satu projek reka bentuk dalam portfolio anda. Apakah masalah yang anda cuba selesaikan?"),
        E("Ceritakan pengalaman anda menerima maklum balas terhadap reka bentuk anda. Apakah yang anda ubah?"),
        E("Ceritakan pengalaman anda mereka bentuk sesuatu untuk pengguna yang sangat berbeza daripada diri anda."),
        M("Ceritakan situasi di mana hasil kajian pengguna mengubah hala tuju reka bentuk asal anda."),
        M("Bagaimana anda mengimbangi keperluan pengguna dengan matlamat perniagaan atau kekangan teknikal? Berikan contoh."),
        M("Ceritakan bagaimana anda membentangkan reka bentuk kepada pihak berkepentingan dan menjawab soalan mereka."),
        H("Ceritakan situasi di mana pembangun atau pengurus produk tidak bersetuju dengan reka bentuk anda. Bagaimana anda menanganinya?"),
        H("Ceritakan satu keputusan reka bentuk yang tidak berjalan dengan baik selepas dilancarkan. Apakah pengajarannya?"),
        H("Ceritakan pengalaman anda mereka bentuk dengan tarikh akhir yang sangat ketat. Apakah yang anda kompromikan?"),
      ],
      "Customer Support": [
        E("Ceritakan pengalaman anda membantu pelanggan atau orang awam menyelesaikan masalah mereka."),
        E("Ceritakan bagaimana anda kekal sabar apabila berdepan dengan seseorang yang sedang marah atau kecewa."),
        E("Ceritakan satu situasi di mana anda berusaha lebih daripada yang diminta untuk membantu seseorang."),
        M("Ceritakan satu pengalaman anda melayan pelanggan yang marah. Apakah yang anda katakan dan bagaimana ia berakhir?"),
        M("Ceritakan situasi di mana anda tidak dapat memberikan apa yang pelanggan mahukan. Bagaimana anda menanganinya?"),
        M("Ceritakan pengalaman anda bekerjasama dengan pasukan lain untuk menyelesaikan masalah pelanggan."),
        H("Ceritakan bagaimana anda mengesan aduan pelanggan yang berulang dan membantu menyelesaikan punca sebenarnya."),
        H("Ceritakan situasi di mana anda perlu mengendalikan banyak panggilan atau tiket segera serentak. Bagaimana anda menentukan keutamaan?"),
        H("Ceritakan satu kesilapan yang anda lakukan semasa melayan pelanggan. Bagaimana anda memperbetulkannya?"),
      ],
    },
  },
  technical: {
    general: [
      E("Apakah kemahiran atau alatan teknikal paling penting untuk jawatan ini, dan bagaimana anda mengaplikasikannya?"),
      E("Terangkan satu konsep teknikal yang sukar dengan bahasa yang mudah difahami oleh orang bukan teknikal."),
      E("Perisian atau alatan apa yang paling anda mahir gunakan, dan bagaimana anda mempelajarinya?"),
      M("Bagaimanakah langkah sistematik anda apabila menyelesaikan masalah atau pepijat yang sukar dikesan?"),
      M("Bagaimana anda menguji dan menyemak hasil kerja anda sebelum menyerahkannya kepada pihak berkepentingan?"),
      M("Ceritakan bagaimana anda menyelesaikan satu masalah teknikal yang belum pernah anda temui sebelum ini."),
      M("Bagaimana anda menyusun kerja dan dokumentasi supaya orang lain boleh menyambungnya jika anda tiada?"),
      H("Ceritakan satu projek yang paling anda banggakan dari aspek perancangan dan pelaksanaan. Apakah kompromi yang anda buat?"),
      H("Jika anda diberi tugasan dalam bidang yang anda kurang arif dengan tempoh seminggu, bagaimana anda akan mendekatinya?"),
      H("Bagaimana anda mengukur sama ada hasil kerja yang anda serahkan benar-benar mencapai matlamatnya?"),
      H("Ceritakan satu keputusan teknikal yang kemudiannya anda sedari salah. Bagaimana anda membetulkannya?"),
    ],
    roles: {
      "Associate Product Analyst": [
        E("Apakah perbezaan antara metrik pengguna aktif harian dengan kadar pengekalan (retention)? Mengapa kedua-duanya perlu dipantau?"),
        E("Bagaimana anda membina funnel ringkas untuk melihat di peringkat mana pengguna berhenti semasa membuat pesanan dalam aplikasi penghantaran makanan?"),
        E("Bagaimana anda menerangkan kadar penukaran (conversion rate) kepada rakan sepasukan baharu, dan bagaimana ia dikira?"),
        M("Terangkan perbezaan antara leading indicator dan lagging indicator dengan contoh perjalanan pelanggan yang realistik."),
        M("Jika maklum balas pengguna bertentangan dengan data analitik, bagaimana anda menentukan mana yang lebih tepat?"),
        M("Metrik utama apa, seperti kos pemerolehan pelanggan, nilai sepanjang hayat, retention, churn atau NPS, yang anda akan pantau untuk aplikasi langganan, dan mengapa?"),
        H("Bagaimana anda mereka bentuk ujian A/B untuk aliran onboarding pengguna yang baharu? Terangkan hipotesis, saiz sampel dan metrik kejayaan."),
        H("Jumlah pengguna aktif mingguan sebuah aplikasi tiba-tiba menurun. Bagaimana anda menyiasat puncanya?"),
        H("Bagaimana anda menganggarkan potensi menambah pilihan beli sekarang, bayar kemudian (BNPL) di halaman pembayaran sebuah platform e-dagang?"),
      ],
      "Software Engineer": [
        E("Terangkan apa yang berlaku, langkah demi langkah, apabila anda menaip URL dalam pelayar web dan menekan Enter."),
        E("Apakah perbezaan antara git merge dan git rebase, dan bilakah anda menggunakan setiap satu?"),
        E("Apakah perbezaan antara stack dan queue? Berikan satu contoh penggunaan sebenar bagi setiap satu."),
        M("Apakah perbezaan antara REST API dengan GraphQL atau RPC, dan dalam situasi apa anda akan memilih setiap satu?"),
        M("Bagaimana anda menguruskan state, operasi tak segerak (asynchronous) dan caching dalam aplikasi web moden?"),
        M("Bagaimana anda menentukan bahagian mana yang perlu diuji dengan unit test dan bahagian mana dengan integration test?"),
        H("Bagaimana anda mereka bentuk indeks pangkalan data untuk pertanyaan yang sangat kerap, dan apakah kompromi yang perlu diambil kira?"),
        H("Bagaimana anda melindungi aplikasi web daripada risiko biasa dalam senarai OWASP Top 10 seperti SQL injection, XSS, CSRF dan pengesahan yang lemah?"),
        H("Bagaimana anda mereka bentuk sistem yang menghantar peringatan pembayaran kepada sejumlah besar pengguna tanpa membebankan pelayan?"),
      ],
      "Data Analyst": [
        E("Apakah perbezaan antara INNER JOIN dan LEFT JOIN? Berikan contoh bila anda akan menggunakan setiap satu."),
        E("Carta jenis apa yang sesuai untuk menunjukkan jualan bulanan sepanjang tahun, dan carta apa yang patut dielakkan? Mengapa?"),
        E("Bagaimana anda membuang baris pendua (duplicate) daripada set data, sama ada dalam Excel atau SQL?"),
        M("Bagaimana anda memastikan ketepatan data dan mengesahkan andaian sebelum membuat kesimpulan?"),
        M("Terangkan satu pertanyaan SQL yang pernah anda tulis menggunakan window function seperti ROW_NUMBER, LAG atau LEAD bersama PARTITION BY."),
        M("Terangkan perbezaan antara sistem OLTP dan OLAP, termasuk skema star dan snowflake."),
        H("Bagaimana anda mengesan data luar biasa (outlier) dalam data siri masa tanpa membuang maklumat yang berguna?"),
        H("Jualan meningkat selepas satu kempen pemasaran. Bagaimana anda menyemak sama ada kempen itu benar-benar puncanya?"),
        H("Bagaimana anda mereka bentuk dashboard untuk pengurus wilayah sebuah rangkaian kedai runcit? Apakah yang dipaparkan di skrin pertama, dan mengapa?"),
      ],
      "Product Manager": [
        E("Bagaimana anda menulis user story yang baik untuk ciri yang membolehkan pengguna menyimpan barang ke dalam senarai hajat (wishlist)?"),
        E("Apakah perbezaan antara MVP dan pelancaran produk penuh?"),
        E("Apakah yang anda akan masukkan dalam dokumen keperluan produk (PRD) yang ringkas untuk satu ciri baharu?"),
        M("Anda mempunyai dua puluh permintaan ciri dalam backlog. Bagaimana anda menentukan keutamaannya, dan rangka kerja apa yang anda gunakan?"),
        M("Apakah metrik yang anda akan pantau untuk aplikasi e-dompet di Malaysia, dan yang mana satu akan menjadi north star metric anda?"),
        M("Bagaimana anda mentakrifkan kejayaan untuk program rujukan (referral) baharu dalam aplikasi e-hailing?"),
        H("Kadar penukaran di halaman pembayaran menurun selepas reka bentuk baharu dilancarkan. Bagaimana anda mengenal pasti punca dan memutuskan sama ada perlu kembali ke versi lama?"),
        H("Bagaimana anda memutuskan sama ada untuk membangunkan sesuatu ciri sendiri, membeli alat pihak ketiga, atau bekerjasama dengan syarikat lain?"),
        H("Pasukan kejuruteraan memberitahu pelancaran lewat dua minggu. Bagaimana anda memutuskan apa yang perlu dipotong?"),
      ],
      "UX Designer": [
        E("Apakah perbezaan antara reka bentuk UX dan UI?"),
        E("Apakah itu wireframe, dan bilakah anda menggunakan prototaip low-fidelity berbanding high-fidelity?"),
        E("Apakah itu persona pengguna, dan bagaimana anda membinanya berdasarkan kajian sebenar?"),
        M("Bagaimana anda merancang ujian kebolehgunaan (usability test) untuk ciri baharu dalam aplikasi perbankan mudah alih? Siapa pesertanya dan apa yang diukur?"),
        M("Bagaimana anda menggunakan komponen dan auto layout dalam Figma untuk memastikan sistem reka bentuk kekal konsisten?"),
        M("Bagaimana anda menukar nota temu bual pengguna kepada dapatan reka bentuk yang jelas?"),
        H("Bagaimana anda memastikan reka bentuk anda mesra pengguna yang kurang penglihatan atau yang bergantung pada pembaca skrin?"),
        H("Satu borang dalam aplikasi perkhidmatan kerajaan mempunyai kadar keciciran yang tinggi. Bagaimana anda mencari puncanya dan mereka bentuk semula borang itu?"),
        H("Bagaimana anda mereka bentuk aplikasi untuk pengguna yang selesa menggunakan Bahasa Melayu dan juga Bahasa Inggeris?"),
      ],
      "Customer Support": [
        E("Pada pendapat anda, apakah perbezaan khidmat pelanggan yang baik melalui chat berbanding melalui telefon?"),
        E("Bagaimana anda menulis balasan yang jelas dan mesra kepada pelanggan yang bertanya soalan yang sama buat kali ketiga?"),
        E("Bagaimana anda menyambut pelanggan dan mengesahkan identiti mereka sebelum membincangkan akaun mereka?"),
        M("Sistem helpdesk atau CRM apa yang pernah anda gunakan, dan bagaimana anda menggunakannya untuk menjejak dan membuat susulan kes?"),
        M("Seorang pelanggan mendakwa dia dicaj dua kali untuk satu pesanan dalam talian. Terangkan langkah-langkah yang anda akan ambil."),
        M("Bagaimana anda menulis nota kes supaya rakan sekerja boleh menyambungnya tanpa perlu meminta pelanggan mengulang cerita?"),
        H("Bagaimana anda menentukan bila sesuatu kes perlu dinaikkan (escalate) kepada penyelia atau pasukan lain, dan maklumat apa yang anda sertakan?"),
        H("Metrik apa, seperti masa respons pertama, masa penyelesaian atau skor kepuasan pelanggan, yang anda gunakan untuk menilai kualiti khidmat pelanggan, dan bagaimana setiap satu boleh mengelirukan?"),
        H("Satu masalah produk menyebabkan banyak aduan di media sosial. Bagaimana anda memberi respons secara terbuka dan secara dalaman?"),
      ],
    },
  },
}

/* ------------------------------------------------------------------------ */
/* Resume and job-ad templates                                              */
/* ------------------------------------------------------------------------ */

type TemplateSet = Record<InterviewType, string[]>

const RESUME_SKILL_TEMPLATES: { en: TemplateSet; ms: TemplateSet } = {
  en: {
    technical: [
      "Your resume mentions {skill}. Tell me about a project where you used it and what the result was.",
      "You list {skill} on your resume. How did you learn it, and what is the hardest problem you have solved with it?",
      "How would you use {skill} on the first real task you get in this role?",
    ],
    behavioral: [
      "Your resume mentions {skill}. Tell me about a time it helped you solve a problem for your team.",
      "Describe a situation where your experience with {skill} was put to the test under pressure. What did you do?",
    ],
    hr: [
      "Your resume highlights {skill}. Why is it important to you, and how do you keep improving it?",
      "How do you think your experience with {skill} will help you contribute in your first few months here?",
    ],
  },
  ms: {
    technical: [
      "Resume anda menyebut {skill}. Ceritakan satu projek di mana anda menggunakannya dan apakah hasilnya.",
      "Anda menyenaraikan {skill} dalam resume anda. Bagaimana anda mempelajarinya, dan apakah masalah paling sukar yang pernah anda selesaikan dengannya?",
      "Bagaimana anda akan menggunakan {skill} untuk tugasan sebenar pertama anda dalam jawatan ini?",
    ],
    behavioral: [
      "Resume anda menyebut {skill}. Ceritakan satu situasi di mana kemahiran ini membantu anda menyelesaikan masalah untuk pasukan anda.",
      "Ceritakan satu situasi di mana pengalaman anda dengan {skill} benar-benar diuji ketika berada di bawah tekanan. Apa yang anda lakukan?",
    ],
    hr: [
      "Resume anda menonjolkan {skill}. Mengapa kemahiran ini penting bagi anda, dan bagaimana anda terus memperbaikinya?",
      "Bagaimana pengalaman anda dengan {skill} boleh membantu anda menyumbang dalam beberapa bulan pertama di sini?",
    ],
  },
}

const RESUME_ROLE_TEMPLATES: { en: TemplateSet; ms: TemplateSet } = {
  en: {
    technical: [
      "Your resume targets {role} roles. Which part of the job do you feel most technically prepared for, and which part are you still learning?",
    ],
    behavioral: [
      "Your resume targets {role} roles. Tell me about an experience that made you choose this career path.",
    ],
    hr: ["Your resume targets {role} roles. What experience makes you ready for this kind of position?"],
  },
  ms: {
    technical: [
      "Resume anda menyasarkan jawatan {role}. Bahagian kerja mana yang anda rasa paling bersedia dari segi teknikal, dan bahagian mana yang masih anda pelajari?",
    ],
    behavioral: [
      "Resume anda menyasarkan jawatan {role}. Ceritakan pengalaman yang mendorong anda memilih laluan kerjaya ini.",
    ],
    hr: ["Resume anda menyasarkan jawatan {role}. Pengalaman apa yang membuatkan anda bersedia untuk jawatan seperti ini?"],
  },
}

const JOB_AD_TEMPLATES: { en: TemplateSet; ms: TemplateSet } = {
  en: {
    technical: [
      "This role asks for {keyword}. Walk me through how you have used it.",
      "The job ad mentions {keyword}. Describe a task where you applied it and what the outcome was.",
      "How would you use {keyword} in your first month in this role?",
    ],
    behavioral: [
      "This role asks for {keyword}. Tell me about a time you showed it under pressure.",
      "The job ad highlights {keyword}. Describe a situation where it made a real difference to your team or your customers.",
    ],
    hr: [
      "This role asks for {keyword}. How would you rate yourself on it, and what are you doing to improve?",
      "The job ad mentions {keyword}. Why do you think it matters for this position?",
    ],
  },
  ms: {
    technical: [
      "Jawatan ini memerlukan {keyword}. Terangkan bagaimana anda pernah menggunakannya.",
      "Iklan jawatan ini menyebut {keyword}. Ceritakan satu tugasan di mana anda mengaplikasikannya dan apakah hasilnya.",
      "Bagaimana anda akan menggunakan {keyword} dalam bulan pertama anda di jawatan ini?",
    ],
    behavioral: [
      "Jawatan ini memerlukan {keyword}. Ceritakan satu situasi di mana anda menunjukkannya ketika berada di bawah tekanan.",
      "Iklan jawatan ini menekankan {keyword}. Ceritakan situasi di mana ia memberi kesan sebenar kepada pasukan atau pelanggan anda.",
    ],
    hr: [
      "Jawatan ini memerlukan {keyword}. Bagaimana anda menilai tahap anda dalam aspek ini, dan apa yang anda lakukan untuk memperbaikinya?",
      "Iklan jawatan ini menyebut {keyword}. Pada pendapat anda, mengapa ia penting untuk jawatan ini?",
    ],
  },
}

/** Used when the keyword is a frequent word from the ad rather than a known skill. */
const JOB_AD_WORD_TEMPLATES: { en: string[]; ms: string[] } = {
  en: [
    "The job ad mentions \"{keyword}\". What do you know about this area, and what relevant experience can you bring?",
    "The job ad talks about \"{keyword}\". Tell me about something you have done that relates to it.",
  ],
  ms: [
    "Iklan jawatan ini menyebut \"{keyword}\". Apakah yang anda tahu tentang perkara ini, dan pengalaman berkaitan apa yang boleh anda bawa?",
    "Iklan jawatan ini ada menyebut tentang \"{keyword}\". Ceritakan sesuatu yang pernah anda lakukan yang berkaitan dengannya.",
  ],
}

interface SkillKeyword {
  en: string
  ms?: string
  patterns: string[]
}

const JOB_AD_KEYWORDS: SkillKeyword[] = [
  { en: "SQL", patterns: ["sql"] },
  { en: "Excel", patterns: ["excel"] },
  { en: "Python", patterns: ["python"] },
  { en: "Power BI", patterns: ["power bi", "powerbi"] },
  { en: "Tableau", patterns: ["tableau"] },
  { en: "Looker", patterns: ["looker"] },
  { en: "Google Analytics", patterns: ["google analytics"] },
  { en: "React", patterns: ["react", "react.js", "reactjs"] },
  { en: "JavaScript", patterns: ["javascript"] },
  { en: "TypeScript", patterns: ["typescript"] },
  { en: "Java", patterns: ["java"] },
  { en: "Node.js", patterns: ["node.js", "nodejs"] },
  { en: "AWS", patterns: ["aws", "amazon web services"] },
  { en: "Azure", patterns: ["azure"] },
  { en: "Docker", patterns: ["docker"] },
  { en: "Git", patterns: ["git", "github", "gitlab"] },
  { en: "REST APIs", patterns: ["rest api", "rest apis", "restful"] },
  { en: "Figma", patterns: ["figma"] },
  { en: "Adobe XD", patterns: ["adobe xd"] },
  { en: "user research", ms: "kajian pengguna", patterns: ["user research", "kajian pengguna"] },
  { en: "wireframing", patterns: ["wireframe", "wireframes", "wireframing"] },
  { en: "prototyping", patterns: ["prototyping", "prototype", "prototypes"] },
  { en: "A/B testing", patterns: ["a/b testing", "a/b test", "ab testing"] },
  { en: "machine learning", patterns: ["machine learning"] },
  { en: "statistics", ms: "statistik", patterns: ["statistics", "statistical", "statistik"] },
  { en: "data analysis", ms: "analisis data", patterns: ["data analysis", "data analytics", "analisis data"] },
  { en: "data visualisation", ms: "visualisasi data", patterns: ["data visualisation", "data visualization", "visualisasi data"] },
  { en: "Jira", patterns: ["jira"] },
  { en: "Agile", patterns: ["agile"] },
  { en: "Scrum", patterns: ["scrum"] },
  { en: "CRM", patterns: ["crm"] },
  { en: "Salesforce", patterns: ["salesforce"] },
  { en: "HubSpot", patterns: ["hubspot"] },
  { en: "Zendesk", patterns: ["zendesk"] },
  { en: "Freshdesk", patterns: ["freshdesk"] },
  { en: "SEO", patterns: ["seo"] },
  { en: "social media", ms: "media sosial", patterns: ["social media", "media sosial"] },
  { en: "stakeholder management", ms: "pengurusan pihak berkepentingan", patterns: ["stakeholder management", "managing stakeholders", "stakeholders", "stakeholder"] },
  { en: "project management", ms: "pengurusan projek", patterns: ["project management", "pengurusan projek"] },
  { en: "product management", ms: "pengurusan produk", patterns: ["product management"] },
  { en: "customer service", ms: "khidmat pelanggan", patterns: ["customer service", "customer support", "khidmat pelanggan", "perkhidmatan pelanggan"] },
  { en: "communication", ms: "kemahiran komunikasi", patterns: ["communication", "komunikasi"] },
  { en: "problem solving", ms: "penyelesaian masalah", patterns: ["problem solving", "problem-solving", "penyelesaian masalah"] },
  { en: "teamwork", ms: "kerja berpasukan", patterns: ["teamwork", "team player", "kerja berpasukan"] },
  { en: "leadership", ms: "kepimpinan", patterns: ["leadership", "kepimpinan"] },
  { en: "negotiation", ms: "kemahiran berunding", patterns: ["negotiation", "rundingan"] },
  { en: "presentation skills", ms: "kemahiran pembentangan", patterns: ["presentation", "pembentangan"] },
  { en: "time management", ms: "pengurusan masa", patterns: ["time management", "pengurusan masa"] },
  { en: "attention to detail", ms: "ketelitian", patterns: ["attention to detail", "detail-oriented", "detail oriented", "teliti"] },
  { en: "Bahasa Melayu", patterns: ["bahasa melayu", "bahasa malaysia"] },
  { en: "Mandarin", patterns: ["mandarin"] },
]

const STOPWORDS = new Set<string>([
  // English
  "about", "above", "after", "again", "against", "along", "among", "and/or", "apply", "applicants", "applicant",
  "being", "below", "between", "candidate", "candidates", "company", "could", "degree", "diploma", "during",
  "employees", "every", "excellent", "experience", "experienced", "following", "further", "good", "great",
  "including", "include", "includes", "interested", "job", "knowledge", "least", "level", "looking", "malaysia",
  "kuala", "lumpur", "selangor", "minimum", "month", "months", "other", "others", "please", "position", "preferred",
  "provide", "related", "relevant", "required", "requirement", "requirements", "responsibilities", "responsible",
  "role", "should", "skill", "skills", "strong", "their", "there", "these", "those", "through", "under", "using",
  "where", "which", "while", "within", "without", "working", "would", "years", "ability", "able", "across", "based",
  "benefits", "bonus", "career", "competitive", "description", "environment", "field", "fresh", "graduate",
  "graduates", "join", "location", "opportunity", "opportunities", "salary", "should", "successful", "support",
  "team", "teams", "understanding", "willing", "work", "hours", "office", "qualification", "qualifications",
  "bachelor", "bachelors", "equivalent", "other", "basic", "ensure", "perform", "duties", "tasks", "various",
  // Malay
  "adalah", "agar", "akan", "antara", "apabila", "bagi", "bahawa", "berikut", "boleh", "calon", "dalam",
  "dengan", "diri", "faedah", "gaji", "hendaklah", "iaitu", "jawatan", "kepada", "kerja", "kemahiran",
  "kelayakan", "lebih", "melalui", "mampu", "memohon", "mempunyai", "mereka", "minimum", "oleh", "pengalaman",
  "pemohon", "perlu", "sahaja", "sebagai", "secara", "sekurang", "kurang", "serta", "syarikat", "tahun", "tanggungjawab",
  "terhadap", "tersebut", "untuk", "yang", "berpengalaman", "memastikan", "diutamakan", "sijil", "ijazah",
  "mencari", "menghasilkan", "bekerja", "berkebolehan", "berminat", "permohonan", "hantar", "jawatan", "seperti",
  "termasuk", "berkaitan", "pekerja", "jabatan", "sedang", "segera", "menjadi", "membantu", "melaksanakan",
  "hiring", "seeking", "needed", "urgently", "immediately", "manage", "handle", "assist", "develop", "great",
])

interface ExtractedKeyword {
  en: string
  ms: string
  /** true when matched against JOB_AD_KEYWORDS, false for a frequent word. */
  known: boolean
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")
}

function extractJobAdKeywords(text: string, max = 3): ExtractedKeyword[] {
  const lower = text.toLowerCase()
  const found: { kw: SkillKeyword; index: number }[] = []
  for (const kw of JOB_AD_KEYWORDS) {
    let best = -1
    for (const p of kw.patterns) {
      const re = new RegExp(`(^|[^a-z0-9])${escapeRegExp(p)}(?=$|[^a-z0-9])`)
      const m = re.exec(lower)
      if (m) {
        const idx = m.index + m[1].length
        if (best === -1 || idx < best) best = idx
      }
    }
    if (best !== -1) found.push({ kw, index: best })
  }
  if (found.length > 0) {
    found.sort((a, b) => a.index - b.index)
    return found.slice(0, max).map(({ kw }) => ({ en: kw.en, ms: kw.ms ?? kw.en, known: true }))
  }

  // Fallback: most frequent non-stopword words of length >= 5.
  const words = lower.match(/[a-zÀ-ɏ]+/g) ?? []
  const counts = new Map<string, { count: number; first: number }>()
  words.forEach((w, i) => {
    if (w.length < 5 || STOPWORDS.has(w)) return
    const entry = counts.get(w)
    if (entry) entry.count += 1
    else counts.set(w, { count: 1, first: i })
  })
  return [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count || a[1].first - b[1].first)
    .slice(0, max)
    .map(([w]) => ({ en: w, ms: w, known: false }))
}

/* ------------------------------------------------------------------------ */
/* Selection helpers                                                        */
/* ------------------------------------------------------------------------ */

function shuffle<T>(items: readonly T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i]
    a[i] = a[j]
    a[j] = tmp
  }
  return a
}

/** Difficulty preference groups: chosen difficulty first, then Medium, then the far end. */
function preferenceGroups(d: Difficulty): Difficulty[][] {
  if (d === "Medium") return [["Medium"], ["Easy", "Hard"]]
  return [[d], ["Medium"], [d === "Easy" ? "Hard" : "Easy"]]
}

/** Orders questions by difficulty preference, shuffled within each group. */
function orderByPreference(qs: BankQuestion[], groups: Difficulty[][]): BankQuestion[] {
  return groups.flatMap((g) => shuffle(qs.filter((q) => g.includes(q.d))))
}

const DIFFICULTY_RANK: Record<Difficulty, number> = { Easy: 0, Medium: 1, Hard: 2 }

const textKey = (t: string) => t.trim().toLowerCase().replace(/\s+/g, " ")

interface Picked {
  text: string
  difficulty: Difficulty
  source: "bank" | "resume" | "jobAd"
  opener?: boolean
}

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? values[key] : match))
}

function uniqueTrimmed(values: readonly string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const v of values) {
    const t = (v ?? "").trim()
    if (!t || seen.has(t.toLowerCase())) continue
    seen.add(t.toLowerCase())
    out.push(t)
  }
  return out
}

function buildResumeTemplates(resume: ResumeContext, type: InterviewType, isMalay: boolean): string[] {
  const lang = isMalay ? "ms" : "en"
  const skills = shuffle(uniqueTrimmed(resume.skills ?? [])).slice(0, 2)
  const skillTemplates = shuffle(RESUME_SKILL_TEMPLATES[lang][type])
  const out: string[] = skills.map((skill, i) => fill(skillTemplates[i % skillTemplates.length], { skill }))
  const targetRole = (resume.targetRole ?? "").trim()
  if (out.length < 2 && targetRole) {
    const roleTemplates = RESUME_ROLE_TEMPLATES[lang][type]
    out.push(fill(roleTemplates[Math.floor(Math.random() * roleTemplates.length)], { role: targetRole }))
  }
  return out
}

function buildJobAdTemplates(jobAdText: string, type: InterviewType, isMalay: boolean): string[] {
  const lang = isMalay ? "ms" : "en"
  const keywords = shuffle(extractJobAdKeywords(jobAdText, 3)).slice(0, 2)
  const skillTemplates = shuffle(JOB_AD_TEMPLATES[lang][type])
  const wordTemplates = shuffle(JOB_AD_WORD_TEMPLATES[lang])
  return keywords.map((kw, i) => {
    const keyword = isMalay ? kw.ms : kw.en
    const pool = kw.known ? skillTemplates : wordTemplates
    return fill(pool[i % pool.length], { keyword })
  })
}

/* ------------------------------------------------------------------------ */
/* Public API                                                               */
/* ------------------------------------------------------------------------ */

export interface QuestionRequest {
  role: string // may be "" (general questions) or any free text the user typed
  type: InterviewType
  count: number // 3, 5 or 8
  language: Language
  difficulty: Difficulty
  source?: QuestionSource // "none" | "resume" | "jobAd"
  resume?: ResumeContext | null
  jobAdText?: string
}

export function getQuestionsForSession(req: QuestionRequest): QuestionItem[] {
  const count = Math.max(0, Math.floor(Number.isFinite(req.count) ? req.count : 0))
  const isMalay = req.language === "ms-MY"
  const roleLabel = (req.role ?? "").trim() || "General"
  const bank = (isMalay ? BANK_MS : BANK_EN)[req.type]
  const chip = resolveRole(req.role ?? "")
  const groups = preferenceGroups(req.difficulty)

  const used = new Set<string>()
  const add = (list: Picked[], p: Picked): boolean => {
    const key = textKey(p.text)
    if (!key || used.has(key)) return false
    used.add(key)
    list.push(p)
    return true
  }

  // 1. Template questions (resume / job ad) go first, at most 2.
  const templates: Picked[] = []
  let templateTexts: string[] = []
  if (req.source === "resume" && req.resume) {
    templateTexts = buildResumeTemplates(req.resume, req.type, isMalay)
  } else if (req.source === "jobAd" && req.jobAdText && req.jobAdText.trim()) {
    templateTexts = buildJobAdTemplates(req.jobAdText, req.type, isMalay)
  }
  const templateSource: Picked["source"] = req.source === "jobAd" ? "jobAd" : "resume"
  for (const text of templateTexts.slice(0, 2)) {
    if (templates.length >= count) break
    add(templates, { text, difficulty: req.difficulty, source: templateSource })
  }

  // 2. Bank questions: role-specific first (most of the session), then general.
  const remaining = count - templates.length
  const picks: Picked[] = []
  const toPicked = (q: BankQuestion): Picked => ({ text: q.t, difficulty: q.d, source: "bank", opener: q.opener })

  const roleQs = chip ? bank.roles[chip] ?? [] : []
  const roleOrdered = orderByPreference(roleQs, groups)
  const generalOrdered = orderByPreference(bank.general, groups)

  if (remaining > 0) {
    // Role questions fill up to ~3/4 of the slots, taken from the chosen difficulty and its Medium neighbour.
    const roleTarget = Math.min(roleOrdered.length, remaining - Math.floor(remaining / 4))
    const nearDifficulties = new Set<Difficulty>(groups.slice(0, 2).flat())
    for (const q of roleOrdered) {
      if (picks.length >= roleTarget) break
      if (nearDifficulties.has(q.d)) add(picks, toPicked(q))
    }
    // General questions fill the rest, by difficulty preference.
    for (const q of generalOrdered) {
      if (picks.length >= remaining) break
      add(picks, toPicked(q))
    }
    // Still short: any remaining role questions, by difficulty preference.
    for (const q of roleOrdered) {
      if (picks.length >= remaining) break
      add(picks, toPicked(q))
    }
  }

  // Mix role and general questions, then warm up: opener first, then easier to harder.
  const ordered = shuffle(picks).sort((a, b) => {
    const oa = a.opener ? 0 : 1
    const ob = b.opener ? 0 : 1
    if (oa !== ob) return oa - ob
    return DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty]
  })

  return [...templates, ...ordered].slice(0, count).map((p, i) => ({
    id: `q_${i + 1}`,
    number: i + 1,
    text: p.text,
    type: req.type,
    role: roleLabel,
    difficulty: p.difficulty,
    source: p.source,
  }))
}

/* ------------------------------------------------------------------------ */
/* Follow-up probes                                                         */
/* ------------------------------------------------------------------------ */

export function generateProbingFollowUp(
  question: string,
  answer: string,
  isMalay = false,
  persona: Persona = "neutral"
): string {
  void question
  const ansLower = (answer ?? "").toLowerCase()
  const strict = persona === "strict"
  const has = (words: string[]) => words.some((w) => ansLower.includes(w))

  if (isMalay) {
    if (has(["data", "metrik", "hasil", "keputusan", "peratus", "meningkat", "jualan", "metric", "result"])) {
      return strict
        ? "Anda menyebut tentang hasil. Berapakah angka sebenar sebelum dan selepas, dan bagaimana anda pasti perubahan itu berpunca daripada tindakan anda, bukan faktor lain?"
        : "Anda menyebut tentang hasil yang boleh diukur. Boleh huraikan metrik khusus yang berubah dan bagaimana anda mengesahkan perubahan itu benar-benar berlaku?"
    }
    if (has(["pasukan", "konflik", "rakan", "pihak berkepentingan", "stakeholder", "penyelia", "team"])) {
      return strict
        ? "Anda banyak menyebut pasukan. Apakah keputusan paling sukar yang anda sendiri buat dalam situasi itu, dan apa yang akan anda lakukan secara berbeza jika ia berulang?"
        : "Anda menyebut tentang kerjasama dalam pasukan. Apakah cara komunikasi khusus yang anda gunakan untuk mendapatkan sokongan apabila ada pihak yang menentang pada mulanya?"
    }
    if (has(["projek", "project"])) {
      return strict
        ? "Dalam projek itu, apakah kompromi terbesar yang anda pilih, dan apakah risikonya jika pilihan itu salah?"
        : "Anda menyebut tentang penglibatan dalam projek tersebut. Apakah cabaran terbesar yang anda hadapi semasa melaksanakannya, dan apakah ukuran kejayaan yang dicapai?"
    }
    return strict
      ? "Jawapan anda masih terlalu umum. Berikan satu contoh sebenar: apakah situasinya, apa yang anda sendiri lakukan, dan apakah hasilnya dalam angka?"
      : "Boleh anda huraikan dengan lebih spesifik langkah tindakan (Action) yang anda ambil sendiri secara individu berbanding tugas pasukan?"
  }

  if (has(["data", "metric", "improve", "result"])) {
    return strict
      ? "You mentioned results. What were the actual numbers before and after, and how do you know the change came from your work and not something else?"
      : "You touched upon measurable outcomes. Could you dive deeper into the specific metric you moved and how you verified the change was real?"
  }
  if (has(["team", "conflict", "stakeholder"])) {
    return strict
      ? "You keep saying 'we'. What was the hardest call you personally made in that situation, and what would you do differently next time?"
      : "You mentioned working through team dynamics. What specific communication tactic did you use to get buy-in when there was initial resistance?"
  }
  return strict
    ? "That answer is still general. Give me one concrete example: the situation, the trade-off you faced, what you chose, and the measurable result."
    : "Could you walk me through the exact 'Action' phase using the STAR framework: which decisions were yours alone versus the broader team's?"
}
