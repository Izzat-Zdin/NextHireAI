import { useId, type ReactNode } from "react"
import { Link } from "@/lib/router"
import { ClipboardList, FileText, History, Mic, RotateCcw, UserRound, Video, VideoOff, Volume2 } from "lucide-react"
import type { Difficulty, InterviewType, Language, Persona, ResumeContext, SetupConfig } from "../../types"
import { ROLE_CHIPS } from "../../services/questions"
import { PERSONAS, personaInfo } from "../../services/personas"
import { useMediaPreview } from "../../hooks/useMediaPreview"
import { useInterviewerVoice } from "../../hooks/useInterviewerVoice"
import { useVoiceInfo } from "../../hooks/interviewerVoices"
import { InterviewerAvatar } from "../avatar/InterviewerAvatar"
import { ChoiceGroup, SegmentedToggle } from "../shared/Choice"
import { Button } from "@/components/shadcn/button"
import { Textarea } from "@/components/shadcn/textarea"
import { cn } from "@/lib/utils"
import { moduleLabel } from "@/components/navigation"

interface SetupPageProps {
  config: SetupConfig
  onChange: (next: SetupConfig) => void
  /** cameraOn: whether the user switched the camera preview on, so the room can keep it on. */
  onStart: (options: { cameraOn: boolean }) => void
  loading?: boolean
  /** undefined while loading, null when the user has no analysed resume */
  resume: ResumeContext | null | undefined
  canRepeat: boolean
  onRepeat: () => void
}

const TYPES: { id: InterviewType; label: string; desc: string }[] = [
  { id: "hr", label: "HR", desc: "Motivation, salary, why this company" },
  { id: "behavioral", label: "Behavioural", desc: "Past situations, told with STAR" },
  { id: "technical", label: "Technical", desc: "Skills for the role, like SQL" },
]
const TYPE_IDS = TYPES.map((t) => t.id)
const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"]
const COUNTS = ["3", "5", "8"] as const
const LANGUAGES = ["en-MY", "ms-MY"] as const

const focusRing = "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring"

function SectionCard({ step, title, optional, children }: { step: number; title: string; optional?: boolean; children: ReactNode }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-4 rounded-2xl border bg-card p-5 text-card-foreground sm:p-6">
      <h2 id={id} className="flex flex-wrap items-center gap-2.5 text-base font-semibold sm:text-[17px]">
        <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-[13px] text-primary-foreground">
          {step}
        </span>
        {title}
        {optional && <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Optional</span>}
      </h2>
      {children}
    </section>
  )
}

