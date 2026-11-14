import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { AnswerRecord, EvaluationResult, QuestionItem, SetupConfig } from "../../types"
import { getInterviewStrings } from "../../i18n/interviewStrings"
import { personaInfo } from "../../services/personas"
import { analyzeTranscript, mergeVocalFillers } from "../../services/speechAnalysis"
import { evaluateAnswerLocally } from "../../services/evaluation"
import { generateProbingFollowUp } from "../../services/questions"
import { SKIPPED_ANSWER_TEXT } from "../../services/answerStatus"
import { useInterviewerVoice } from "../../hooks/useInterviewerVoice"
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition"
import { useMediaPreview } from "../../hooks/useMediaPreview"
import { useAnswerRecorder } from "../../hooks/useAnswerRecorder"
import type { AvatarState } from "../avatar/InterviewerAvatar"
import { ExitDialog, InterviewerPanel, StepBar, type RoomStep } from "./RoomParts"
import { ListenStep, type AnswerMode } from "./ListenStep"
import { AnswerStep, formatClock } from "./AnswerStep"
import { ReviewStep } from "./ReviewStep"
import { FeedbackStep, improvementPoints } from "./FeedbackStep"
import { Button } from "@/components/shadcn/button"
import { moduleLabel } from "@/components/navigation"
import { useImmersiveNav } from "@/components/nav-chrome"

interface InterviewRoomProps {
  config: SetupConfig
  questions: QuestionItem[]
  /** Camera preview was on in setup, so keep the self-view on. */
  startWithCamera: boolean
  /** Saves the session; the room shows the interviewer "thinking" until it resolves. */
  onFinishSession: (answers: Record<string, AnswerRecord>, finalScore: number) => Promise<void>
  onExit: () => void
  /** Test account only: show a suggested answer for each question. */
  suggestAnswers?: boolean
  /** Continuing a saved session: answers already given and the question to start on. */
  initialAnswers?: Record<string, AnswerRecord>
  initialIndex?: number
  /** Called after each main answer is submitted, so it can be saved straight away. */
  onAnswerSubmitted?: (record: AnswerRecord) => void
  /** "Save and continue later": answers are already saved, the session is marked paused. */
  onSaveForLater?: () => void
  /** Returns a filler-aware transcript of a spoken answer's audio, when that service is configured. */
  transcribeFillers?: (audio: Blob) => Promise<string>
}

/**
 * The interview room. One page, one state machine per question:
 *   listen → answer → review → feedback → (next question) … → report
 * A practice follow-up runs through the same four steps but is never saved.
 */
