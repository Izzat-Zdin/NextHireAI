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
import { PageIntro } from "@/components/ui"
import { getInterviewStrings } from "../../i18n/interviewStrings"
import { FlowBar } from "../room/RoomParts"

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
  const role = config.role.trim()
  const roleIsChip = (ROLE_CHIPS as readonly string[]).includes(role)

  const toggleSource = (source: "resume" | "jobAd") => set({ source: config.source === source ? "none" : source })

  const micStatus = media.micProblem === "denied" ? "Blocked" : media.micProblem ? "Not found" : !media.micOn ? "Off" : media.micLevel > 6 ? "Good" : "Quiet"
  const micReady = media.micOn && !media.micProblem

  return (
    <div className="interview-theme flex w-full min-w-0 flex-col">
      <PageIntro
        eyebrow={moduleLabel(3)}
        title="New mock interview"
        description="Pick the interview type and interviewer, check your camera and mic, then answer every question before you see your feedback."
        action={
          <>
            <Button type="button" variant="outline" className="pointer-coarse:min-h-11" onClick={onRepeat} disabled={!canRepeat}>
              <RotateCcw aria-hidden="true" /> Repeat last setup
            </Button>
            <Button asChild variant="outline" className="pointer-coarse:min-h-11">
              <Link to="/interview/history">
                <History aria-hidden="true" /> Past sessions
              </Link>
            </Button>
          </>
        }
      />

      <FlowBar step="setup" s={getInterviewStrings("en-MY")} />

      <div className="mt-4 grid min-w-0 items-start gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
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

        {/* Camera check and session summary */}
        <aside className="flex min-w-0 flex-col gap-4 sm:gap-6 lg:sticky lg:top-20">
          <section aria-labelledby={`${ids}-check`} className="flex flex-col gap-4 rounded-2xl border bg-card p-5 text-card-foreground">
            <div className="flex items-center justify-between gap-3">
              <h2 id={`${ids}-check`} className="text-base font-semibold">
                Camera & mic check
              </h2>
              <span
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                  micReady ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-muted text-muted-foreground",
                )}
              >
                <span aria-hidden="true" className={cn("size-1.5 rounded-full", micReady ? "bg-emerald-500" : "bg-muted-foreground")} />
                {micReady ? "Ready" : "Not tested"}
              </span>
            </div>

            <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-[var(--iv-panel)]">
              <video
                ref={media.setVideoElement}
                autoPlay
                playsInline
                muted
                className={cn("size-full -scale-x-100 object-cover", media.cameraOn ? "block" : "hidden")}
              />
              {!media.cameraOn && <UserRound className="size-10 text-[#8a9099]" aria-hidden="true" />}
              <span className="absolute top-2.5 left-2.5 rounded-full bg-black/55 px-2 py-0.5 text-xs text-white">Preview · never recorded</span>
              {media.micOn && (
                <button
                  type="button"
                  onClick={() => void media.setCameraOn(!media.cameraOn)}
                  aria-pressed={media.cameraOn}
                  aria-label={media.cameraOn ? "Turn camera off" : "Turn camera on"}
                  className="absolute bottom-2.5 left-1/2 grid size-10 -translate-x-1/2 place-items-center rounded-full bg-white/15 text-white outline-none hover:bg-white/25 focus-visible:ring-[3px] focus-visible:ring-white/60"
                >
                  {media.cameraOn ? <VideoOff className="size-4" /> : <Video className="size-4" />}
                </button>
              )}
            </div>
            {media.cameraProblem && (
              <p className="text-sm text-[var(--iv-warn-fg)]">
                {media.cameraProblem === "denied" ? "Camera access was blocked. You can still practise without it." : "No camera found. You can still practise without it."}
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Microphone</span>
                <span className="font-semibold">{micStatus}</span>
              </div>
              <div
                className="h-1.5 overflow-hidden rounded-full bg-muted"
                role="meter"
                aria-label="Microphone level"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={media.micLevel}
              >
                <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-75" style={{ width: `${media.micLevel}%` }} />
              </div>
            </div>
            {media.micProblem === "denied" && (
              <p className="text-sm text-[var(--iv-warn-fg)]">The browser blocked the microphone. Allow it from the lock icon in the address bar, or type your answers.</p>
            )}

            <div className="grid grid-cols-2 gap-2 [&>*:only-child]:col-span-2">
              {!media.micOn && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto min-h-11 min-w-0 whitespace-normal px-2 leading-tight"
                  onClick={() => {
                    void media.startMic()
                    void media.setCameraOn(true)
                  }}
                >
                  <Mic aria-hidden="true" /> Test camera and mic
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-11 min-w-0 whitespace-normal px-2 leading-tight"
                onClick={() => (voice.speaking ? voice.cancel() : void voice.speak(isMalay ? persona.greeting.ms : persona.greeting.en))}
                disabled={!voiceInfo.supported}
              >
                <Volume2 aria-hidden="true" /> {voice.speaking ? "Stop" : `Hear ${persona.name}`}
              </Button>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground" aria-live="polite">
              {!voiceInfo.supported
                ? "This browser cannot read questions aloud. They are shown on screen instead."
                : !voiceInfo.name
                  ? voiceInfo.loaded
                    ? "No voice for this language was found in this browser. Questions are shown on screen; Microsoft Edge can read them aloud."
                    : "Loading voices…"
                  : isMalay && !voiceInfo.matchesLanguage
                    ? `This browser has no Malay voice, so questions are read with ${voiceInfo.name}. Open NextHire in Microsoft Edge for a natural Malay voice.`
                    : `Questions are read aloud with ${voiceInfo.name}. Headphones help so ${persona.name}'s voice isn't picked up by your mic.`}
            </p>

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                size="lg"
                className="min-h-12 text-[15px] font-semibold"
                onClick={() => {
                  const cameraOn = media.cameraOn
                  media.stopMic()
                  voice.cancel()
                  onStart({ cameraOn })
                }}
                disabled={loading || (config.source === "jobAd" && !config.jobAdText.trim())}
              >
                <Video aria-hidden="true" /> {loading ? "Preparing…" : "Start interview"}
              </Button>
              {config.source === "jobAd" && !config.jobAdText.trim() && (
                <p className="text-sm text-[var(--iv-warn-fg)]">Paste the job ad, or turn off "Paste a job ad", to start.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