export function SetupPage({ config, onChange, onStart, loading, resume, canRepeat, onRepeat }: SetupPageProps) {
  const ids = useId()
  const media = useMediaPreview()
  const voice = useInterviewerVoice(config.persona, config.language)
  const set = (patch: Partial<SetupConfig>) => onChange({ ...config, ...patch })
  const persona = personaInfo(config.persona)
  const voiceInfo = useVoiceInfo(config.language, persona.voice.prefer)
  const isMalay = config.language === "ms-MY"
  const typeLabel = TYPES.find((t) => t.id === config.type)?.label ?? ""
  const role = config.role.trim()
  const roleIsChip = (ROLE_CHIPS as readonly string[]).includes(role)
  const minutes = config.questionCount * 3

  const sourceText =
    config.source === "resume" && resume
      ? "based on your resume"
      : config.source === "jobAd" && config.jobAdText.trim()
        ? "based on the job ad"
        : null

  const toggleSource = (source: "resume" | "jobAd") => set({ source: config.source === source ? "none" : source })

  const micStatus = media.micProblem === "denied" ? "Blocked" : media.micProblem ? "Not found" : !media.micOn ? "Off" : media.micLevel > 6 ? "OK" : "Quiet"

  return (
    <div className="interview-theme mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1.5 text-sm font-medium text-muted-foreground">{moduleLabel(3)}</p>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">New mock interview</h1>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button type="button" variant="outline" className="min-h-11" onClick={onRepeat} disabled={!canRepeat}>
            <RotateCcw aria-hidden="true" /> Repeat last setup
          </Button>
          <Button asChild variant="ghost" className="min-h-11 text-primary hover:text-primary">
            <Link to="/interview/history">
              <History aria-hidden="true" /> Past sessions
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          {/* 1. Job */}
          <SectionCard step={1} title="Which job are you practising for?" optional>
            <div role="group" aria-label="Common roles" className="flex flex-wrap gap-2">
              {ROLE_CHIPS.map((chip) => {
                const selected = role === chip
                return (
                  <button
                    key={chip}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => set({ role: selected ? "" : chip })}
                    className={cn(
                      "min-h-11 rounded-full border px-4 text-sm transition-colors hover:bg-accent/60",
                      focusRing,
                      selected ? "border-2 border-primary bg-[var(--iv-selected)] font-semibold text-primary" : "bg-card font-medium",
                    )}
                  >
                    {chip}
                  </button>
                )
              })}
            </div>

            {/* BUANGG JAPP
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${ids}-role`} className="text-sm text-muted-foreground">
                Or type your own
              </label>
              <input
                id={`${ids}-role`}
                value={roleIsChip ? "" : config.role}
                maxLength={80}
                onChange={(e) => set({ role: e.target.value })}
                placeholder="e.g. Junior QA Engineer. Leave empty for general questions"
                className={cn(
                  "h-12 w-full min-w-0 rounded-lg border bg-background px-3.5 text-[15px] font-medium placeholder:font-normal placeholder:text-muted-foreground",
                  focusRing,
                )}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {resume === undefined ? (
                <div className="flex min-h-20 items-center gap-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  <FileText className="size-5 shrink-0" aria-hidden="true" /> Checking for your resume…
                </div>
              ) : resume ? (
                <button
                  type="button"
                  aria-pressed={config.source === "resume"}
                  onClick={() => toggleSource("resume")}
                  className={cn(
                    "flex min-w-0 items-start gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-accent/60",
                    focusRing,
                    config.source === "resume" ? "border-2 border-primary bg-[var(--iv-selected)]" : "bg-card",
                  )}
                >
                  <FileText className={cn("mt-0.5 size-5 shrink-0", config.source === "resume" ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">Use my resume</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground [overflow-wrap:anywhere]">
                      Questions about your own skills. {resume.fileName}, score {Math.round(resume.score)}
                    </span>
                  </span>
                </button>
              ) : (
                <div aria-disabled="true" className="flex min-w-0 items-start gap-3 rounded-xl border border-dashed p-4">
                  <FileText className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="min-w-0 text-sm">
                    <span className="block font-semibold text-muted-foreground">Use my resume</span>
                    <span className="mt-0.5 block text-muted-foreground">
                      No analysed resume yet.{" "}
                      <Link to="/resume" className="font-medium text-primary underline underline-offset-4">
                        Upload one
                      </Link>
                    </span>
                  </span>
                </div>
              )}

              <button
                type="button"
                aria-pressed={config.source === "jobAd"}
                aria-expanded={config.source === "jobAd"}
                aria-controls={`${ids}-jobad`}
                onClick={() => toggleSource("jobAd")}
                className={cn(
                  "flex min-w-0 items-start gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-accent/60",
                  focusRing,
                  config.source === "jobAd" ? "border-2 border-primary bg-[var(--iv-selected)]" : "bg-card",
                )}
              >
                <ClipboardList className={cn("mt-0.5 size-5 shrink-0", config.source === "jobAd" ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">Paste a job ad</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">Questions match what the company asks for</span>
                </span>
              </button>
            </div>

            {config.source === "jobAd" && (
              <div id={`${ids}-jobad`} className="flex flex-col gap-1.5">
                <label htmlFor={`${ids}-jobad-text`} className="text-sm font-medium">
                  Job ad text
                </label>
                <Textarea
                  id={`${ids}-jobad-text`}
                  value={config.jobAdText}
                  maxLength={5000}
                  onChange={(e) => set({ jobAdText: e.target.value })}
                  placeholder="Paste the requirements or the whole job ad"
                  className="min-h-28 bg-background"
                />
                <p className="text-xs text-muted-foreground">Used only to pick questions for this session. It is not saved.</p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Everything here is optional. With nothing picked, you get general questions for the interview type you choose below.
            </p>
          */}
          
          </SectionCard>
          {/* 2. Type */}
          <SectionCard step={2} title="What kind of interview?">
            <ChoiceGroup
              label="Interview type"
              value={config.type}
              options={TYPE_IDS}
              onChange={(type) => set({ type })}
              className="grid gap-3 sm:grid-cols-3"
              optionClassName="p-4"
              renderOption={(id) => {
                const item = TYPES.find((t) => t.id === id)!
                return (
                  <>
                    <span className="block text-[15px] font-semibold">{item.label}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{item.desc}</span>
                  </>
                )
              }}
            />
          </SectionCard>

          {/* 3. Interviewer */}
          <SectionCard step={3} title="Who interviews you?">
            <ChoiceGroup
              label="Interviewer"
              value={config.persona}
              options={PERSONAS.map((p) => p.id) as Persona[]}
              onChange={(persona) => set({ persona })}
              className="grid gap-3 sm:grid-cols-3"
              optionClassName="flex flex-row items-center gap-3 p-4 sm:flex-col sm:text-center"
              renderOption={(id) => {
                const info = personaInfo(id)
                return (
                  <>
                    <InterviewerAvatar persona={id} state="idle" size={72} decorative className="shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold">{info.name}</span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">{info.blurb.en}</span>
                    </span>
                  </>
                )
              }}
            />
          </SectionCard>

          {/* 4. Settings */}
          <SectionCard step={4} title="Settings">
            <div className="grid gap-5 sm:grid-cols-3">
              <SegmentedToggle label="Difficulty" value={config.difficulty} options={DIFFICULTIES} onChange={(difficulty) => set({ difficulty })} />
              <SegmentedToggle
                label="Questions"
                value={String(config.questionCount) as (typeof COUNTS)[number]}
                options={COUNTS}
                onChange={(count) => set({ questionCount: Number(count) })}
              />
              <SegmentedToggle
                label="Language"
                value={(config.language === "ms-MY" ? "ms-MY" : "en-MY") as (typeof LANGUAGES)[number]}
                options={LANGUAGES}
                onChange={(language) => set({ language: language as Language })}
                format={(v) => (v === "ms-MY" ? "Bahasa Melayu" : "English")}
              />
            </div>
          </SectionCard>
        </div>

        {/* Ready to start? */}
        <aside className="lg:sticky lg:top-6">
          <section
            aria-labelledby={`${ids}-ready`}
            className="flex flex-col gap-4 rounded-2xl bg-[var(--iv-panel)] p-5 text-[var(--iv-panel-fg)] sm:p-6"
          >
            <h2 id={`${ids}-ready`} className="text-base font-semibold">
              Ready to start?
            </h2>
            <p className="text-sm leading-relaxed text-[var(--iv-panel-muted)]" aria-live="polite">
              <strong className="font-semibold text-white">{typeLabel}</strong> interview{" "}
              {role ? (
                <>
                  for <strong className="font-semibold text-white [overflow-wrap:anywhere]">{role}</strong>
                </>
              ) : (
                "with general questions"
              )}{" "}
              with <strong className="font-semibold text-white">{persona.name}</strong> · {config.questionCount} questions, about {minutes} min
              {sourceText ? ` · ${sourceText}` : ""}
            </p>
            <div className="border-t border-white/15" />

            <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-[#141619]">
              <video
                ref={media.setVideoElement}
                autoPlay
                playsInline
                muted
                className={cn("size-full -scale-x-100 object-cover", media.cameraOn ? "block" : "hidden")}
              />
              {!media.cameraOn && <UserRound className="size-10 text-[#8a9099]" aria-hidden="true" />}
              <span className="absolute bottom-2.5 left-2.5 rounded bg-black/60 px-1.5 py-0.5 text-xs text-[var(--iv-panel-muted)]">
                Camera preview · never recorded
              </span>
            </div>
            {media.cameraProblem && (
              <p className="text-sm text-[#f6d9a8]">
                {media.cameraProblem === "denied" ? "Camera access was blocked. You can still practise without it." : "No camera found. You can still practise without it."}
              </p>
            )}

            <div className="flex items-center gap-2.5">
              <span className="w-9 text-sm text-[var(--iv-panel-muted)]">Mic</span>
              <div
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15"
                role="meter"
                aria-label="Microphone level"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={media.micLevel}
              >
                <div className="h-full rounded-full bg-[var(--iv-meter)] transition-[width] duration-75" style={{ width: `${media.micLevel}%` }} />
              </div>
              <span className="w-16 text-right text-sm font-medium text-[var(--iv-panel-muted)]">{micStatus}</span>
            </div>
            {media.micProblem === "denied" && (
              <p className="text-sm text-[#f6d9a8]">The browser blocked the microphone. Allow it from the lock icon in the address bar, or type your answers.</p>
            )}

            <div className="flex flex-wrap gap-2">
              {!media.micOn && (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 flex-1 border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  onClick={() => {
                    void media.startMic()
                    void media.setCameraOn(true)
                  }}
                >
                  <Mic aria-hidden="true" /> Test camera and mic
                </Button>
              )}
              {media.micOn && (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 flex-1 border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  onClick={() => void media.setCameraOn(!media.cameraOn)}
                  aria-pressed={media.cameraOn}
                >
                  {media.cameraOn ? <VideoOff aria-hidden="true" /> : <Video aria-hidden="true" />}
                  {media.cameraOn ? "Camera off" : "Camera on"}
                </Button>
              )}
            </div>
            <div className="flex flex-col gap-2 border-t border-white/15 pt-4">
              <Button
                type="button"
                variant="outline"
                className="min-h-11 border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
                onClick={() => (voice.speaking ? voice.cancel() : void voice.speak(isMalay ? persona.greeting.ms : persona.greeting.en))}
                disabled={!voiceInfo.supported}
              >
                <Volume2 aria-hidden="true" /> {voice.speaking ? "Stop" : `Hear ${persona.name}`}
              </Button>
              <p className="text-sm text-[var(--iv-panel-muted)]" aria-live="polite">
                {!voiceInfo.supported
                  ? "This browser cannot read questions aloud. They are shown on screen instead."
                  : !voiceInfo.name
                    ? voiceInfo.loaded
                      ? "No voice for this language was found in this browser. Questions are shown on screen; Microsoft Edge can read them aloud."
                      : "Loading voices…"
                    : isMalay && !voiceInfo.matchesLanguage
                      ? `This browser has no Malay voice, so questions are read with ${voiceInfo.name}. Open NextHire in Microsoft Edge for a natural Malay voice.`
                      : voiceInfo.natural
                        ? `Questions are read aloud with ${voiceInfo.name}.`
                        : `Questions are read aloud with ${voiceInfo.name}, which can sound robotic. Microsoft Edge has more natural voices.`}
              </p>
            </div>

            <p className="text-sm text-[var(--iv-panel-muted)]">
              Say a few words to test. Headphones help so {persona.name}'s voice isn't picked up by your mic.
            </p>

            <Button
              type="button"
              size="lg"
              className="min-h-13 bg-[var(--iv-bubble)] text-base font-semibold text-[var(--iv-bubble-fg)] hover:bg-white focus-visible:ring-white/50"
              onClick={() => {
                const cameraOn = media.cameraOn
                media.stopMic()
                voice.cancel()
                onStart({ cameraOn })
              }}
              disabled={loading || (config.source === "jobAd" && !config.jobAdText.trim())}
            >
              {loading ? "Preparing…" : "Start interview"}
            </Button>
            {config.source === "jobAd" && !config.jobAdText.trim() && (
              <p className="text-sm text-[#f6d9a8]">Paste the job ad, or turn off "Paste a job ad", to start.</p>
            )}
            <p className="text-xs text-[var(--iv-panel-muted)]">Answers and scores are saved to your history.</p>
          </section>
        </aside>
      </div>
    </div>
  )
}
