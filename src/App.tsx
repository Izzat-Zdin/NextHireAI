import { useEffect, useState, type ReactNode } from "react"
import {
  Activity,
  ArrowRight,
  Award,
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleUserRound,
  Clock3,
  FileSearch,
  FileText,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  Lightbulb,
  Menu,
  MessageSquareText,
  Mic,
  MicOff,
  MoreHorizontal,
  Play,
  Plus,
  Rocket,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  UploadCloud,
  UserRound,
  X,
  Zap,
} from "lucide-react"
import { completeInterviewSession, createInterviewSession, saveInterviewAnswer } from "@/lib/interviews"
import { isSupabaseConfigured } from "@/lib/supabase"
import { MockInterviewModule } from "./modules/mock-interview/MockInterviewModule"

type Page =
  | "dashboard"
  | "profile"
  | "resume"
  | "interview"
  | "assessment"
  | "learning"
  | "progress"

type Icon = typeof LayoutDashboard

const modules: { id: Page; label: string; short: string; icon: Icon }[] = [
  { id: "profile", label: "User Profile Management", short: "Profile", icon: UserRound },
  { id: "resume", label: "AI Resume Analyzer", short: "Resume Analyzer", icon: FileSearch },
  { id: "interview", label: "AI Mock Interview Engine", short: "Mock Interview", icon: MessageSquareText },
  { id: "assessment", label: "Interview & Career Readiness Assessment", short: "Assessment", icon: Gauge },
  { id: "learning", label: "Learning Recommendation", short: "Learning", icon: BookOpen },
  // { id: "progress", label: "Recommendation & Progress Tracking", short: "Progress", icon: TrendingUp },
]

const pageTitles: Record<Page, string> = {
  dashboard: "Career Dashboard",
  profile: "User Profile Management",
  resume: "AI Resume Analyzer",
  interview: "AI Mock Interview Engine",
  assessment: "Career Readiness Assessment",
  learning: "Learning Recommendation",
  // progress: "Recommendation & Progress Tracking",
}

const questions = [
  "Tell me about a project where you used data to improve a product or process.",
  "How would you prioritize features when stakeholders have competing requirements?",
  "Describe a time you received difficult feedback. How did you respond?",
  "How would you investigate a sudden drop in a product's weekly active users?",
  "Why are you interested in this Associate Product Analyst role?",
]

function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  disabled,
  type = "button",
}: {
  children: ReactNode
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md" | "icon"
  className?: string
  onClick?: () => void
  disabled?: boolean
  type?: "button" | "submit"
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`btn btn-${variant} btn-${size} ${className}`}
    >
      {children}
    </button>
  )
}

