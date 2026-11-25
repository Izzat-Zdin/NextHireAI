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
      OPEN("Tell me a bit about yourself and why you applied for this role."),
      E("What would you say is your biggest strength, and what's one thing you're working to improve?"),
      E("Why do you want to join our company in particular?"),
      E("What do you like to do in your free time, and what has it taught you?"),
      M("Tell me about a time you had a really tight deadline. How did you handle the pressure?"),
      M("Where do you see yourself in three to five years?"),
      M("What kind of work environment and manager bring out the best in you?"),
      M("How do you handle it when a teammate sees a problem very differently from you?"),
      H("What's your expected salary, and how did you come up with that number?"),
      H("I noticed a gap in your resume. Can you walk me through what happened?"),
      H("Say you get two offers, ours and another one that pays more. How would you choose?"),
      H("What would your last supervisor or lecturer say is the hardest thing about working with you?"),
      H("Other candidates have more experience than you. Why should we pick you?"),
    ],
    roles: {
      "Associate Product Analyst": [
        E("Pick an app you use every day. What's one number you'd track to see if it's doing well?"),
        M("Why do you want to start as a product analyst instead of a pure data or business role?"),
      ],
      "Software Engineer": [
        E("What got you into software engineering, and what kind of work do you enjoy most?"),
        M("How do you keep your coding skills up to date outside of class or work?"),
      ],
      "Data Analyst": [
        E("What do you enjoy about working with data, and what kind of questions do you like answering?"),
        M("How do you think AI will change the data analyst job, and how are you getting ready for it?"),
      ],
      "Product Manager": [
        M("Why product management, and what in your background has prepared you for it?"),
        H("As a product manager, you'll need people to deliver even though they don't report to you. How would you handle that?"),
      ],
      "UX Designer": [
        E("What got you interested in UX design, and which app do you think has a really good user experience?"),
        M("Tell me about a time users didn't like a design you were proud of. How did you react?"),
      ],
      "Customer Support": [
        E("Why do you want to work in customer support, and what does good service mean to you?"),
        M("This job includes weekend and public holiday shifts. How do you stay motivated when everyone else is off?"),
      ],
    },
  },
  behavioral: {
    general: [
      E("Tell me about a time you worked in a team on a project. What was your part?"),
      E("Tell me about a time you had to learn something new quickly to get a job done."),
      E("Tell me about a time you helped a classmate or teammate who was struggling."),
      M("Tell me about a challenging project you worked on. What exactly did you do, and what was the result?"),
      M("Tell me about a time you disagreed with a teammate. How did you sort it out?"),
      M("Tell me about a big goal you set for yourself. How did you reach it?"),
      M("Tell me about a time things didn't go according to plan. What did you learn?"),
      H("Tell me about a time you had to convince others to try your idea."),
      H("Tell me about a time you had to make a decision without all the information. How did it turn out?"),
      H("Tell me about a mistake you made that affected other people. How did you handle it?"),
      H("Tell me about a time you had to push back on someone more senior than you."),
    ],
    roles: {
      "Associate Product Analyst": [
        E("Tell me about a time you used data to make a decision, even a small one."),
        E("Tell me about a time you explained a number or a chart to someone who found it confusing."),
        E("Tell me about a time you got curious about why something was happening and looked into it yourself."),
        M("Tell me about a time you used data to improve a product or a process."),
        M("Tell me about a time someone criticised your analysis. How did you respond?"),
        M("Tell me about a time you presented your findings to managers who weren't technical."),
        H("Tell me about a time two teams wanted different things from the product. How did you decide what came first?"),
        H("Tell me about a time you spotted something users needed and turned it into user stories."),
        H("Tell me about a time your recommendation turned out to be wrong. What did you do next?"),
      ],
      "Software Engineer": [
        E("Tell me about a coding project you really enjoyed building. What was your part?"),
        E("Tell me about a time you had to learn a new language or framework quickly."),
        E("Tell me about a time you asked for help with a technical problem. How did you know it was time to ask?"),
        M("Tell me about a tough bug or slow feature you tracked down and fixed."),
        M("Tell me about a time you disagreed with a technical decision on your team. What happened?"),
        M("Tell me about a time you added or improved automated testing on a project."),
        H("Tell me about a time you had to choose between shipping fast and keeping the code clean."),
        H("Tell me about a time you helped a newer developer or improved how your team reviewed code."),
        H("Tell me about a time something broke in production. What was your role, and what changed afterwards?"),
      ],
      "Data Analyst": [
        E("Tell me about a report or dashboard you built. Who used it, and for what?"),
        E("Tell me about a time you found a mistake in a spreadsheet or report. What did you do?"),
        E("Tell me about a time you had to learn a new data tool, such as Python or Tableau, for a task."),
        M("Walk me through an analysis project from start to finish, from getting the data to sharing the results."),
        M("Tell me about a time you worked with messy or incomplete data. How did you handle it?"),
        M("Tell me about a time someone asked you for data without a clear question. How did you find out what they needed?"),
        H("Tell me about a time your analysis changed an important business decision."),
        H("Tell me about a time your findings were not what the team wanted to hear. How did you share them?"),
        H("Tell me about a time you had to finish an analysis under a very tight deadline. What did you leave out?"),
      ],
      "Product Manager": [
        E("Tell me about an app you use a lot and one thing you would change about it."),
        E("Tell me about a time you organised a group of people to get something done on time."),
        E("Tell me about a time you talked to users to understand their problem."),
        M("Tell me about a time you had to say no to a request from an important stakeholder."),
        M("Tell me about a feature you helped launch. How did you measure whether it worked?"),
        M("Tell me about a time new information forced you to change direction halfway through a project."),
        H("Tell me about a time you couldn't have the full scope, top quality and the deadline. What did you give up, and why?"),
        H("Tell me about a time different teams disagreed on what to build. How did you get them on the same page?"),
        H("Tell me about a product decision you made that turned out badly. What did you learn?"),
      ],
      "UX Designer": [
        E("Walk me through one project in your portfolio. What problem were you solving?"),
        E("Tell me about a time you got feedback on a design. What did you change?"),
        E("Tell me about a time you designed for people very different from yourself."),
        M("Tell me about a time user research changed your design direction."),
        M("Tell me about a time you had to balance what users wanted with what the business needed."),
        M("Tell me about a time you presented a design to stakeholders. How did you handle their questions?"),
        H("Tell me about a time a developer or product manager pushed back on your design. How did you handle it?"),
        H("Tell me about a design decision that didn't work once it went live. What did you learn?"),
        H("Tell me about a time you had very little time to design something. How did you make sure it was still easy to use?"),
      ],
      "Customer Support": [
        E("Tell me about a time you helped a customer or someone from the public with a problem."),
        E("Tell me about a time you had to stay patient with someone who was frustrated."),
        E("Tell me about a time you went the extra mile for someone."),
        M("Tell me about a time you dealt with an angry customer. What did you say, and how did it end?"),
        M("Tell me about a time you couldn't give a customer what they wanted. How did you handle it?"),
        M("Tell me about a time you worked with another team to solve a customer's problem."),
        H("Tell me about a time you noticed the same complaint coming up again and again. What did you do about it?"),
        H("Tell me about a time you had lots of urgent tickets or calls at once. How did you decide what to handle first?"),
        H("Tell me about a time you made a mistake with a customer. How did you put it right?"),
      ],
    },
  },
  technical: {
    general: [
      E("What's one tool you use almost every day in your work, and why do you like it?"),
      E("Can you explain something technical from your field to me as if I'm not from a tech background?"),
      E("How do you usually learn a new software tool?"),
      M("When you get a problem with a lot of missing information, how do you start working on it?"),
      M("How do you check your work before you hand it over to someone?"),
      M("Tell me about a time you had to fix a technical problem you'd never seen before."),
      M("If you suddenly had to go on leave, how would someone else pick up your work?"),
      H("Tell me about a project you're proud of. What trade-offs did you have to make?"),
      H("Say I give you a task in an area you barely know, and you only have one week. What would you do?"),
      H("After you deliver something, how do you know it actually worked?"),
      H("Tell me about a technical decision you made that turned out to be wrong. How did you fix it?"),
    ],
    roles: {
      "Associate Product Analyst": [
        E("What's the difference between daily active users and retention, and why track both?"),
        E("How would you build a simple funnel to see where users drop off at checkout in a food delivery app?"),
        E("How would you explain conversion rate to a new teammate?"),
        M("Can you explain leading and lagging indicators with an example from a customer funnel?"),
        M("What do you do when user feedback says one thing but the analytics data says another?"),
        M("Which metrics would you watch for a subscription app, and which one matters most to you?"),
        H("How would you set up an A/B test for a new onboarding flow?"),
        H("Weekly active users in our mobile app suddenly dropped. How would you find out why?"),
        H("How would you estimate the value of adding a buy now, pay later option at checkout?"),
      ],
      "Software Engineer": [
        E("What happens when you type a URL into the browser and press Enter?"),
        E("What's the difference between git merge and git rebase, and when do you use each?"),
        E("What's the difference between a stack and a queue? Give me a real use for each."),
        M("How is REST different from GraphQL, and when would you pick one over the other?"),
        M("How do you handle server data in a web app, things like loading states, caching and duplicate requests?"),
        M("How do you decide what needs a unit test and what needs an integration test?"),
        H("How do you decide which database indexes to add for a busy query, and what's the cost of adding too many?"),
        H("How would you protect a web app against common attacks like SQL injection, XSS and CSRF?"),
        H("How would you send payment reminders to millions of users without overloading your servers?"),
      ],
      "Data Analyst": [
        E("What's the difference between an INNER JOIN and a LEFT JOIN?"),
        E("Which chart would you use to show monthly sales for a year, and which would you avoid?"),
        E("How would you remove duplicate rows from a dataset?"),
        M("How do you make sure your analysis doesn't lead people to the wrong conclusion?"),
        M("Can you walk me through a SQL query you wrote using a window function like ROW_NUMBER or LAG?"),
        M("What's the difference between OLTP and OLAP, and where do star and snowflake schemas come in?"),
        H("How would you spot unusual values in daily sales data without throwing away the ones that actually matter?"),
        H("Sales went up after a marketing campaign. How would you check if the campaign really caused it?"),
        H("If you were designing a dashboard for a retail chain's regional managers, what would you put on the first screen?"),
      ],
      "Product Manager": [
        E("How would you write a user story for a wishlist feature?"),
        E("What's the difference between an MVP and a full product launch?"),
        E("What would you put in a simple product requirements document?"),
        M("You have twenty feature requests in the backlog. How would you prioritise them?"),
        M("If you were managing an e-wallet app in Malaysia, what would be your north star metric?"),
        M("How would you measure whether a new referral programme in a ride-hailing app is working?"),
        H("Checkout conversion dropped after a redesign. How would you figure out why, and when would you roll back?"),
        H("How do you decide whether to build a feature yourselves, buy a ready-made tool or partner with another company?"),
        H("Engineering says the release is two weeks late. How do you decide what to cut?"),
      ],
      "UX Designer": [
        E("What's the difference between UX design and UI design?"),
        E("What's a wireframe, and when would you use a low-fidelity prototype instead of a high-fidelity one?"),
        E("What's a user persona, and how would you create one from real research?"),
        M("How would you plan a usability test for a new feature in a banking app?"),
        M("How do you use components and auto layout in Figma to keep designs consistent?"),
        M("After a round of user interviews, how do you turn your notes into useful design insights?"),
        H("How do you design for users with low vision or users who rely on screen readers?"),
        H("Lots of people quit halfway through a form in a government services app. How would you find out why and fix it?"),
        H("How would you design an app for users who mix Bahasa Melayu and English all the time?"),
      ],
      "Customer Support": [
        E("How is good customer service on live chat different from good service on the phone?"),
        E("A customer asks you the same question for the third time. How would you reply?"),
        E("How would you greet a customer and confirm who they are before talking about their account?"),
        M("Which helpdesk or CRM tools have you used, and how did they help you follow up on cases?"),
        M("A customer says they were charged twice for one order. What would you do?"),
        M("How do you write case notes so a colleague can continue without the customer repeating everything?"),
        H("When would you escalate a case, and what would you include when you do?"),
        H("Which metrics would you use to judge support quality, and how can they mislead you?"),
        H("A product problem is causing a flood of complaints on social media. How would you handle it?"),
      ],
    },
  },
}

