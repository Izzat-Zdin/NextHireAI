import { useCallback, useEffect, useRef, useState } from "react"
import { Pause, Play } from "lucide-react"
import type { AnswerRecord, QuestionItem, SetupConfig } from "../../types"
import { getInterviewStrings } from "../../i18n/interviewStrings"
import { personaInfo } from "../../services/personas"
import { addHeardFillers, analyzeTranscript, mergeVocalFillers } from "../../services/speechAnalysis"
import { evaluateAnswerLocally } from "../../services/evaluation"
import { SKIPPED_ANSWER_TEXT } from "../../services/answerStatus"
import { useInterviewerVoice } from "../../hooks/useInterviewerVoice"
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition"
import { useMediaPreview } from "../../hooks/useMediaPreview"
import { useAnswerRecorder } from "../../hooks/useAnswerRecorder"
import type { AvatarState } from "../avatar/InterviewerAvatar"
import { ExitDialog, FlowBar, PageHeading, formatClock } from "./RoomParts"
import { QuestionCard, VideoStage } from "./VideoStage"
import { AnswerCard, type AnswerMode, type UploadedFile } from "./AnswerCard"
import { QuestionPanel, QuestionProgress } from "./QuestionPanel"
import { Button } from "@/components/shadcn/button"
import { moduleLabel } from "@/components/navigation"
import { useImmersiveNav } from "@/components/nav-chrome"
import { cn } from "@/lib/utils"

interface InterviewRoomProps {
  config: SetupConfig
  questions: QuestionItem[]
  /** Camera preview was on in setup, so keep the self-view on. */
  startWithCamera: boolean
  /** Saves the session; the room shows the interviewer "thinking" until it resolves. */
  onFinishSession: (answers: Record<string, AnswerRecord>, finalScore: number, sessionSeconds: number) => Promise<void>
  onExit: () => void
  /** Test account only: show a suggested answer for each question. */
  suggestAnswers?: boolean
  /** Continuing a saved session: answers already given and the question to start on. */
  initialAnswers?: Record<string, AnswerRecord>
  initialIndex?: number
  /** Called after each answer is submitted, so it can be saved straight away. */
  onAnswerSubmitted?: (record: AnswerRecord) => void
  /** "Save and continue later": answers are already saved, the session is marked paused. */
  onSaveForLater?: () => void
  /** Returns a filler-aware transcript of a spoken answer's audio, when that service is configured. */
  transcribeFillers?: (audio: Blob) => Promise<string>
}