function Card({
  children,
  className = "",
  title,
  action,
}: {
  children: ReactNode
  className?: string
  title?: string
  action?: ReactNode
}) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <div className="mb-5 flex items-center justify-between gap-3">
          {title && <h2 className="section-title">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

function Badge({
  children,
  tone = "blue",
}: {
  children: ReactNode
  tone?: "blue" | "violet" | "green" | "amber" | "red" | "slate"
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

function Progress({ value, tone = "blue" }: { value: number; tone?: "blue" | "violet" | "green" }) {
  return (
    <div className="progress-track" aria-label={`${value}% complete`}>
      <div className={`progress-fill progress-${tone}`} style={{ width: `${value}%` }} />
    </div>
  )
}

function Field({
  label,
  value,
  disabled,
  type = "text",
  required,
  onChange,
}: {
  label: string
  value: string
  disabled?: boolean
  type?: string
  required?: boolean
  onChange?: (value: string) => void
}) {
  return (
    <label className="field">
      <span>
        {label} {required && <b className="text-danger">*</b>}
      </span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        required={required}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}

function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="page-intro">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  )
}

function ScoreRing({ value, label, color = "blue" }: { value: number; label: string; color?: "blue" | "violet" }) {
  return (
    <div className={`score-ring score-${color}`} style={{ "--score": `${value * 3.6}deg` } as React.CSSProperties}>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  )
}

function TrendChart({ values = [58, 64, 71, 76, 82], labels = ["Jan", "Feb", "Mar", "Apr", "May"] }) {
  return (
    <div className="trend-chart">
      <div className="chart-grid">
        {values.map((value, index) => (
          <div className="chart-column" key={`${value}-${index}`}>
            <span className="chart-value">{value}</span>
            <div className="chart-bar" style={{ height: `${Math.max(24, value)}%` }} />
            <span className="chart-label">{labels[index]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatCard({
  icon: IconComponent,
  label,
  value,
  meta,
  tone = "blue",
}: {
  icon: Icon
  label: string
  value: string
  meta: string
  tone?: "blue" | "violet" | "green" | "amber"
}) {
  return (
    <Card className="stat-card">
      <div className={`icon-box icon-${tone}`}>
        <IconComponent size={19} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{meta}</small>
      </div>
    </Card>
  )
}

function Dashboard({ navigate }: { navigate: (page: Page) => void }) {
  return (
    <>
      <div className="hero">
        <div>
          <Badge tone="violet">
            <Sparkles size={13} /> Your weekly career brief
          </Badge>
          <h1>Good morning, Maya.</h1>
          <p>You’re making strong progress. Complete one focused activity today to keep your momentum going.</p>
          <div className="hero-actions">
            <Button onClick={() => navigate("interview")}>
              <Play size={16} /> Start mock interview
            </Button>
            <Button variant="secondary" onClick={() => navigate("learning")}>
              View learning plan
            </Button>
          </div>
        </div>
        <div className="hero-score">
          <ScoreRing value={78} label="Ready" color="violet" />
          <div>
            <strong>Career readiness</strong>
            <span>+6 points this month</span>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon={CircleUserRound} label="Profile completion" value="85%" meta="Add one certification" />
        <StatCard icon={FileText} label="Latest resume score" value="76/100" meta="+8 after last update" tone="violet" />
        <StatCard icon={Mic} label="Recent interview" value="82/100" meta="Strong answer relevance" tone="green" />
        <StatCard icon={Target} label="Skill gaps" value="3 skills" meta="SQL is highest priority" tone="amber" />
      </div>

      <div className="content-grid wide-left">
        <Card
          title="Interview score trend"
          action={
            <button className="text-action" onClick={() => navigate("progress")}>
              View progress <ArrowRight size={14} />
            </button>
          }
        >
          <div className="chart-heading">
            <div>
              <strong>82</strong>
              <span>Latest score</span>
            </div>
            <Badge tone="green">
              <TrendingUp size={13} /> 24% improvement
            </Badge>
          </div>
          <TrendChart />
        </Card>
        <Card title="Priority skill gaps">
          <div className="skill-list">
            {[
              ["SQL & data queries", 42, "High"],
              ["Product analytics", 58, "High"],
              ["Stakeholder communication", 71, "Medium"],
            ].map(([skill, value, priority]) => (
              <div key={skill as string}>
                <div className="row-between">
                  <span>{skill}</span>
                  <Badge tone={priority === "High" ? "amber" : "blue"}>{priority}</Badge>
                </div>
                <Progress value={value as number} tone={value > 65 ? "violet" : "blue"} />
              </div>
            ))}
          </div>
          <Button variant="secondary" className="mt-5 w-full" onClick={() => navigate("learning")}>
            Explore recommendations
          </Button>
        </Card>
      </div>

      <Card title="Your career workflow" className="workflow-card">
        <div className="workflow">
          {modules.map((module, index) => {
            const IconComponent = module.icon
            return (
              <button key={module.id} className="workflow-step" onClick={() => navigate(module.id)}>
                <span className="step-number">{index + 1}</span>
                <span className="step-icon">
                  <IconComponent size={20} />
                </span>
                <span>
                  <strong>{module.short}</strong>
                  <small>{index < 3 ? "Completed" : index === 3 ? "Review now" : "Next step"}</small>
                </span>
                <ArrowRight size={16} />
              </button>
            )
          })}
        </div>
      </Card>

      <div className="content-grid">
        <Card title="Recommended for you">
          <div className="recommendation-feature">
            <div className="course-art">
              <BarChart3 size={34} />
            </div>
            <div>
              <Badge tone="violet">Top priority</Badge>
              <h3>SQL for Product Analytics</h3>
              <p>Build query confidence with a practical, project-led course.</p>
              <div className="course-meta">
                <span>
                  <Clock3 size={14} /> 4 hours
                </span>
                <span>
                  <Gauge size={14} /> Beginner
                </span>
              </div>
              <Button size="sm" onClick={() => navigate("learning")}>
                Start learning <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        </Card>
        <Card title="Recent activity">
          <div className="timeline">
            {[
              ["Mock interview completed", "Scored 82 in Product Analyst practice", "2 hours ago", Mic],
              ["Resume improved", "Added measurable project outcomes", "Yesterday", FileText],
              ["Course milestone reached", "SQL fundamentals: 3 of 6 lessons", "2 days ago", Award],
            ].map(([title, text, time, ItemIcon]) => (
              <div className="timeline-item" key={title as string}>
                <span>
                  <ItemIcon size={16} />
                </span>
                <div>
                  <strong>{title as string}</strong>
                  <p>{text as string}</p>
                </div>
                <small>{time as string}</small>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}

function ProfilePage() {
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [name, setName] = useState("Maya Chen")
  const [email, setEmail] = useState("maya.chen@university.edu")
  const save = () => {
    if (!name.trim() || !email.includes("@")) return
    setEditing(false)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
  }
  return (
    <>
      <PageIntro
        eyebrow="Module 1 · Foundation"
        title="Build a profile that works for you"
        description="Keep your background, strengths, and career goals current for more relevant demo recommendations."
        action={
          <Button variant={editing ? "primary" : "secondary"} onClick={() => (editing ? save() : setEditing(true))}>
            {editing ? <Save size={16} /> : <Plus size={16} />} {editing ? "Save changes" : "Edit profile"}
          </Button>
        }
      />
      {saved && (
        <div className="alert alert-success">
          <CheckCircle2 size={18} /> Profile saved for this demo session.
        </div>
      )}
      <Card className="profile-overview">
        <div className="avatar-large">MC</div>
        <div className="profile-copy">
          <h2>Maya Chen</h2>
          <p>Aspiring Product Analyst · Toronto, Canada</p>
          <div className="tag-row">
            <Badge>Open to internships</Badge>
            <Badge tone="violet">Available May 2026</Badge>
          </div>
        </div>
        <div className="completion">
          <div className="row-between">
            <strong>Profile completion</strong>
            <b>85%</b>
          </div>
          <Progress value={85} tone="violet" />
          <small>Add a certification to complete your profile.</small>
        </div>
      </Card>
      <div className="content-grid wide-left profile-grid">
        <div className="stack">
          <Card title="Personal information">
            <div className="form-grid">
              <Field label="Full name" value={name} onChange={setName} disabled={!editing} required />
              <Field label="Email address" value={email} onChange={setEmail} disabled={!editing} required />
              <Field label="Phone" value="+1 647 555 0143" disabled={!editing} />
              <Field label="Location" value="Toronto, Canada" disabled={!editing} />
            </div>
            {editing && (!name.trim() || !email.includes("@")) && (
              <p className="validation-text">Enter a valid name and email before saving.</p>
            )}
          </Card>
          <Card title="Education & qualifications" action={<Button size="sm" variant="ghost"><Plus size={14} /> Add</Button>}>
            <div className="detail-item">
              <span className="detail-icon"><GraduationCap size={19} /></span>
              <div>
                <strong>BSc, Management & Information Technology</strong>
                <p>Northbridge University · Expected June 2026</p>
                <small>GPA 3.7 / 4.0 · Dean’s List 2024</small>
              </div>
              <MoreHorizontal size={18} />
            </div>
          </Card>
          <Card title="Experience & projects" action={<Button size="sm" variant="ghost"><Plus size={14} /> Add</Button>}>
            <div className="detail-item">
              <span className="detail-icon violet"><BriefcaseBusiness size={19} /></span>
              <div>
                <strong>Product Operations Intern</strong>
                <p>BrightLabs · May–August 2025</p>
                <small>Built weekly KPI reporting and improved onboarding completion by 12%.</small>
              </div>
            </div>
            <div className="divider" />
            <div className="detail-item">
              <span className="detail-icon"><Rocket size={19} /></span>
              <div>
                <strong>Campus Events Discovery App</strong>
                <p>Capstone project · Team lead</p>
                <small>Led user research and product analytics for a React prototype.</small>
              </div>
            </div>
          </Card>
        </div>
        <div className="stack">
          <Card title="Skills & proficiency">
            <div className="skill-list">
              {[["Excel & reporting", 88], ["User research", 78], ["Data storytelling", 72], ["SQL", 42]].map(([skill, value]) => (
                <div key={skill as string}>
                  <div className="row-between"><span>{skill}</span><small>{value}%</small></div>
                  <Progress value={value as number} tone={(value as number) > 75 ? "green" : "blue"} />
                </div>
              ))}
            </div>
          </Card>
          <Card title="Career interests">
            <p className="muted-label">Target roles</p>
            <div className="tag-row">
              <Badge>Product Analyst</Badge><Badge>Business Analyst</Badge><Badge tone="violet">Product Operations</Badge>
            </div>
            <p className="muted-label mt-5">Interested industries</p>
            <div className="tag-row">
              <Badge tone="slate">SaaS</Badge><Badge tone="slate">FinTech</Badge><Badge tone="slate">Education</Badge>
            </div>
          </Card>
          <Card title="Certifications">
            <div className="empty-mini">
              <Award size={25} />
              <strong>No certifications added yet</strong>
              <p>Add one to improve profile completeness.</p>
              <Button variant="secondary" size="sm"><Plus size={14} /> Add certification</Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}

function ResumePage() {
  const [file, setFile] = useState<string | null>("Maya_Chen_Resume_2026.pdf")
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("success")
  const analyze = () => {
    if (!file) {
      setState("error")
      return
    }
    setState("loading")
    window.setTimeout(() => setState("success"), 1400)
  }
  return (
    <>
      <PageIntro
        eyebrow="Module 2 · Discover"
        title="Turn your resume into a stronger story"
        description="Upload a PDF or DOCX to preview a sample analysis based on your target Product Analyst role."
      />
      <div className="prototype-note">
        <ShieldCheck size={17} />
        <span><strong>Prototype mode:</strong> no real AI parsing or file storage is connected. Results below use fictional demo data.</span>
      </div>
      <div className="content-grid wide-left">
        <Card title="Resume upload">
          <label className="upload-zone">
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={(event) => {
                setFile(event.target.files?.[0]?.name ?? null)
                setState("idle")
              }}
            />
            <span className="upload-icon"><UploadCloud size={27} /></span>
            <strong>Drop your resume here or browse</strong>
            <p>PDF or DOCX · Maximum 5 MB</p>
          </label>
          {file && (
            <div className="file-row">
              <span><FileText size={20} /></span>
              <div><strong>{file}</strong><small>Uploaded for this session</small></div>
              <Badge tone="green"><Check size={12} /> Ready</Badge>
              <Button size="icon" variant="ghost" onClick={() => { setFile(null); setState("idle") }}><X size={16} /></Button>
            </div>
          )}
          {state === "error" && <div className="alert alert-error">Select a PDF or DOCX before starting the demo analysis.</div>}
          <Button className="mt-4 w-full" onClick={analyze} disabled={state === "loading"}>
            {state === "loading" ? <><span className="spinner" /> Analysing demo resume…</> : <><Sparkles size={16} /> Analyze resume</>}
          </Button>
        </Card>
        <Card className="resume-score-card">
          <ScoreRing value={76} label="Resume score" />
          <h3>Strong foundation</h3>
          <p>Your experience is relevant, but clearer impact metrics and stronger SQL evidence would make your resume more competitive.</p>
          <div className="score-breakdown">
            <div><span>Role alignment</span><strong>82</strong></div>
            <div><span>Impact & evidence</span><strong>68</strong></div>
            <div><span>Clarity</span><strong>79</strong></div>
          </div>
        </Card>
      </div>
      {state !== "loading" && (
        <>
          <div className="results-header">
            <div><Badge tone="green"><CheckCircle2 size={13} /> Analysis complete</Badge><h2>Your sample resume insights</h2></div>
            <small>Demo analysis · Updated just now</small>
          </div>
          <div className="content-grid">
            <Card title="Extracted profile">
              <p className="summary-text">Early-career product professional with internship experience in product operations, KPI reporting, user research, and cross-functional delivery.</p>
              <div className="extracted-block"><span>Education</span><strong>BSc Management & IT, Northbridge University</strong></div>
              <div className="extracted-block"><span>Experience</span><strong>1 internship · 3 academic projects</strong></div>
              <div className="tag-row mt-4">
                {["Excel", "User research", "Agile", "React", "Figma", "Data storytelling"].map((skill) => <Badge key={skill} tone="slate">{skill}</Badge>)}
              </div>
            </Card>
            <Card title="Strengths & weaknesses">
              <div className="insight-list positive">
                <div><CheckCircle2 /><span><strong>Clear product focus</strong><small>Projects consistently align with target role.</small></span></div>
                <div><CheckCircle2 /><span><strong>Evidence of ownership</strong><small>Leadership and initiative are easy to identify.</small></span></div>
              </div>
              <div className="insight-list negative">
                <div><Zap /><span><strong>Limited measurable impact</strong><small>Only 2 of 7 bullets include outcomes.</small></span></div>
                <div><Zap /><span><strong>SQL evidence is missing</strong><small>Add a relevant project or course.</small></span></div>
              </div>
            </Card>
          </div>
          <Card title="Priority improvements">
            <div className="suggestion-grid">
              {[
                ["01", "Quantify your impact", "Replace task-led bullets with outcome-led evidence.", "High priority"],
                ["02", "Show applied SQL", "Add your retail cohort analysis project and key finding.", "High priority"],
                ["03", "Sharpen the summary", "Name your target role and strongest differentiator.", "Medium priority"],
              ].map(([number, title, text, priority]) => (
                <div className="suggestion" key={number}>
                  <span>{number}</span><div><Badge tone={priority === "High priority" ? "amber" : "blue"}>{priority}</Badge><h3>{title}</h3><p>{text}</p></div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </>
  )
}

function InterviewPage() {
  const [phase, setPhase] = useState<"setup" | "room" | "complete">("setup")
  const [type, setType] = useState("Behavioural")
  const [role, setRole] = useState("Associate Product Analyst")
  const [difficulty, setDifficulty] = useState("Intermediate")
  const [count, setCount] = useState("5 questions")
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState("")
  const [recording, setRecording] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [databaseError, setDatabaseError] = useState("")
  const totalQuestions = Math.min(Number.parseInt(count, 10), questions.length)
  const activeQuestions = questions.slice(0, totalQuestions)

  const databaseType = (): "hr" | "behavioral" | "technical" => {
    if (type === "HR") return "hr"
    if (type === "Technical") return "technical"
    return "behavioral"
  }

  const startInterview = async () => {
    setSaving(true)
    setDatabaseError("")
    try {
      const newSessionId = await createInterviewSession({
        role,
        interviewType: databaseType(),
        totalQuestions,
        questions: activeQuestions,
      })
      setSessionId(newSessionId)
      setIndex(0)
      setAnswer("")
      setPhase("room")
    } catch (error) {
      setDatabaseError(error instanceof Error ? error.message : "Tidak dapat mencipta sesi interview.")
    } finally {
      setSaving(false)
    }
  }

  const submitAnswer = async () => {
    if (!sessionId) return
    setSaving(true)
    setDatabaseError("")
    try {
      await saveInterviewAnswer(sessionId, index + 1, answer)
      setAnswer("")
      if (index === totalQuestions - 1) {
        await completeInterviewSession(sessionId)
        setPhase("complete")
      } else {
        setIndex(index + 1)
      }
    } catch (error) {
      setDatabaseError(error instanceof Error ? error.message : "Jawapan tidak dapat disimpan.")
    } finally {
      setSaving(false)
    }
  }
  if (phase === "complete") {
    return (
      <div className="completion-page">
        <span className="completion-icon"><CheckCircle2 size={34} /></span>
        <Badge tone="green">Practice completed</Badge>
        <h1>Great work, Maya.</h1>
        <p>You completed 5 questions in 12 minutes. Your sample assessment is ready to review.</p>
        <div className="completion-stats">
          <div><strong>82</strong><span>Overall score</span></div><div><strong>86%</strong><span>Answer relevance</span></div><div><strong>4:12</strong><span>Avg. response</span></div>
        </div>
        <div className="flex-actions">
          <Button onClick={() => setPhase("setup")}>Practice again</Button>
          <Button variant="secondary" onClick={() => { window.location.hash = "assessment"; window.dispatchEvent(new HashChangeEvent("hashchange")) }}>View assessment <ArrowRight size={16} /></Button>
        </div>
      </div>
    )
  }
  if (phase === "room") {
    return (
      <>
        <div className="interview-top">
          <div><Badge tone="violet">{type} interview</Badge><h1>{role}</h1></div>
          <div className="timer-pill"><Timer size={17} /><strong>12:48</strong></div>
        </div>
        <Card className="interview-room">
          <div className="question-progress">
            <span>Question {index + 1} of {totalQuestions}</span><span>{Math.round(((index + 1) / totalQuestions) * 100)}%</span>
          </div>
          <Progress value={((index + 1) / totalQuestions) * 100} tone="violet" />
          <div className="question-area">
            <span className="question-number">0{index + 1}</span>
            <div><p>INTERVIEW QUESTION</p><h2>{activeQuestions[index]}</h2><small>Take a moment to structure your answer. Try using the STAR framework.</small></div>
          </div>
          <label className="answer-field">
            <span>Your answer</span>
            <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Type your response here, or use the microphone to practise speaking…" />
            <small>{answer.length} characters</small>
          </label>
          <div className="record-panel">
            <button className={`mic-button ${recording ? "recording" : ""}`} onClick={() => setRecording(!recording)}>
              {recording ? <MicOff size={22} /> : <Mic size={22} />}
            </button>
            <div><strong>{recording ? "Recording demo active" : "Practise your spoken answer"}</strong><span>{recording ? "Audio is not stored or transcribed." : "Microphone UI is simulated in this prototype."}</span></div>
            {recording && <span className="record-time">00:18</span>}
          </div>
          <div className="interview-controls">
            <Button variant="danger" disabled={saving} onClick={() => setPhase("setup")}>End interview</Button>
            <Button disabled={saving} onClick={submitAnswer}>{saving ? "Saving…" : index === totalQuestions - 1 ? "Submit interview" : "Submit & next"} <ArrowRight size={16} /></Button>
          </div>
          {databaseError && <p className="text-danger mt-4">{databaseError}</p>}
        </Card>
      </>
    )
  }
  return (
    <>
      <PageIntro eyebrow="Module 3 · Practise" title="Practise with purpose" description="Configure a realistic interview session and build confidence one answer at a time." />
      <div className="prototype-note"><ShieldCheck size={17} /><span>{isSupabaseConfigured ? "Sesi dan jawapan teks akan disimpan ke Supabase. Audio transcription and AI evaluation are not connected yet." : "Sambungkan Supabase dengan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY untuk menyimpan sesi sebenar."}</span></div>
      <div className="content-grid wide-left">
        <Card title="Set up your interview">
          <div className="interview-type-grid">
            {[
              ["HR", UserRound, "Motivation and role fit"],
              ["Behavioural", MessageSquareText, "Experiences and soft skills"],
              ["Technical", Activity, "Role-specific knowledge"],
            ].map(([label, TypeIcon, text]) => (
              <button key={label as string} className={`type-card ${type === label ? "active" : ""}`} onClick={() => setType(label as string)}>
                <TypeIcon size={20} /><strong>{label as string}</strong><span>{text as string}</span>{type === label && <CheckCircle2 size={17} />}
              </button>
            ))}
          </div>
          <div className="form-grid mt-6">
            <SelectField label="Target job role" value={role} onChange={setRole} options={["Associate Product Analyst", "Business Analyst Intern", "Product Operations Associate"]} />
            <SelectField label="Difficulty" value={difficulty} onChange={setDifficulty} options={["Beginner", "Intermediate", "Advanced"]} />
            <SelectField label="Number of questions" value={count} onChange={setCount} options={["3 questions", "5 questions", "8 questions"]} />
          </div>
          <Button className="mt-6" disabled={saving || !isSupabaseConfigured} onClick={startInterview}><Play size={16} /> {saving ? "Creating session…" : "Enter interview room"}</Button>
          {databaseError && <p className="text-danger mt-4">{databaseError}</p>}
        </Card>
        <div className="stack">
          <Card className="session-preview">
            <Badge tone="violet">Session preview</Badge>
            <div className="preview-icon"><MessageSquareText size={30} /></div>
            <h3>{type} interview</h3>
            <p>{role}</p>
            <div className="preview-facts"><span><Gauge size={15} /> {difficulty}</span><span><Clock3 size={15} /> About 15 min</span><span><FileText size={15} /> {count}</span></div>
          </Card>
          <Card title="Tips before you start">
            <ul className="tips-list"><li>Find a quiet, well-lit space.</li><li>Use specific examples and measurable outcomes.</li><li>Keep most answers between 60–120 seconds.</li></ul>
          </Card>
        </div>
      </div>
    </>
  )
}

function AssessmentPage() {
  const [tab, setTab] = useState("Overview")
  return (
    <>
      <PageIntro eyebrow="Module 4 · Reflect" title="Understand every response" description="Review your sample interview assessment and turn feedback into focused next steps." action={<Button variant="secondary"><FileText size={16} /> Export sample report</Button>} />
      <div className="guidance-note"><Lightbulb size={18} /><span><strong>Use scores as guidance.</strong> AI-style feedback in this prototype is for practice and is not a definitive hiring decision.</span></div>
      <div className="assessment-hero">
        <ScoreRing value={82} label="Overall" color="violet" />
        <div className="assessment-copy"><Badge tone="green">Strong performance</Badge><h2>You communicated clearly and connected your examples to business outcomes.</h2><p>Focus next on concise technical explanations and stronger closing statements.</p></div>
        <div className="assessment-meta"><span>Behavioural</span><strong>Product Analyst</strong><small>Completed today · 12 min</small></div>
      </div>
      <div className="tab-list">
        {["Overview", "Question feedback", "Full report"].map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}
      </div>
      {tab === "Overview" && (
        <>
          <div className="stats-grid three">
            <StatCard icon={MessageSquareText} label="Communication" value="84/100" meta="Clear and structured" />
            <StatCard icon={Target} label="Answer relevance" value="86/100" meta="Strong examples" tone="green" />
            <StatCard icon={Activity} label="Technical response" value="74/100" meta="Needs more depth" tone="violet" />
          </div>
          <div className="content-grid">
            <Card title="Performance by question"><TrendChart values={[78, 85, 74, 88, 84]} labels={["Q1", "Q2", "Q3", "Q4", "Q5"]} /></Card>
            <Card title="What stood out">
              <div className="insight-list positive"><div><CheckCircle2 /><span><strong>Strong STAR structure</strong><small>Your challenge and impact were easy to follow.</small></span></div><div><CheckCircle2 /><span><strong>Business awareness</strong><small>You linked metrics to customer outcomes.</small></span></div></div>
              <div className="insight-list negative"><div><Zap /><span><strong>Technical precision</strong><small>Define metrics before explaining the analysis.</small></span></div></div>
            </Card>
          </div>
        </>
      )}
      {tab === "Question feedback" && (
        <div className="question-feedback-list">
          {questions.map((question, index) => (
            <Card key={question}>
              <div className="feedback-head"><span>Q{index + 1}</span><div><h3>{question}</h3><p>{index === 2 ? "Add more detail about the analysis method and how you validated the result." : "Relevant example, clear structure, and a specific outcome."}</p></div><Badge tone={index === 2 ? "amber" : "green"}>{index === 2 ? 74 : 78 + index * 2}/100</Badge></div>
            </Card>
          ))}
        </div>
      )}
      {tab === "Full report" && (
        <Card className="report-view">
          <div className="report-header"><div className="logo-mark small">N</div><div><h2>NextHire AI Interview Report</h2><p>Maya Chen · Associate Product Analyst</p></div><Badge tone="slate">Demo report</Badge></div>
          <div className="report-grid"><div><span>Overall score</span><strong>82/100</strong></div><div><span>Top strength</span><strong>Answer relevance</strong></div><div><span>Priority focus</span><strong>Technical depth</strong></div></div>
          <h3>Coach summary</h3><p>Maya demonstrates strong early-career interview readiness. Her responses are well structured, personable, and grounded in practical experience. Continued SQL study and repeated practice explaining analytical methods will increase confidence for product analyst interviews.</p>
        </Card>
      )}
    </>
  )
}

const learningItems = [
  { title: "SQL for Product Analytics", skill: "SQL & data queries", type: "Course", level: "Beginner", duration: "4 hours", priority: "High" },
  { title: "Build a Product Metrics Dashboard", skill: "Product analytics", type: "Project", level: "Intermediate", duration: "6 hours", priority: "High" },
  { title: "Google Data Analytics Certificate", skill: "Data analysis", type: "Certification", level: "Beginner", duration: "3 months", priority: "Medium" },
  { title: "Stakeholder Stories That Persuade", skill: "Communication", type: "Tutorial", level: "Intermediate", duration: "45 min", priority: "Medium" },
  { title: "Ten Product Interview Drills", skill: "Interview confidence", type: "Practice", level: "Intermediate", duration: "2 hours", priority: "Low" },
  { title: "A/B Testing Fundamentals", skill: "Experimentation", type: "Course", level: "Intermediate", duration: "3 hours", priority: "Medium" },
]

function LearningPage() {
  const [filter, setFilter] = useState("All")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<Record<string, string>>({})
  const filtered = learningItems.filter((item) => (filter === "All" || item.type === filter) && item.title.toLowerCase().includes(search.toLowerCase()))
  return (
    <>
      <PageIntro eyebrow="Module 5 · Grow" title="A learning plan shaped around your gaps" description="Prioritized courses, credentials, tutorials, and practice activities based on your fictional profile insights." />
      <div className="learning-summary">
        <div><span className="summary-icon"><Target size={21} /></span><div><strong>3 priority skill gaps</strong><p>SQL, product analytics, stakeholder communication</p></div></div>
        <div><span className="summary-icon violet"><Clock3 size={21} /></span><div><strong>9 hours this month</strong><p>Suggested learning commitment</p></div></div>
        <div><span className="summary-icon green"><TrendingUp size={21} /></span><div><strong>+7 readiness points</strong><p>Estimated demo impact</p></div></div>
      </div>
      <div className="filters">
        <label className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search recommendations" /></label>
        <div className="filter-pills">{["All", "Course", "Certification", "Tutorial", "Practice", "Project"].map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div>
      </div>
      {filtered.length ? (
        <div className="learning-grid">
          {filtered.map((item, index) => (
            <Card className="learning-card" key={item.title}>
              <div className={`learning-art art-${(index % 3) + 1}`}><BookOpen size={28} /><Badge tone={item.priority === "High" ? "amber" : item.priority === "Medium" ? "blue" : "slate"}>{item.priority} priority</Badge></div>
              <div className="learning-body">
                <div className="row-between"><Badge tone="violet">{item.type}</Badge><Button size="icon" variant="ghost" onClick={() => setStatus({ ...status, [item.title]: "Saved" })}><Save size={16} /></Button></div>
                <h3>{item.title}</h3><p><strong>Builds:</strong> {item.skill}</p>
                <div className="course-meta"><span><Gauge size={14} /> {item.level}</span><span><Clock3 size={14} /> {item.duration}</span></div>
                <Button variant={status[item.title] === "In progress" ? "secondary" : "primary"} className="w-full" onClick={() => setStatus({ ...status, [item.title]: status[item.title] === "In progress" ? "Completed" : "In progress" })}>
                  {status[item.title] === "Completed" ? <><Check size={15} /> Completed</> : status[item.title] === "In progress" ? "Mark completed" : <><Play size={15} /> Start learning</>}
                </Button>
                {status[item.title] === "Saved" && <small className="saved-text"><Check size={12} /> Saved to your plan</small>}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card><div className="empty-state"><Search size={26} /><h3>No matching recommendations</h3><p>Try a different search or reset the filter.</p><Button variant="secondary" onClick={() => { setFilter("All"); setSearch("") }}>Reset filters</Button></div></Card>
      )}
    </>
  )
}

function ProgressPage() {
  const [period, setPeriod] = useState("6 months")
  return (
    <>
      <PageIntro eyebrow="Module 6 · Improve" title="See how far you’ve come" description="Connect practice, learning, and readiness into one clear view of your development." action={<SelectField label="View period" value={period} onChange={setPeriod} options={["3 months", "6 months", "12 months"]} />} />
      <div className="progress-hero">
        <div><Badge tone="violet"><Sparkles size={13} /> Monthly progress report</Badge><h2>Your readiness score is up 18 points.</h2><p>Consistent interview practice and stronger resume evidence are making the biggest difference.</p></div>
        <div className="progress-score"><strong>78</strong><span>from 60</span><Badge tone="green"><TrendingUp size={12} /> +30%</Badge></div>
      </div>
      <div className="stats-grid">
        <StatCard icon={Mic} label="Interviews practised" value="8" meta="3 this month" />
        <StatCard icon={BookOpen} label="Activities completed" value="12" meta="4 in progress" tone="violet" />
        <StatCard icon={Award} label="Skills improved" value="5" meta="2 reached proficiency" tone="green" />
        <StatCard icon={Target} label="Remaining gaps" value="3" meta="Down from 7" tone="amber" />
      </div>
      <div className="content-grid wide-left">
        <Card title="Interview score trend" action={<Badge tone="green">+24 points</Badge>}><TrendChart values={[58, 62, 67, 71, 76, 82]} labels={["Dec", "Jan", "Feb", "Mar", "Apr", "May"]} /></Card>
        <Card title="Career readiness">
          <div className="readiness-list">
            {[["Profile strength", 85], ["Resume quality", 76], ["Interview readiness", 82], ["Skill alignment", 69]].map(([label, value]) => <div key={label as string}><div className="row-between"><span>{label}</span><strong>{value}%</strong></div><Progress value={value as number} tone={(value as number) > 80 ? "green" : "violet"} /></div>)}
          </div>
        </Card>
      </div>
      <div className="content-grid">
        <Card title="Skills development">
          <div className="skills-table">
            {[["Data storytelling", "58", "78", "+20"], ["Interview structure", "61", "84", "+23"], ["SQL", "24", "42", "+18"], ["Product metrics", "43", "58", "+15"]].map((row) => <div key={row[0]}><strong>{row[0]}</strong><span>{row[1]}% → {row[2]}%</span><Badge tone="green">{row[3]}</Badge></div>)}
          </div>
        </Card>
        <Card title="Learning status">
          <div className="status-donut-wrap">
            <div className="status-donut"><div><strong>18</strong><span>Activities</span></div></div>
            <div className="donut-legend"><span><i className="green" /> 8 completed</span><span><i className="violet" /> 4 in progress</span><span><i /> 6 pending</span></div>
          </div>
        </Card>
      </div>
      <Card title="Development roadmap">
        <div className="roadmap">
          {[
            ["Complete SQL foundations", "May 18", "Completed", "green"],
            ["Build product metrics project", "May 31", "In progress", "violet"],
            ["Reach 85+ interview score", "June 15", "Next milestone", "blue"],
            ["Apply to 5 target internships", "June 30", "Upcoming", "slate"],
          ].map(([title, date, status, tone], index) => <div className="roadmap-item" key={title}><span className={`roadmap-dot ${tone}`}>{index === 0 ? <Check size={14} /> : index + 1}</span><div><strong>{title}</strong><p>Target · {date}</p></div><Badge tone={tone as "green" | "violet" | "blue" | "slate"}>{status}</Badge></div>)}
        </div>
      </Card>
    </>
  )
}

function App() {
  const pageFromHash = (): Page => {
    const value = window.location.hash.replace("#", "") as Page
    return ["dashboard", "profile", "resume", "interview", "assessment", "learning", "progress"].includes(value) ? value : "dashboard"
  }
  const [page, setPage] = useState<Page>(pageFromHash)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  useEffect(() => {
    const update = () => setPage(pageFromHash())
    window.addEventListener("hashchange", update)
    return () => window.removeEventListener("hashchange", update)
  }, [])
  const navigate = (nextPage: Page) => {
    window.location.hash = nextPage
    setPage(nextPage)
    setSidebarOpen(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  const content = {
    dashboard: <Dashboard navigate={navigate} />,
    profile: <ProfilePage />,
    resume: <ResumePage />,
    interview: <MockInterviewModule onNavigateTab={(tab) => navigate(tab as Page)} />,
    assessment: <AssessmentPage />,
    learning: <LearningPage />,
    progress: <ProgressPage />,
  }[page]
  return (
    <div className="app-shell">
      {sidebarOpen && <button className="mobile-overlay" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand"><div className="logo-mark">N</div><div><strong>NextHire <i>AI</i></strong><span>Smart Interview & Career</span></div></div>
        <nav>
          <p>OVERVIEW</p>
          <button className={page === "dashboard" ? "active" : ""} onClick={() => navigate("dashboard")}><LayoutDashboard size={19} /><span>Dashboard</span></button>
          <p>CAREER WORKSPACE</p>
          {modules.map((item, index) => {
            const IconComponent = item.icon
            return <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => navigate(item.id)}><span className="nav-index">{index + 1}</span><IconComponent size={18} /><span>{item.label}</span></button>
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="mini-progress"><div className="row-between"><span>Career readiness</span><strong>78%</strong></div><Progress value={78} tone="violet" /></div>
          <div className="sidebar-profile"><div className="avatar">MC</div><div><strong>Maya Chen</strong><span>Student plan</span></div><MoreHorizontal size={17} /></div>
        </div>
      </aside>
      <main className="main-shell">
        <header className="topbar">
          <div className="topbar-title"><Button size="icon" variant="ghost" className="menu-trigger" onClick={() => setSidebarOpen(true)}><Menu size={20} /></Button><div><span>NextHire workspace</span><strong>{pageTitles[page]}</strong></div></div>
          <div className="topbar-actions">
            <button className="notification-button" aria-label="Notifications"><Bell size={19} /><i /></button>
            <div className="profile-menu-wrap">
              <button className="profile-trigger" onClick={() => setProfileOpen(!profileOpen)}><div className="avatar">MC</div><div><strong>Maya Chen</strong><span>Product Analyst track</span></div><ChevronDown size={15} /></button>
              {profileOpen && <div className="profile-popover"><strong>Maya Chen</strong><span>maya.chen@university.edu</span><button onClick={() => { navigate("profile"); setProfileOpen(false) }}><UserRound size={15} /> View profile</button><button><Bell size={15} /> Notification settings</button></div>}
            </div>
          </div>
        </header>
        <div className="page-content">{content}</div>
      </main>
    </div>
  )
}

export default App