const BANK_MS: LanguageBank = {
  hr: {
    general: [
      OPEN("Boleh ceritakan sedikit tentang diri anda, dan kenapa anda berminat dengan jawatan ini?"),
      E("Apa kekuatan utama anda, dan apa satu perkara yang sedang anda cuba perbaiki?"),
      E("Kenapa anda memilih untuk memohon di syarikat kami?"),
      E("Apa yang anda suka buat pada masa lapang, dan apa yang anda belajar daripadanya?"),
      M("Ceritakan satu pengalaman anda berdepan dengan tarikh akhir yang sangat ketat. Bagaimana anda uruskannya?"),
      M("Di mana anda nampak diri anda dalam tiga hingga lima tahun lagi?"),
      M("Jenis persekitaran kerja dan pengurus yang bagaimana membantu anda bekerja dengan terbaik?"),
      M("Kalau anda tidak sependapat dengan ahli pasukan, bagaimana biasanya anda selesaikannya?"),
      H("Berapa gaji yang anda harapkan, dan bagaimana anda dapat angka itu?"),
      H("Saya nampak ada jurang masa dalam resume anda. Boleh terangkan apa yang berlaku?"),
      H("Katakan anda dapat dua tawaran, satu daripada kami dan satu lagi dengan gaji lebih tinggi. Bagaimana anda akan buat keputusan?"),
      H("Kalau saya tanya bekas penyelia anda, apa yang dia akan kata paling susah tentang bekerja dengan anda?"),
      H("Kenapa kami patut pilih anda berbanding calon lain yang lebih berpengalaman?"),
    ],
    roles: {
      "Associate Product Analyst": [
        E("Apa satu aplikasi yang anda guna setiap hari, dan apa satu perkara yang anda akan ukur untuk tahu ia berjaya?"),
        M("Kenapa anda mahu mula sebagai penganalisis produk, dan bukan penganalisis data atau perniagaan?"),
      ],
      "Software Engineer": [
        E("Apa yang buat anda berminat dengan kejuruteraan perisian, dan kerja jenis apa yang paling anda suka?"),
        M("Bagaimana anda pastikan kemahiran teknikal anda sentiasa terkini?"),
      ],
      "Data Analyst": [
        E("Apa yang menarik anda untuk bekerja dengan data, dan soalan jenis apa yang anda paling seronok cari jawapannya?"),
        M("Pada pendapat anda, bagaimana kerja penganalisis data akan berubah dalam beberapa tahun lagi, dan apa persediaan anda?"),
      ],
      "Product Manager": [
        M("Kenapa anda memilih pengurusan produk, dan pengalaman apa yang menyokong pilihan itu?"),
        H("Pengurus produk selalunya tiada kuasa langsung ke atas pasukan. Bagaimana anda pastikan kerja tetap siap?"),
      ],
      "UX Designer": [
        E("Apa yang buat anda berminat dengan reka bentuk UX, dan apa satu produk yang anda rasa pengalaman penggunanya sangat bagus?"),
        M("Bagaimana reaksi anda kalau pengguna tidak suka reka bentuk yang anda sangat banggakan?"),
      ],
      "Customer Support": [
        E("Kenapa anda mahu bekerja dalam khidmat pelanggan, dan apa maksud servis yang baik bagi anda?"),
        M("Kerja ini melibatkan syif, hujung minggu dan cuti umum. Bagaimana anda jaga tenaga dan motivasi anda?"),
      ],
    },
  },
  behavioral: {
    general: [
      E("Boleh ceritakan satu pengalaman anda bekerja dalam pasukan untuk siapkan sesuatu projek? Apa sumbangan anda?"),
      E("Ceritakan satu masa anda perlu belajar kemahiran atau perisian baharu dengan cepat untuk siapkan tugasan."),
      E("Boleh kongsi satu masa anda membantu rakan sekelas atau rakan sekerja yang sedang menghadapi kesukaran?"),
      M("Ceritakan satu projek paling mencabar yang pernah anda buat. Apa peranan anda?"),
      M("Ceritakan satu masa anda berselisih faham dengan rakan sepasukan. Bagaimana anda selesaikannya?"),
      M("Ceritakan satu matlamat besar yang pernah anda tetapkan. Apa yang anda buat untuk mencapainya?"),
      M("Ceritakan satu masa sesuatu yang anda rancang tidak menjadi. Apa yang anda belajar daripadanya?"),
      H("Ceritakan satu masa anda perlu yakinkan rakan sekerja atau pihak atasan yang ragu-ragu untuk terima idea anda."),
      H("Ceritakan satu keputusan yang anda terpaksa buat walaupun maklumat tidak lengkap. Apa hasilnya?"),
      H("Ceritakan satu kesilapan anda yang menyusahkan orang lain. Bagaimana anda betulkannya?"),
      H("Ceritakan satu masa anda terpaksa berkata tidak, atau mempersoalkan permintaan orang yang lebih senior."),
    ],
    roles: {
      "Associate Product Analyst": [
        E("Ceritakan satu masa anda guna data untuk buat keputusan, walaupun keputusan kecil."),
        E("Ceritakan satu masa anda terangkan satu angka atau carta kepada seseorang yang keliru."),
        E("Ceritakan satu masa anda nampak sesuatu yang pelik dan menyiasatnya atas inisiatif sendiri."),
        M("Ceritakan satu projek di mana anda guna data atau metrik untuk tambah baik produk."),
        M("Ceritakan satu masa analisis anda dikritik. Bagaimana anda bertindak balas?"),
        M("Ceritakan satu masa anda bentangkan hasil analisis kepada pengurusan yang bukan orang teknikal. Bagaimana anda pastikan mereka faham?"),
        H("Ceritakan satu masa dua pihak minta perkara yang berbeza daripada pasukan produk. Bagaimana anda bantu tentukan mana yang didahulukan?"),
        H("Ceritakan satu masa anda kenal pasti keperluan pengguna yang belum dipenuhi dan tukarkannya kepada user stories."),
        H("Ceritakan satu masa analisis anda membawa kepada cadangan yang salah. Apa yang anda buat selepas itu?"),
      ],
      "Software Engineer": [
        E("Ceritakan satu projek pengaturcaraan yang anda seronok buat. Apa bahagian anda?"),
        E("Ceritakan satu masa anda perlu belajar bahasa pengaturcaraan atau framework baharu dengan cepat."),
        E("Bila kali terakhir anda minta bantuan untuk masalah teknikal? Bagaimana anda tahu sudah tiba masanya untuk bertanya?"),
        M("Ceritakan satu pepijat atau masalah prestasi yang sukar yang pernah anda selesaikan."),
        M("Ceritakan satu masa anda tidak setuju dengan keputusan reka bentuk teknikal dalam pasukan. Bagaimana ia diselesaikan?"),
        M("Ceritakan satu masa anda perkenalkan atau tambah baik ujian automatik atau CI/CD."),
        H("Ceritakan satu masa anda perlu pilih antara siapkan kod dengan cepat atau tulis kod yang kemas. Apa yang anda buat?"),
        H("Ceritakan satu masa anda bantu rakan yang lebih junior, atau tambah baik cara pasukan buat code review."),
        H("Ceritakan satu insiden di production yang melibatkan anda. Apa peranan anda, dan apa yang berubah selepas itu?"),
      ],
      "Data Analyst": [
        E("Ceritakan satu laporan atau dashboard yang pernah anda bina. Siapa yang guna, dan untuk apa?"),
        E("Ceritakan satu masa anda jumpa kesilapan dalam spreadsheet atau laporan. Apa yang anda buat?"),
        E("Ceritakan bagaimana anda belajar alat data baharu, seperti Python atau Tableau, untuk siapkan sesuatu tugasan."),
        M("Cuba bawa saya melalui satu projek analitik anda dari awal hingga akhir, daripada tarik data sampai siap dashboard."),
        M("Ceritakan satu masa data yang anda terima bersepah atau tidak lengkap. Bagaimana anda uruskannya?"),
        M("Ceritakan satu masa seseorang minta data tanpa tahu apa sebenarnya yang mereka perlukan. Bagaimana anda kenal pasti keperluan mereka?"),
        H("Ceritakan satu masa hasil analisis anda mengubah keputusan perniagaan yang besar."),
        H("Ceritakan satu masa hasil analisis anda bukan apa yang orang lain mahu dengar. Bagaimana anda sampaikannya?"),
        H("Ceritakan satu masa anda perlu siapkan analisis dengan tarikh akhir yang sangat ketat. Apa yang anda ketepikan, dan kenapa?"),
      ],
      "Product Manager": [
        E("Apa satu aplikasi yang anda suka guna, dan satu ciri yang anda mahu ubah? Kenapa?"),
        E("Ceritakan satu masa anda selaraskan sekumpulan orang untuk siapkan sesuatu tepat pada masa."),
        E("Ceritakan satu masa anda bercakap dengan pengguna untuk faham masalah mereka."),
        M("Ceritakan satu masa anda terpaksa menolak permintaan ciri daripada orang yang penting."),
        M("Ceritakan satu ciri yang anda bantu lancarkan. Bagaimana anda ukur kejayaannya?"),
        M("Ceritakan satu masa anda terpaksa ubah rancangan di tengah jalan kerana ada maklumat baharu."),
        H("Ceritakan satu masa anda perlu pilih antara skop, kualiti dan tarikh akhir. Apa yang anda korbankan, dan kenapa?"),
        H("Ceritakan satu masa beberapa pasukan tidak sependapat tentang hala tuju. Bagaimana anda satukan mereka?"),
        H("Ceritakan satu keputusan produk anda yang tidak menjadi. Apa pengajarannya?"),
      ],
      "UX Designer": [
        E("Ceritakan satu projek reka bentuk dalam portfolio anda. Masalah apa yang anda cuba selesaikan?"),
        E("Ceritakan satu masa anda terima maklum balas tentang reka bentuk anda. Apa yang anda ubah?"),
        E("Ceritakan satu masa anda mereka bentuk sesuatu untuk pengguna yang sangat berbeza daripada diri anda."),
        M("Ceritakan satu masa hasil kajian pengguna mengubah reka bentuk asal anda."),
        M("Ceritakan satu masa keperluan pengguna bercanggah dengan matlamat perniagaan atau kekangan teknikal. Bagaimana anda imbanginya?"),
        M("Ceritakan satu masa anda bentangkan reka bentuk kepada pengurus atau pasukan lain. Bagaimana anda jawab soalan mereka?"),
        H("Ceritakan satu masa pembangun atau pengurus produk tidak setuju dengan reka bentuk anda. Apa yang anda buat?"),
        H("Ceritakan satu keputusan reka bentuk anda yang tidak menjadi selepas dilancarkan. Apa yang anda belajar?"),
        H("Ceritakan satu masa anda perlu siapkan reka bentuk dengan tarikh akhir yang sangat ketat. Apa yang anda kompromikan?"),
      ],
      "Customer Support": [
        E("Ceritakan satu masa anda bantu pelanggan atau orang awam selesaikan masalah mereka."),
        E("Ceritakan satu masa anda perlu terangkan perkara yang sama berulang kali kepada seseorang. Bagaimana anda kekal sabar?"),
        E("Ceritakan satu masa anda buat lebih daripada yang diminta untuk bantu seseorang."),
        M("Ceritakan satu masa anda layan pelanggan yang sangat marah. Apa yang anda katakan, dan bagaimana ia berakhir?"),
        M("Ceritakan satu masa anda tidak dapat beri apa yang pelanggan mahu. Bagaimana anda uruskannya?"),
        M("Ceritakan satu masa anda bekerjasama dengan pasukan lain untuk selesaikan masalah pelanggan."),
        H("Ceritakan satu masa anda perasan aduan yang sama asyik berulang. Apa yang anda buat untuk selesaikan puncanya?"),
        H("Ceritakan satu masa anda perlu uruskan banyak tiket atau panggilan segera serentak. Bagaimana anda tentukan mana yang didahulukan?"),
        H("Ceritakan satu kesilapan anda semasa melayan pelanggan. Bagaimana anda betulkannya?"),
      ],
    },
  },
  technical: {
    general: [
      E("Pada pendapat anda, kemahiran teknikal apa yang paling penting untuk jawatan ini, dan di mana anda pernah menggunakannya?"),
      E("Cuba terangkan satu konsep teknikal kepada saya seolah-olah saya tiada latar belakang teknikal langsung."),
      E("Perisian atau alat apa yang anda paling mahir, dan bagaimana anda mempelajarinya?"),
      M("Bila anda jumpa pepijat yang susah dikesan, apa langkah anda untuk mencari puncanya?"),
      M("Sebelum anda serahkan sesuatu kerja, bagaimana anda menyemaknya supaya tiada kesilapan?"),
      M("Ceritakan satu masalah teknikal yang anda tidak pernah jumpa sebelum ini. Bagaimana anda menyelesaikannya?"),
      M("Bagaimana anda menyusun kerja dan dokumentasi supaya orang lain boleh sambung jika anda tiada?"),
      H("Ceritakan projek yang anda paling banggakan. Apa kompromi paling besar yang anda terpaksa buat?"),
      H("Jika anda diberi tugasan dalam bidang yang anda kurang tahu, dan tempohnya cuma seminggu, apa yang anda akan buat?"),
      H("Bagaimana anda tahu kerja yang anda serahkan benar-benar mencapai matlamatnya?"),
      H("Pernahkah anda membuat keputusan teknikal yang kemudian anda sedar salah? Apa yang anda buat untuk membetulkannya?"),
    ],
    roles: {
      "Associate Product Analyst": [
        E("Apa beza antara pengguna aktif harian dengan kadar retention, dan kenapa kedua-duanya penting?"),
        E("Untuk aplikasi penghantaran makanan, bagaimana anda membina funnel ringkas untuk melihat di mana pengguna berhenti semasa membuat pesanan?"),
        E("Bagaimana anda menerangkan conversion rate kepada rakan sepasukan yang baru masuk?"),
        M("Apa beza leading indicator dengan lagging indicator? Boleh berikan contoh daripada perjalanan pelanggan?"),
        M("Jika maklum balas pengguna bercanggah dengan data analitik, mana satu yang anda percaya?"),
        M("Untuk aplikasi berasaskan langganan, metrik apa yang anda paling utamakan, dan kenapa?"),
        H("Bagaimana anda mereka bentuk ujian A/B untuk aliran onboarding yang baharu?"),
        H("Pengguna aktif mingguan sebuah aplikasi tiba-tiba jatuh. Bagaimana anda menyiasat puncanya?"),
        H("Bagaimana anda menganggarkan sama ada berbaloi menambah pilihan beli sekarang, bayar kemudian di halaman pembayaran sebuah platform e-dagang?"),
      ],
      "Software Engineer": [
        E("Apa yang berlaku di sebalik tabir bila anda menaip URL dalam pelayar dan tekan Enter?"),
        E("Apa beza git merge dengan git rebase, dan bila anda menggunakan setiap satu?"),
        E("Apa beza stack dengan queue? Berikan satu contoh penggunaan bagi setiap satu."),
        M("Bila anda akan pilih REST API, dan bila GraphQL lebih sesuai?"),
        M("Bagaimana anda menguruskan state dan caching dalam aplikasi web front end?"),
        M("Bagaimana anda menentukan bahagian mana yang perlu unit test dan bahagian mana yang perlu integration test?"),
        H("Satu query yang sangat kerap digunakan menjadi lambat. Bagaimana anda mereka bentuk indeks untuknya, dan apa kompromi yang perlu difikirkan?"),
        H("Bagaimana anda melindungi aplikasi web daripada serangan biasa seperti SQL injection dan XSS?"),
        H("Bagaimana anda mereka bentuk sistem yang menghantar peringatan bayaran kepada ratusan ribu pengguna tanpa membebankan server?"),
      ],
      "Data Analyst": [
        E("Apa beza INNER JOIN dengan LEFT JOIN, dan bila anda menggunakan setiap satu?"),
        E("Untuk menunjukkan jualan bulanan sepanjang setahun, carta apa yang anda pilih, dan kenapa?"),
        E("Bagaimana anda membuang rekod pendua dalam set data, sama ada menggunakan Excel atau SQL?"),
        M("Anda dapati jualan minggu ini tiba-tiba naik 20 peratus. Apa yang anda semak sebelum melaporkannya kepada pengurus?"),
        M("Ceritakan satu query SQL yang pernah anda tulis menggunakan window function seperti LAG atau ROW_NUMBER."),
        M("Apa beza sistem OLTP dengan OLAP, dan bila skema star sesuai digunakan?"),
        H("Dalam data siri masa, bagaimana anda mengesan outlier tanpa terbuang maklumat yang berguna?"),
        H("Jualan naik selepas satu kempen pemasaran. Bagaimana anda pastikan kempen itu memang puncanya?"),
        H("Anda diminta membina dashboard untuk pengurus wilayah sebuah rangkaian kedai runcit. Apa yang anda letak di skrin pertama?"),
      ],
      "Product Manager": [
        E("Bagaimana anda menulis user story untuk ciri menyimpan barang ke dalam wishlist?"),
        E("Apa beza MVP dengan pelancaran produk penuh?"),
        E("Apa yang anda masukkan dalam PRD ringkas untuk satu ciri baharu?"),
        M("Ada dua puluh permintaan ciri dalam backlog. Bagaimana anda tentukan mana yang perlu dibuat dahulu?"),
        M("Untuk aplikasi e-dompet di Malaysia, apa north star metric yang anda akan pilih, dan kenapa?"),
        M("Bagaimana anda tentukan sama ada program referral baharu dalam aplikasi e-hailing berjaya?"),
        H("Selepas reka bentuk baharu halaman pembayaran dilancarkan, conversion rate jatuh. Bagaimana anda putuskan sama ada perlu kembali ke versi lama?"),
        H("Bagaimana anda putuskan sama ada mahu membina sesuatu ciri sendiri, membeli alat sedia ada, atau bekerjasama dengan syarikat lain?"),
        H("Jurutera beritahu pelancaran akan lewat dua minggu. Bagaimana anda putuskan apa yang perlu dipotong?"),
      ],
      "UX Designer": [
        E("Apa beza reka bentuk UX dengan UI?"),
        E("Bila anda guna prototaip low-fidelity, dan bila anda beralih kepada high-fidelity?"),
        E("Apa itu persona pengguna, dan bagaimana anda membinanya berdasarkan kajian sebenar?"),
        M("Bagaimana anda merancang usability test untuk ciri baharu dalam aplikasi perbankan mudah alih?"),
        M("Bagaimana anda menggunakan komponen dan auto layout dalam Figma supaya reka bentuk kekal konsisten?"),
        M("Selepas beberapa temu bual pengguna, bagaimana anda menukar nota-nota itu kepada dapatan yang jelas?"),
        H("Bagaimana anda pastikan reka bentuk anda boleh digunakan oleh pengguna yang kurang penglihatan atau yang bergantung pada pembaca skrin?"),
        H("Satu borang dalam aplikasi perkhidmatan kerajaan mempunyai kadar keciciran yang tinggi. Bagaimana anda mencari puncanya dan membaikinya?"),
        H("Bagaimana anda mereka bentuk aplikasi untuk pengguna yang bertukar-tukar antara Bahasa Melayu dan Bahasa Inggeris?"),
      ],
      "Customer Support": [
        E("Pada pendapat anda, apa beza khidmat pelanggan yang baik melalui chat dengan melalui telefon?"),
        E("Seorang pelanggan bertanya soalan yang sama buat kali ketiga. Bagaimana anda membalasnya dengan jelas dan mesra?"),
        E("Bagaimana anda menyambut pelanggan dan mengesahkan identiti mereka sebelum berbincang tentang akaun?"),
        M("Sistem helpdesk atau CRM apa yang pernah anda gunakan, dan bagaimana anda menjejak kes dengannya?"),
        M("Seorang pelanggan kata dia dicaj dua kali untuk satu pesanan dalam talian. Apa langkah yang anda akan ambil?"),
        M("Bagaimana anda menulis nota kes supaya rakan sekerja boleh menyambungnya tanpa pelanggan perlu mengulang cerita?"),
        H("Bila anda rasa sesuatu kes perlu dinaikkan kepada penyelia atau pasukan lain, dan maklumat apa yang anda sertakan?"),
        H("Metrik apa yang anda guna untuk menilai kualiti khidmat pelanggan, dan bagaimana metrik itu boleh mengelirukan?"),
        H("Satu masalah produk mencetuskan banyak aduan di media sosial. Bagaimana anda memberi respons kepada orang ramai dan di dalam syarikat?"),
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