/**
 * The interview room. The candidate answers every question in a row:
 *   the interviewer reads the question → the candidate answers (speak, type or upload) → Next.
 * Each answer is scored and saved straight away, but scores stay hidden until the last question;
 * then the feedback page shows them all.
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

  const [index, setIndex] = useState(Math.min(Math.max(0, initialIndex), questions.length - 1))
  const [asking, setAsking] = useState(true)
  const [mode, setMode] = useState<AnswerMode>(speech.supported ? "speak" : "type")
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>(initialAnswers ?? {})
  const [attempts, setAttempts] = useState(1)
  const [seconds, setSeconds] = useState(0)
  const [paused, setPaused] = useState(false)
  const [upload, setUpload] = useState<UploadedFile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [scoring, setScoring] = useState(false)
  const [showExit, setShowExit] = useState(false)
  const [sessionSeconds, setSessionSeconds] = useState(0)

  const question = questions[index]
  const isLast = index === total - 1
  const busyRef = useRef(false)
  const modeRef = useRef(mode)
  modeRef.current = mode

  // Test account only: suggested answer for the question on screen (module loaded on demand).
  const [suggestion, setSuggestion] = useState<string | null>(null)
  useEffect(() => {
    if (!suggestAnswers) return
    let alive = true
    setSuggestion(null)
    import("../../services/suggestedAnswers")
      .then(({ getSuggestedAnswer }) => {
        if (alive) setSuggestion(getSuggestedAnswer({ text: question.text, type: question.type, role: question.role, language: config.language }))
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [suggestAnswers, question.text, question.type, question.role, config.language])

  // ---------------------------------------------------------------- timers
  useEffect(() => {
    const id = window.setInterval(() => setSessionSeconds((n) => n + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  const recording = !asking && mode === "speak" && speech.listening && !paused
  useEffect(() => {
    if (!recording) return
    const id = window.setInterval(() => setSeconds((n) => n + 1), 1000)
    return () => window.clearInterval(id)
  }, [recording])

  // ---------------------------------------------------------------- camera and leaving
  useEffect(() => {
    if (startWithCamera && mode === "speak") void media.setCameraOn(true)
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

  // ---------------------------------------------------------------- recording helpers
  const startRecording = useCallback(() => {
    void speech.start()
    void recorder.start()
  }, [speech, recorder])

  const resetAnswer = useCallback(() => {
    speech.abort()
    recorder.abort()
    speech.reset("")
    setSeconds(0)
    setPaused(false)
    setUpload(null)
    setError(null)
  }, [speech, recorder])

  // ---------------------------------------------------------------- asking a question
  /** Reads the question aloud (mic off), then opens the answer: recording starts by itself in Speak mode. */
  const askToken = useRef(0)
  const ask = useCallback(
    (text: string) => {
      const token = ++askToken.current
      speech.abort()
      recorder.abort()
      setAsking(true)
      void voice.speak(text).then(() => {
        if (token !== askToken.current) return
        setAsking(false)
        if (modeRef.current === "speak") startRecording()
      })
    },
    [speech, recorder, voice, startRecording],
  )

  const askedFor = useRef<number | null>(null)
  useEffect(() => {
    if (askedFor.current === index) return
    askedFor.current = index
    ask(question.text)
  }, [index, question.text, ask])

  /** Skip the rest of the reading and start answering. Cancelling the voice resolves `speak`, which opens the answer. */
  const answerNow = () => voice.cancel()

  const repeatQuestion = () => {
    if (modeRef.current === "speak") resetAnswer()
    ask(question.text)
  }

  // ---------------------------------------------------------------- answer actions
  const changeMode = (next: AnswerMode) => {
    if (next === mode) return
    if (mode === "speak") {
      speech.stop()
      recorder.abort()
      setPaused(false)
      void media.setCameraOn(false)
    }
    setMode(next)
    setError(null)
    if (next === "speak" && !asking && speech.supported) startRecording()
  }

  const togglePause = () => {
    if (asking || mode !== "speak") return
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

  const reRecord = () => {
    setAttempts((n) => n + 1)
    resetAnswer()
    if (mode === "speak") startRecording()
  }

  const finish = async (finalAnswers: Record<string, AnswerRecord>) => {
    voice.cancel()
    speech.abort()
    recorder.abort()
    media.stopMic()
    void media.setCameraOn(false)
    const scores = Object.values(finalAnswers)
      .map((a) => a.evaluation?.overallScore)
      .filter((n): n is number => typeof n === "number")
    const average = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    setSaving(true)
    try {
      await onFinishSession(finalAnswers, average, sessionSeconds)
    } finally {
      setSaving(false)
    }
  }

  /** Scores the answer, saves it, then moves to the next question (or to the feedback after the last one). */
  const next = async () => {
    if (busyRef.current || scoring) return
    const spoken = mode === "speak"
    // Include the phrase still being heard, so the last words are never lost.
    const text = (spoken ? `${speech.transcript} ${speech.interim}` : speech.transcript).replace(/\s+/g, " ").trim()
    if (!text) {
      setError(s.emptyNext)
      return
    }
    busyRef.current = true
    voice.cancel()
    let audio: Blob | null = null
    // Read before abort(): "um" / "uh" the browser showed while listening but left out of the final words.
    const heard = spoken ? speech.heardFillersNow(speech.interim) : {}
    if (spoken) {
      speech.abort()
      audio = await recorder.stop().catch(() => null)
    }
    let metrics = analyzeTranscript(text, spoken ? Math.max(seconds, 1) : null, spoken ? speech.longPauses : null)
    if (spoken) metrics = addHeardFillers(metrics, heard, text)
    // Optional: count "um"/"uh" sounds the browser transcript left out. Any failure keeps the browser count.
    if (audio && transcribeFillers) {
      setScoring(true)
      try {
        metrics = mergeVocalFillers(metrics, text, await transcribeFillers(audio), heard)
      } catch {
        /* service unavailable: score with the browser transcript only */
      } finally {
        setScoring(false)
      }
    }
    const evaluation = evaluateAnswerLocally({ question: question.text, answer: text, type: question.type, role: question.role, speechMetrics: metrics, isMalay })
    const record: AnswerRecord = {
      questionId: question.id,
      questionNumber: question.number,
      questionText: question.text,
      answerText: text,
      durationSeconds: spoken ? seconds : 0,
      audioBlobUrl: null,
      mediaFileName: mode === "upload" ? (upload?.name ?? null) : null,
      mediaKind: spoken ? "audio" : mode === "upload" && upload ? (upload.isVideo ? "video" : "audio") : null,
      attempts,
      evaluation,
      followUpQuestion: null,
    }
    const updated = { ...answers, [question.id]: record }
    setAnswers(updated)
    onAnswerSubmitted?.(record)

    if (isLast) {
      await finish(updated)
      return
    }
    resetAnswer()
    setAttempts(1)
    setIndex((i) => i + 1)
    busyRef.current = false
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

  const stopEverything = () => {
    askToken.current++
    voice.cancel()
    speech.abort()
    recorder.abort()
  }

  const discard = () => {
    setShowExit(false)
    stopEverything()
    onExit()
  }

  const saveForLater = () => {
    if (busyRef.current || !onSaveForLater) return
    busyRef.current = true
    setShowExit(false)
    stopEverything()
    media.stopMic()
    onSaveForLater()
  }

  // ---------------------------------------------------------------- render
  const avatarState: AvatarState = saving || scoring ? "thinking" : voice.speaking ? "speaking" : !asking && mode === "speak" ? "listening" : "idle"
  const roleTitle = config.role.trim() || s.generalRole
  const questionLabel = s.questionXofY(index + 1, total)
  const tip = question.type !== "technical" ? s.starTip : null
  const panelProps = { s, questions, answers, index, seconds, recording }

  return (
    <div className="interview-theme flex w-full min-w-0 flex-col gap-4 sm:gap-5" lang={isMalay ? "ms" : "en"}>
      <PageHeading
        eyebrow={moduleLabel(3)}
        title={roleTitle}
        subtitle={`${s.typeName[config.type]} · ${persona.name}${mode === "speak" ? "" : ` · ${s.cameraOffMode(s.methods[mode].label)}`}`}
      >
        <span
          className={cn(
            "flex min-h-9 items-center justify-center gap-2 rounded-full px-3 text-xs font-semibold tabular-nums",
            recording ? "bg-red-50 text-[#b42318] dark:bg-red-950 dark:text-[#ff8a7a]" : "bg-muted text-muted-foreground",
          )}
        >
          <span aria-hidden="true" className={cn("size-2 rounded-full", recording ? "bg-[#b42318] dark:bg-[#ff8a7a]" : "bg-muted-foreground")} />
          {recording ? s.recording : s.session} · {formatClock(sessionSeconds)}
        </span>
        {mode === "speak" && (
          <Button type="button" variant="outline" className="min-h-10" onClick={togglePause} disabled={asking || saving}>
            {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />} {paused ? s.resume : s.pause}
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          className="min-h-10 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setShowExit(true)}
          disabled={saving}
        >
          {s.endInterview}
        </Button>
      </PageHeading>

      <FlowBar step="interview" s={s} />

      <div className="grid min-w-0 items-start gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
          <div className="lg:hidden">
            <QuestionProgress {...panelProps} />
          </div>

          {mode === "speak" ? (
            <VideoStage
              s={s}
              persona={config.persona}
              state={avatarState}
              mouthOpen={voice.mouthOpen}
              questionLabel={questionLabel}
              questionText={question.text}
              tip={tip}
              asking={asking}
              recording={recording}
              paused={paused}
              setVideoElement={media.setVideoElement}
              cameraOn={media.cameraOn}
              onCameraToggle={() => void media.setCameraOn(!media.cameraOn)}
              onMicToggle={togglePause}
              onRepeat={repeatQuestion}
              onAnswerNow={answerNow}
              onEnd={() => setShowExit(true)}
            />
          ) : (
            <QuestionCard s={s} persona={config.persona} state={avatarState} questionLabel={questionLabel} questionText={question.text} tip={tip} onRepeat={repeatQuestion} />
          )}

          <AnswerCard
            s={s}
            mode={mode}
            onModeChange={changeMode}
            interviewerName={persona.name}
            asking={asking && mode === "speak"}
            speechSupported={speech.supported}
            speechError={speech.error}
            listening={speech.listening}
            paused={paused}
            transcript={speech.transcript}
            interim={speech.interim}
            seconds={seconds}
            onPauseToggle={togglePause}
            onTextChange={(text) => {
              speech.setTranscript(text)
              if (error) setError(null)
            }}
            upload={upload}
            onUpload={(file) => setUpload({ name: file.name, url: URL.createObjectURL(file), isVideo: file.type.startsWith("video/"), size: file.size })}
            onRemoveUpload={() => setUpload(null)}
            error={error}
            busy={scoring || saving}
            isLast={isLast}
            onReRecord={reRecord}
            onNext={() => void next()}
            suggestion={suggestion}
          />
        </div>

        <div className="max-lg:hidden lg:sticky lg:top-6">
          <QuestionPanel {...panelProps} />
        </div>
      </div>

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