export function InterviewRoom({
  config,
  questions,
  startWithCamera,
  onFinishSession,
  onExit,
  suggestAnswers = false,
  initialAnswers,
  initialIndex = 0,
  onAnswerSubmitted,
  onSaveForLater,
  transcribeFillers,
}: InterviewRoomProps) {
  const s = getInterviewStrings(config.language)
  const isMalay = config.language === "ms-MY"
  const persona = personaInfo(config.persona)
  const total = questions.length

  // The nav gets out of the way while the room is open (sidebar collapses, mobile bar hides).
  useImmersiveNav()

  const voice = useInterviewerVoice(config.persona, config.language)
  const speech = useSpeechRecognition(config.language)
  const media = useMediaPreview()
  const recorder = useAnswerRecorder(Boolean(transcribeFillers))
  const audioRef = useRef<Blob | null>(null)

  const [index, setIndex] = useState(Math.min(Math.max(0, initialIndex), questions.length - 1))
  const [step, setStep] = useState<RoomStep>("listen")
  const [mode, setMode] = useState<AnswerMode>(speech.supported ? "speak" : "type")
  const [followUp, setFollowUp] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>(initialAnswers ?? {})
  const [attempts, setAttempts] = useState(1)
  const [seconds, setSeconds] = useState(0)
  const [paused, setPaused] = useState(false)
  const [upload, setUpload] = useState<{ name: string; url: string; isVideo: boolean } | null>(null)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const [answeredBy, setAnsweredBy] = useState<AnswerMode>("speak")
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [scoring, setScoring] = useState(false)
  const [showExit, setShowExit] = useState(false)
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const [announcement, setAnnouncement] = useState("")

  const question = questions[index]
  const currentText = followUp ?? question.text
  const isLast = index === total - 1
  const headingRef = useRef<HTMLHeadingElement | null>(null)

  // Test account only: suggested answer for the question on screen (module loaded on demand).
  const [suggestion, setSuggestion] = useState<string | null>(null)
  useEffect(() => {
    if (!suggestAnswers) return
    let alive = true
    setSuggestion(null)
    import("../../services/suggestedAnswers")
      .then(({ getSuggestedAnswer }) => {
        if (alive) setSuggestion(getSuggestedAnswer({ text: currentText, type: question.type, role: question.role, language: config.language }))
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [suggestAnswers, currentText, question.type, question.role, config.language])
  const busyRef = useRef(false)

  // ---------------------------------------------------------------- timers
  useEffect(() => {
    const id = window.setInterval(() => setSessionSeconds((n) => n + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  const recordingLive = step === "answer" && mode === "speak" && speech.listening && !paused
  useEffect(() => {
    if (!recordingLive) return
    const id = window.setInterval(() => setSeconds((n) => n + 1), 1000)
    return () => window.clearInterval(id)
  }, [recordingLive])

  // ---------------------------------------------------------------- camera and leaving
  useEffect(() => {
    if (startWithCamera) void media.setCameraOn(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [])

  useEffect(() => () => {
    if (upload) URL.revokeObjectURL(upload.url)
  }, [upload])

  // ---------------------------------------------------------------- interviewer voice
  /** The interviewer talks: the mic is switched off first so her words never reach the answer. */
  const say = useCallback(
    (text: string) => {
      speech.abort()
      return voice.speak(text)
    },
    [speech, voice],
  )

  // Read each new question (or follow-up) aloud when its Listen step opens.
  const spokenFor = useRef<string | null>(null)
  useEffect(() => {
    if (step !== "listen") return
    const key = `${index}:${followUp ?? ""}`
    if (spokenFor.current === key) return
    spokenFor.current = key
    void say(currentText)
  }, [step, index, followUp, currentText, say])

  // Move focus to the new step's heading and announce it.
  useEffect(() => {
    const n = ["listen", "answer", "review", "feedback"].indexOf(step) + 1
    setAnnouncement(`${s.questionXofY(index + 1, total)}. ${n}/4: ${s.steps[step]}`)
    const id = window.setTimeout(() => headingRef.current?.focus(), 30)
    return () => window.clearTimeout(id)
  }, [step, index, followUp, s, total])

  // ---------------------------------------------------------------- per-question reset
  const resetAnswer = useCallback(() => {
    speech.abort()
    recorder.abort()
    audioRef.current = null
    speech.reset("")
    setSeconds(0)
    setPaused(false)
    setUpload(null)
    setReviewError(null)
  }, [speech, recorder])

  // ---------------------------------------------------------------- step actions
  const startAnswering = () => {
    voice.cancel()
    setStep("answer")
    if (mode === "speak") {
      void speech.start()
      void recorder.start()
    }
  }

  const changeMode = (next: AnswerMode) => {
    if (next === mode) return
    if (mode === "speak") {
      speech.stop()
      recorder.abort()
      setPaused(false)
    }
    setMode(next)
    if (step === "answer" && next === "speak" && speech.supported) {
      void speech.start()
      void recorder.start()
    }
  }

  const togglePause = () => {
    if (paused) {
      setPaused(false)
      void speech.start()
      recorder.resume()
    } else {
      setPaused(true)
      speech.stop()
      recorder.pause()
    }
  }

  const finishAnswering = () => {
    if (mode === "speak") {
      speech.stop()
      void recorder.stop().then((blob) => {
        audioRef.current = blob
      })
    }
    setPaused(false)
    setAnsweredBy(mode)
    setStep("review")
  }

  const answerAgain = () => {
    if (!followUp) setAttempts((n) => n + 1)
    resetAnswer()
    setStep("answer")
    if (mode === "speak") {
      void speech.start()
      void recorder.start()
    }
  }

  const submit = async () => {
    const text = speech.transcript.trim()
    if (!text) {
      setReviewError(s.emptyAnswer)
      return
    }
    if (scoring) return
    speech.abort()
    const spoken = answeredBy === "speak"
    let metrics = analyzeTranscript(text, spoken ? Math.max(seconds, 1) : null, spoken ? speech.longPauses : null)
    // Optional: count "um"/"uh" sounds the browser transcript left out. Any failure keeps the browser count.
    const audio = spoken ? audioRef.current : null
    if (audio && transcribeFillers) {
      setScoring(true)
      try {
        metrics = mergeVocalFillers(metrics, text, await transcribeFillers(audio))
      } catch {
        /* service unavailable: score with the browser transcript only */
      } finally {
        setScoring(false)
        audioRef.current = null
      }
    }
    const result = evaluateAnswerLocally({
      question: currentText,
      answer: text,
      type: question.type,
      role: question.role,
      speechMetrics: metrics,
      isMalay,
    })
    setEvaluation(result)

    if (!followUp) {
      const record: AnswerRecord = {
        questionId: question.id,
        questionNumber: question.number,
        questionText: question.text,
        answerText: text,
        durationSeconds: spoken ? seconds : 0,
        audioBlobUrl: null,
        mediaFileName: answeredBy === "upload" ? (upload?.name ?? null) : null,
        mediaKind: answeredBy === "speak" ? "audio" : answeredBy === "upload" && upload ? (upload.isVideo ? "video" : "audio") : null,
        attempts,
        evaluation: result,
        followUpQuestion: null,
      }
      setAnswers((prev) => ({ ...prev, [question.id]: record }))
      onAnswerSubmitted?.(record)
    }
    setStep("feedback")

    const tip = improvementPoints(result)[0]
    const line = [result.strengths[0], tip ? `${s.summaryNext} ${tip}` : ""].filter(Boolean).join(" ")
    void say(line)
  }

  const finish = async (finalAnswers: Record<string, AnswerRecord>) => {
    voice.cancel()
    speech.abort()
    recorder.abort()
    media.stopMic()
    const scores = Object.values(finalAnswers)
      .map((a) => a.evaluation?.overallScore)
      .filter((n): n is number => typeof n === "number")
    const average = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    setSaving(true)
    try {
      await onFinishSession(finalAnswers, average)
    } finally {
      setSaving(false)
    }
  }

  const tryFollowUp = () => {
    const text = generateProbingFollowUp(question.text, speech.transcript, isMalay, config.persona)
    resetAnswer()
    setEvaluation(null)
    setFollowUp(text)
    setStep("listen")
  }

  const next = () => {
    if (busyRef.current) return
    voice.cancel()
    speech.abort()
    if (isLast) {
      busyRef.current = true
      void finish(answers)
      return
    }
    resetAnswer()
    setEvaluation(null)
    setFollowUp(null)
    setAttempts(1)
    setIndex((i) => i + 1)
    setStep("listen")
  }

  // ---------------------------------------------------------------- end early
  const answeredCount = Object.keys(answers).length
  const finishEarly = () => {
    if (busyRef.current) return
    busyRef.current = true
    setShowExit(false)
    const finalAnswers = { ...answers }
    for (const q of questions) {
      if (finalAnswers[q.id]) continue
      finalAnswers[q.id] = {
        questionId: q.id,
        questionNumber: q.number,
        questionText: q.text,
        answerText: SKIPPED_ANSWER_TEXT,
        durationSeconds: 0,
        evaluation: null,
      }
    }
    void finish(finalAnswers)
  }

  const discard = () => {
    setShowExit(false)
    voice.cancel()
    speech.abort()
    recorder.abort()
    onExit()
  }

  const saveForLater = () => {
    if (busyRef.current || !onSaveForLater) return
    busyRef.current = true
    setShowExit(false)
    voice.cancel()
    speech.abort()
    recorder.abort()
    media.stopMic()
    onSaveForLater()
  }

  // ---------------------------------------------------------------- avatar
  const avatarState: AvatarState = saving || scoring
    ? "thinking"
    : voice.speaking
      ? "speaking"
      : step === "answer"
        ? "listening"
        : "idle"

  const roleTitle = config.role.trim() || s.generalRole
  const panelText = useMemo(() => {
    if (step === "review") return s.reviewPrompt
    return currentText
  }, [step, s, currentText])

  const feedbackLine = evaluation
    ? [evaluation.strengths[0], improvementPoints(evaluation)[0] ? `${s.summaryNext} ${improvementPoints(evaluation)[0]}` : ""]
        .filter(Boolean)
        .join(" ")
    : ""

  return (
    <div className="interview-theme mx-auto flex w-full max-w-4xl min-w-0 flex-col gap-4 sm:gap-5" lang={isMalay ? "ms" : "en"}>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-medium text-muted-foreground">{moduleLabel(3)}</p>
          <h1 className="font-heading text-xl font-bold tracking-tight [overflow-wrap:anywhere] sm:text-2xl">{roleTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {s.typeName[config.type]} · {s.questionXofY(index + 1, total)} · {s.session} {formatClock(sessionSeconds)}
          </p>
        </div>
        <Button type="button" variant="outline" className="min-h-11" onClick={() => setShowExit(true)} disabled={saving}>
          {s.endInterview}
        </Button>
      </header>

      <StepBar step={step} s={s} />

      <InterviewerPanel
        persona={config.persona}
        state={avatarState}
        mouthOpen={voice.mouthOpen}
        s={s}
        large={step === "listen"}
        bubble={step === "listen" || step === "feedback"}
      >
        {step === "listen" ? (
          <>
            {followUp && <p className="mb-2 text-xs font-semibold tracking-wide text-[#0e5e5a] uppercase">{s.followUpLabel}</p>}
            <h2 className="font-heading text-lg leading-snug font-medium [overflow-wrap:anywhere] sm:text-[21px]">{currentText}</h2>
            {question.type !== "technical" && <p className="mt-3 text-sm text-[#4a4f59]">{s.starTip}</p>}
          </>
        ) : step === "feedback" ? (
          <p className="text-[15px] leading-relaxed">{feedbackLine}</p>
        ) : (
          <p className="[overflow-wrap:anywhere]">{panelText}</p>
        )}
      </InterviewerPanel>

      <section aria-label={s.youRegion} className="flex min-w-0 flex-col gap-5 rounded-2xl border bg-card p-4 text-card-foreground sm:p-6">
        {step === "listen" && (
          <ListenStep
            s={s}
            mode={mode}
            onModeChange={setMode}
            interviewerName={persona.name}
            onRepeat={() => void say(currentText)}
            onStart={startAnswering}
            headingRef={headingRef}
            suggestion={suggestion}
          />
        )}
        {step === "answer" && (
          <AnswerStep
            s={s}
            mode={mode}
            onModeChange={changeMode}
            headingRef={headingRef}
            speechSupported={speech.supported}
            speechError={speech.error}
            listening={speech.listening}
            paused={paused}
            transcript={speech.transcript}
            interim={speech.interim}
            seconds={seconds}
            onPauseToggle={togglePause}
            onTextChange={speech.setTranscript}
            upload={upload}
            onUpload={(file) => setUpload({ name: file.name, url: URL.createObjectURL(file), isVideo: file.type.startsWith("video/") })}
            setVideoElement={media.setVideoElement}
            cameraOn={media.cameraOn}
            onCameraToggle={() => void media.setCameraOn(!media.cameraOn)}
            onDone={finishAnswering}
            suggestion={suggestion}
          />
        )}
        {step === "review" && (
          <ReviewStep
            s={s}
            text={speech.transcript}
            onTextChange={(text) => {
              speech.setTranscript(text)
              if (reviewError) setReviewError(null)
            }}
            seconds={seconds}
            spoken={answeredBy === "speak"}
            showStar={question.type !== "technical"}
            error={reviewError}
            onAnswerAgain={answerAgain}
            onSubmit={() => void submit()}
            submitting={scoring}
            headingRef={headingRef}
          />
        )}
        {step === "feedback" && evaluation && (
          <FeedbackStep
            s={s}
            evaluation={evaluation}
            spoken={answeredBy === "speak"}
            isFollowUp={Boolean(followUp)}
            isLast={isLast}
            total={total}
            saving={saving}
            exampleAnswer={followUp ? null : evaluation.exampleAnswer || null}
            onFollowUp={tryFollowUp}
            onNext={next}
            headingRef={headingRef}
          />
        )}
      </section>

      <ExitDialog
        open={showExit}
        onOpenChange={setShowExit}
        answered={answeredCount}
        total={total}
        s={s}
        onFinish={finishEarly}
        onDiscard={discard}
        onSaveLater={onSaveForLater ? saveForLater : undefined}
      />
    </div>
  )
}
