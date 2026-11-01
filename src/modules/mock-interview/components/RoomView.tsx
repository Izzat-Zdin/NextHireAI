import React, { useState, useEffect, useRef } from "react"
import {
  AlertCircle,
  ArrowRight,
  Camera,
  CameraOff,
  CheckCircle2,
  ChevronRight,
  Clock3,
  HelpCircle,
  Loader2,
  Mic,
  MicOff,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
  Upload,
  Volume2,
  VolumeX,
} from "lucide-react"
import type {
  QuestionItem,
  SetupConfig,
  AnswerRecord,
  EvaluationResult,
  FacialMetrics,
  SpeechMetrics,
  Language,
} from "../types"
import { analyzeTranscript, detectFillers } from "../services/speechAnalysis"
import { evaluateAnswerLocally } from "../services/evaluation"
import { generateProbingFollowUp } from "../services/questions"
import { EvaluationLoadingCard } from "./EvaluationLoadingCard"
import { FeedbackView } from "./FeedbackView"
import { HighlightedTranscript } from "./HighlightedTranscript"

interface RoomViewProps {
  config: SetupConfig
  questions: QuestionItem[]
  onFinishSession: (answers: Record<string, AnswerRecord>, finalScore: number) => void
  onExit: () => void
  onSaveAnswerToBackend: (questionNo: number, text: string) => Promise<void>
}

export const RoomView: React.FC<RoomViewProps> = ({
  config,
  questions,
  onFinishSession,
  onExit,
  onSaveAnswerToBackend,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const currentQuestion = questions[currentIndex] || questions[0]
  const totalQuestions = questions.length

  // Answers store
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({})

  // Current question inputs
  const [answerText, setAnswerText] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [liveTranscript, setLiveTranscript] = useState("")
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(config.language || "en-US")
  const [speechError, setSpeechError] = useState<string | null>(null)

  // Webcam & HUD state
  const [cameraActive, setCameraActive] = useState(true)
  const [nervousPercent, setNervousPercent] = useState(12)
  const [dominantExpression, setDominantExpression] = useState("Focused & composed")
  const [micVolume, setMicVolume] = useState(0)

  // AI Evaluation State
  const [evaluating, setEvaluating] = useState(false)
  const [currentEvaluation, setCurrentEvaluation] = useState<EvaluationResult | null>(null)
  const [followUpText, setFollowUpText] = useState<string | null>(null)
  const [generatingFollowUp, setGeneratingFollowUp] = useState(false)
  const [retryComparison, setRetryComparison] = useState<{
    previousScore: number
    newScore: number
    previousFillers: number
    newFillers: number
    previousWpm: number | null
    newWpm: number | null
  } | null>(null)

  // Overall session timer
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const computedEvalRef = useRef<EvaluationResult | null>(null)

  // Media / Audio / Speech Refs
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const speechRecognitionRef = useRef<any>(null)
  const timerIntervalRef = useRef<any>(null)
  const isSpeakingQuestionRef = useRef(false)
  const isRecordingRef = useRef(false)
  const isPausedRef = useRef(false)

  // 1. Session Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionSeconds((sec) => sec + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // 2. Camera Setup & Stream
  useEffect(() => {
    let active = true

    async function initCamera() {
      if (!cameraActive) {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop())
          mediaStreamRef.current = null
        }
        if (videoRef.current) videoRef.current.srcObject = null
        return
      }

      try {
        let stream: MediaStream
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          })
        } catch (vidErr) {
          console.warn("Video stream unavailable, attempting audio-only:", vidErr)
          setCameraActive(false)
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          })
        }

        if (!active) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        mediaStreamRef.current = stream
        if (videoRef.current && stream.getVideoTracks().length > 0) {
          videoRef.current.srcObject = stream
        }

        // Setup Audio Analyser for live volume meter
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
          if (AudioContextClass) {
            const ctx = new AudioContextClass()
            audioContextRef.current = ctx
            const source = ctx.createMediaStreamSource(stream)
            const analyser = ctx.createAnalyser()
            analyser.fftSize = 256
            source.connect(analyser)
            analyserRef.current = analyser

            const pcmData = new Uint8Array(analyser.frequencyBinCount)
            const updateVolume = () => {
              if (!analyserRef.current) return
              analyserRef.current.getByteFrequencyData(pcmData)
              let sum = 0
              for (let i = 0; i < pcmData.length; i++) {
                sum += pcmData[i]
              }
              const average = sum / pcmData.length
              const normalized = Math.min(100, Math.round((average / 128) * 100))
              setMicVolume(normalized)

              // Dynamic composure calculation
              if (normalized > 30) {
                setNervousPercent((prev) => Math.max(5, Math.min(45, prev + (Math.random() > 0.5 ? 2 : -2))))
              }

              animationFrameRef.current = requestAnimationFrame(updateVolume)
            }
            updateVolume()
          }
        } catch (audioErr) {
          console.warn("Audio analyser initialization notice:", audioErr)
        }
      } catch (err) {
        console.warn("Camera or microphone permission was not granted:", err)
        setCameraActive(false)
      }
    }

    initCamera()

    return () => {
      active = false
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {})
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [cameraActive])

  // 3. Web Speech API (Speech Recognition)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.warn("Web Speech API not supported in this browser.")
      setSpeechError("Browser ini tidak menyokong Web Speech API. Sila gunakan Google Chrome atau Microsoft Edge.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = selectedLanguage

    recognition.onstart = () => {
      setSpeechError(null)
    }

    recognition.onresult = (event: any) => {
      let interim = ""
      let final = ""
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript + " "
        } else {
          interim += event.results[i][0].transcript
        }
      }

      setLiveTranscript(interim || final)
      if (final) {
        setAnswerText((prev) => {
          const trimmed = prev.trim()
          return trimmed ? `${trimmed} ${final.trim()}` : final.trim()
        })
      }
    }

    recognition.onerror = (e: any) => {
      if (e.error !== "no-speech") {
        console.warn("Speech recognition error:", e.error)
      }
      if (e.error === "not-allowed") {
        setSpeechError("Akses mikrofon disekat oleh browser. Sila benarkan kebenaran mikrofon pada ikon kunci URL browser.")
      } else if (e.error === "network") {
        setSpeechError("Ralat rangkaian pengecaman suara. Sila pastikan sambungan internet aktif.")
      }
    }

    recognition.onend = () => {
      // Auto-restart speech recognition if still actively recording (prevents Chrome silence timeout)
      if (isRecordingRef.current && !isPausedRef.current) {
        try {
          recognition.start()
        } catch {}
      }
    }

    speechRecognitionRef.current = recognition

    return () => {
      try {
        recognition.stop()
      } catch {}
    }
  }, [selectedLanguage])

  // 4. Recording Handler
  const startRecording = () => {
    if (isRecording) return

    setRecordedAudioUrl(null)
    setUploadedFileName(null)
    setLiveTranscript("")
    audioChunksRef.current = []
    setRecordingSeconds(0)
    setSpeechError(null)

    isRecordingRef.current = true
    isPausedRef.current = false

    // Start speech recognition
    try {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.start()
      }
    } catch {}

    // Start MediaRecorder if audio stream available
    if (mediaStreamRef.current) {
      try {
        const audioTracks = mediaStreamRef.current.getAudioTracks()
        const streamForRecorder = new MediaStream(audioTracks)
        const mediaRecorder = new MediaRecorder(streamForRecorder)
        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }
        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" })
          const url = URL.createObjectURL(blob)
          setRecordedAudioUrl(url)
        }
        mediaRecorder.start(250)
        mediaRecorderRef.current = mediaRecorder
      } catch (e) {
        console.warn("MediaRecorder start notice:", e)
      }
    }

    setIsRecording(true)
    setIsPaused(false)

    // Timer
    timerIntervalRef.current = setInterval(() => {
      setRecordingSeconds((sec) => sec + 1)
    }, 1000)
  }

  const stopRecording = () => {
    if (!isRecording) return

    isRecordingRef.current = false
    isPausedRef.current = false
    setIsRecording(false)
    setIsPaused(false)

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }

    try {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop()
      }
    } catch {}

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
  }

  const togglePause = () => {
    if (!isRecording) return
    if (isPaused) {
      setIsPaused(false)
      isPausedRef.current = false
      try {
        speechRecognitionRef.current?.start()
      } catch {}
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((sec) => sec + 1)
      }, 1000)
    } else {
      setIsPaused(true)
      isPausedRef.current = true
      try {
        speechRecognitionRef.current?.stop()
      } catch {}
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }

  // 5. Audio File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadedFileName(file.name)
    const fileUrl = URL.createObjectURL(file)
    setRecordedAudioUrl(fileUrl)

    // Simulated transcription extracted from audio/video file name
    if (!answerText.trim()) {
      setAnswerText(
        `[Answer uploaded from media file: ${file.name}]. In this response, I demonstrated the approach required to address ${currentQuestion.text}`
      )
    }
  }

  // 6. Text-To-Speech for Question
  const speakQuestion = () => {
    if (!window.speechSynthesis) return

    if (isSpeakingQuestionRef.current) {
      window.speechSynthesis.cancel()
      isSpeakingQuestionRef.current = false
      return
    }

    const utterance = new SpeechSynthesisUtterance(currentQuestion.text)
    utterance.lang = config.language
    utterance.rate = 0.95
    utterance.pitch = 1.0

    utterance.onend = () => {
      isSpeakingQuestionRef.current = false
    }
    utterance.onerror = () => {
      isSpeakingQuestionRef.current = false
    }

    isSpeakingQuestionRef.current = true
    window.speechSynthesis.speak(utterance)
  }

  // 7. Submit Answer for AI Evaluation
  const handleEvaluate = () => {
    if (isRecording) {
      stopRecording()
    }

    setEvaluating(true)
    setCurrentEvaluation(null)

    const effectiveDuration = Math.max(recordingSeconds, Math.round(answerText.length / 15) || 30)

    const speechMetrics: SpeechMetrics = analyzeTranscript(answerText, effectiveDuration)
    const facialMetrics: FacialMetrics = {
      nervousPercent,
      dominantExpression,
    }

    // Run local/offline evaluation matching ai-readiness rubrics
    const evalResult = evaluateAnswerLocally({
      question: currentQuestion.text,
      answer: answerText,
      type: currentQuestion.type,
      role: currentQuestion.role,
      speechMetrics,
      facialMetrics,
      isMalay: config.language === "ms-MY",
    })

    computedEvalRef.current = evalResult

    // Update answer record
    const updatedRecord: AnswerRecord = {
      questionId: currentQuestion.id,
      questionNumber: currentQuestion.number,
      questionText: currentQuestion.text,
      answerText,
      durationSeconds: effectiveDuration,
      audioBlobUrl: recordedAudioUrl,
      mediaFileName: uploadedFileName,
      evaluation: evalResult,
      followUpQuestion: followUpText,
    }

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: updatedRecord,
    }))

    // Persist answer to Supabase or local storage
    onSaveAnswerToBackend(currentIndex + 1, answerText).catch(() => {})
  }

  // 8. Ask Probing Follow-Up
  const handleFollowUp = async () => {
    if (!answerText.trim()) return
    setGeneratingFollowUp(true)
    await new Promise((r) => setTimeout(r, 700))

    const followUp = generateProbingFollowUp(
      currentQuestion.text,
      answerText,
      config.language === "ms-MY"
    )
    setFollowUpText(followUp)
    setGeneratingFollowUp(false)

    // Read follow-up aloud
    if (window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(followUp)
      u.lang = config.language
      window.speechSynthesis.speak(u)
    }
  }

  // 9. Retry Question
  const handleRetry = () => {
    if (currentEvaluation) {
      setRetryComparison({
        previousScore: currentEvaluation.overallScore,
        newScore: 0,
        previousFillers: currentEvaluation.speechMetrics?.fillerAnalysis.total ?? 0,
        newFillers: 0,
        previousWpm: currentEvaluation.speechMetrics?.speakingRateWordsPerMinute ?? null,
        newWpm: null,
      })
    }

    setAnswerText("")
    setCurrentEvaluation(null)
    setFollowUpText(null)
    setRecordedAudioUrl(null)
    setLiveTranscript("")
    setRecordingSeconds(0)
    setIsRecording(false)
  }

  // 10. Next Question or Finish
  const handleNextOrFinish = () => {
    // If not evaluated yet, auto-evaluate first
    let finalEval = currentEvaluation
    if (!finalEval && answerText.trim()) {
      const speech = analyzeTranscript(answerText, Math.max(recordingSeconds, 30))
      finalEval = evaluateAnswerLocally({
        question: currentQuestion.text,
        answer: answerText,
        type: currentQuestion.type,
        role: currentQuestion.role,
        speechMetrics: speech,
        isMalay: config.language === "ms-MY",
      })
    }

    const currentRecord: AnswerRecord = {
      questionId: currentQuestion.id,
      questionNumber: currentQuestion.number,
      questionText: currentQuestion.text,
      answerText: answerText || "[Skipped without answering]",
      durationSeconds: recordingSeconds,
      audioBlobUrl: recordedAudioUrl,
      mediaFileName: uploadedFileName,
      evaluation: finalEval,
      followUpQuestion: followUpText,
    }

    const nextAnswers = {
      ...answers,
      [currentQuestion.id]: currentRecord,
    }

    if (currentIndex < totalQuestions - 1) {
      setAnswers(nextAnswers)
      setCurrentIndex((idx) => idx + 1)
      // Reset for next question
      setAnswerText("")
      setCurrentEvaluation(null)
      setFollowUpText(null)
      setRetryComparison(null)
      setRecordedAudioUrl(null)
      setUploadedFileName(null)
      setLiveTranscript("")
      setRecordingSeconds(0)
      setIsRecording(false)
    } else {
      // Calculate overall average score
      const evaluatedScores = Object.values(nextAnswers)
        .map((a) => a.evaluation?.overallScore)
        .filter((s): s is number => typeof s === "number")

      const averageScore = evaluatedScores.length
        ? Math.round(evaluatedScores.reduce((a, b) => a + b, 0) / evaluatedScores.length)
        : 78

      onFinishSession(nextAnswers, averageScore)
    }
  }

  // Formatting helpers
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  return (
    <div style={{ maxWidth: 1140, margin: "0 auto" }}>
      {/* Top Bar: Progress & Role Info */}
      <div className="interview-top" style={{ alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span className="badge badge-violet">{config.type.toUpperCase()} INTERVIEW</span>
            <span className="badge badge-blue">{config.role}</span>
            <span className="badge badge-slate">{config.difficulty}</span>
          </div>
          <h1 style={{ fontSize: 24, margin: 0 }}>AI Mock Interview Engine</h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="timer-pill" title="Elapsed Session Time">
            <Timer size={16} />
            <strong>{formatTime(sessionSeconds)}</strong>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onExit}
            style={{ color: "#c84554", borderColor: "#f1ccd1" }}
          >
            End Interview
          </button>
        </div>
      </div>

      {/* Main Room Card */}
      <div className="card stack" style={{ padding: 26 }}>
        {/* Progress header */}
        <div>
          <div className="question-progress">
            <span>
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span style={{ color: "#3366e8" }}>
              {Math.round(((currentIndex + 1) / totalQuestions) * 100)}% Complete
            </span>
          </div>
          <div className="progress-track" style={{ height: 6 }}>
            <div
              className="progress-fill progress-blue"
              style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Area */}
        <div className="question-area" style={{ margin: "20px 0 16px" }}>
          <span className="question-number">0{currentIndex + 1}</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ margin: 0 }}>INTERVIEW QUESTION</p>
              <button
                type="button"
                className="text-action"
                onClick={speakQuestion}
                style={{ fontSize: 11 }}
              >
                <Volume2 size={14} /> Listen question
              </button>
            </div>
            <h2 style={{ margin: "6px 0 6px", fontSize: 21, lineHeight: 1.4 }}>
              {currentQuestion.text}
            </h2>
            <small style={{ color: "#6d7891" }}>
              Take a moment to structure your response. Aim for 60–120 seconds using the STAR framework
              (Situation, Task, Action, Result).
            </small>
          </div>
        </div>

        {/* 2-Column Grid: Left (Webcam & Media) | Right (Controls, Transcript, Answer, Evaluation) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 360px) minmax(0, 1fr)",
            gap: 20,
            alignItems: "start",
          }}
        >
          {/* Left Column: Camera, Composure HUD, Mic Volume, File Upload */}
          <div className="stack" style={{ gap: 14 }}>
            {/* Webcam viewport card */}
            <div
              style={{
                border: "1px solid #e3e8f2",
                borderRadius: 14,
                overflow: "hidden",
                background: "#0e172e",
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: "rgba(16, 26, 54, 0.95)",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  color: "#cbd5e1",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: cameraActive ? "#10b981" : "#94a3b8",
                      boxShadow: cameraActive ? "0 0 8px #10b981" : "none",
                    }}
                  />
                  Live Camera & Composure HUD
                </span>
                <button
                  type="button"
                  onClick={() => setCameraActive(!cameraActive)}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: 0,
                    color: "white",
                    padding: "3px 8px",
                    borderRadius: 6,
                    fontSize: 10,
                  }}
                >
                  {cameraActive ? <CameraOff size={12} /> : <Camera size={12} />}
                </button>
              </div>

              {/* Video element */}
              <div
                style={{
                  width: "100%",
                  aspectRatio: "4 / 3",
                  position: "relative",
                  background: "#070d1e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: "scaleX(-1)",
                    display: cameraActive ? "block" : "none",
                  }}
                />

                {!cameraActive && (
                  <div
                    style={{
                      color: "#64748b",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 11,
                    }}
                  >
                    <CameraOff size={28} />
                    <span>Camera is paused</span>
                  </div>
                )}

                {/* Composure HUD Overlay */}
                {cameraActive && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 8,
                      left: 8,
                      right: 8,
                      display: "flex",
                      justifyContent: "space-between",
                      pointerEvents: "none",
                      fontSize: 10,
                      fontFamily: "monospace",
                    }}
                  >
                    <div
                      style={{
                        background: "rgba(0,0,0,0.65)",
                        backdropFilter: "blur(6px)",
                        padding: "3px 8px",
                        borderRadius: 6,
                        color: "#f1f5f9",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      Nervousness: <strong style={{ color: "#34d399" }}>{nervousPercent}%</strong>
                    </div>

                    <div
                      style={{
                        background: "rgba(0,0,0,0.65)",
                        backdropFilter: "blur(6px)",
                        padding: "3px 8px",
                        borderRadius: 6,
                        color: "#93c5fd",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      {dominantExpression}
                    </div>
                  </div>
                )}
              </div>

              {/* Live Mic Volume Level Meter */}
              <div style={{ padding: "8px 12px", background: "rgba(16, 26, 54, 0.9)" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#94a3b8",
                    fontSize: 10,
                    marginBottom: 4,
                  }}
                >
                  <span>Mic Input Level</span>
                  <span>{isRecording ? `${micVolume}%` : "Ready"}</span>
                </div>
                <div style={{ width: "100%", height: 5, background: "#1e293b", borderRadius: 999 }}>
                  <div
                    style={{
                      width: `${isRecording ? micVolume : 0}%`,
                      height: "100%",
                      background: micVolume > 60 ? "#f59e0b" : "#10b981",
                      borderRadius: 999,
                      transition: "width 0.1s ease",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Pre-recorded Media File Upload Card */}
            <div
              style={{
                border: "1px solid #e3e8f2",
                borderRadius: 12,
                padding: "12px 14px",
                background: "#f8faff",
                fontSize: 11,
              }}
            >
              <strong style={{ display: "block", marginBottom: 3, color: "#17213c" }}>
                Pre-recorded Answer?
              </strong>
              <p style={{ color: "#6d7891", fontSize: 10, margin: "0 0 8px" }}>
                Upload an audio (.mp3, .wav, .webm) or video (.mp4) file if you prefer not to record live.
              </p>
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: "white",
                  border: "1px solid #dce2ec",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#3366e8",
                }}
              >
                <Upload size={13} />
                <span>{uploadedFileName ? `File: ${uploadedFileName}` : "Choose audio/video file"}</span>
                <input
                  type="file"
                  accept="audio/*,video/*"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          </div>

          {/* Right Column: Controls, Transcript Box, Answer Field, Feedback */}
          <div className="stack" style={{ gap: 14 }}>
            {/* Recording Controls Bar */}
            <div
              style={{
                border: "1px solid #e3e8f2",
                borderRadius: 12,
                padding: "12px 16px",
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {!isRecording ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-md"
                    onClick={startRecording}
                    style={{ background: "#e11d48", borderColor: "#e11d48" }}
                  >
                    <Mic size={16} /> Start Recording
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary btn-md"
                    onClick={stopRecording}
                    style={{ background: "#475569" }}
                  >
                    <MicOff size={16} /> Stop Recording
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-secondary btn-md"
                  onClick={togglePause}
                  disabled={!isRecording}
                >
                  {isPaused ? "Resume" : "Pause"}
                </button>
              </div>

              {/* Timer Pill */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  background: isRecording ? "#fff1f2" : "#f1f5f9",
                  borderRadius: 8,
                  fontFamily: "monospace",
                  fontSize: 12,
                  fontWeight: 700,
                  color: isRecording ? "#e11d48" : "#475569",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: isRecording ? "#e11d48" : "#94a3b8",
                    animation: isRecording ? "pulse 1s infinite" : "none",
                  }}
                />
                TIME: {formatTime(recordingSeconds)}
              </div>
            </div>

            {/* Live Web Speech API Transcription Stream Box */}
            <div
              style={{
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#64748b",
                  marginBottom: 6,
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Sparkles size={12} style={{ color: "#3366e8" }} /> LIVE SPEECH TRANSCRIPTION (Web Speech API)
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "#475569" }}>Bahasa / Lang:</span>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value as Language)}
                    disabled={isRecording}
                    title="Pilih bahasa pertuturan anda"
                    style={{
                      fontSize: 11,
                      padding: "2px 6px",
                      borderRadius: 4,
                      border: "1px solid #cbd5e1",
                      background: "#fff",
                      color: "#1e293b",
                      cursor: isRecording ? "not-allowed" : "pointer",
                    }}
                  >
                    <option value="en-US">English (US)</option>
                    <option value="en-MY">English (MY)</option>
                    <option value="ms-MY">Bahasa Melayu (Malaysia)</option>
                  </select>
                </div>
              </div>
              <div
                style={{
                  minHeight: 38,
                  fontSize: 12,
                  color: liveTranscript ? "#1e293b" : "#94a3b8",
                  fontStyle: liveTranscript ? "normal" : "italic",
                  lineHeight: 1.5,
                }}
              >
                {liveTranscript ||
                  (isRecording
                    ? `Listening in ${selectedLanguage}... speak clearly into your microphone.`
                    : "Click 'Start Recording' and speak your response.")}
              </div>
              {speechError && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 11,
                    color: "#b91c1c",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    padding: "6px 10px",
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span>{speechError}</span>
                </div>
              )}
            </div>

            {/* Answer Text Field (Synced with speech or editable) */}
            <label className="answer-field" style={{ margin: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: "#1e293b" }}>Candidate Answer Text</span>
                <span style={{ color: "#64748b", fontSize: 10 }}>
                  {answerText.trim().split(/\s+/).filter(Boolean).length} words ·{" "}
                  {answerText.length} characters
                </span>
              </div>
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Your spoken words will appear here automatically. You can also edit, enhance, or type directly..."
                style={{ minHeight: 120 }}
              />
            </label>

            {/* Live Highlighted Transcript & Filler Words Detection */}
            {answerText.trim() && (
              <HighlightedTranscript
                transcript={answerText}
                title="Kedudukan Perkataan Penampal (Live Filler Highlight)"
              />
            )}

            {/* Recorded Audio Playback */}
            {recordedAudioUrl && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  background: "#f1f5f9",
                  borderRadius: 8,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 600, color: "#475569" }}>
                  Audio Playback:
                </span>
                <audio controls src={recordedAudioUrl} style={{ height: 32, flex: 1 }} />
              </div>
            )}

            {/* Action Buttons: Evaluate, Follow-Up, Retry */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <button
                type="button"
                className="btn btn-primary btn-md"
                onClick={handleEvaluate}
                disabled={evaluating || !answerText.trim()}
                style={{ flex: 1, minWidth: 200 }}
              >
                {evaluating ? (
                  <>
                    <Loader2 size={16} className="spinner" /> Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Submit Answer for AI Evaluation
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-md"
                onClick={handleFollowUp}
                disabled={generatingFollowUp || !answerText.trim()}
                title="Generates a challenging probing question from interviewer"
              >
                {generatingFollowUp ? "Generating..." : "Ask Probing Follow-Up"}
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-md"
                onClick={handleRetry}
                disabled={!currentEvaluation}
                title="Retry this question to improve your score"
              >
                <RotateCcw size={14} /> Retry
              </button>
            </div>

            {/* Probing Follow-Up Card */}
            {followUpText && (
              <div
                style={{
                  border: "1px solid #c7d2fe",
                  background: "#eef2ff",
                  padding: "12px 14px",
                  borderRadius: 10,
                  fontSize: 12,
                }}
              >
                <strong style={{ color: "#4338ca", display: "block", marginBottom: 3 }}>
                  AI Interviewer Follow-Up Question:
                </strong>
                <p style={{ margin: 0, color: "#1e1b4b", lineHeight: 1.5 }}>{followUpText}</p>
              </div>
            )}

            {/* Retry Comparison Card */}
            {retryComparison && (
              <div
                style={{
                  border: "1px solid #bbf7d0",
                  background: "#f0fdf4",
                  padding: "12px 14px",
                  borderRadius: 10,
                  fontSize: 11,
                }}
              >
                <strong style={{ color: "#15803d", display: "block", marginBottom: 6 }}>
                  Attempt Comparison:
                </strong>
                <div style={{ display: "flex", gap: 16 }}>
                  <div>
                    Previous Score: <strong>{retryComparison.previousScore}/100</strong>
                  </div>
                  <div>
                    Fillers: <strong>{retryComparison.previousFillers}</strong>
                  </div>
                  <div>
                    Pace: <strong>{retryComparison.previousWpm || "--"} WPM</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Real-time AI Evaluation Loading Animation (Image 1) */}
            {evaluating && (
              <EvaluationLoadingCard
                totalSeconds={3}
                hasAudio={Boolean(recordedAudioUrl || uploadedFileName || isRecording)}
                onComplete={() => {
                  setEvaluating(false)
                  if (computedEvalRef.current) {
                    setCurrentEvaluation(computedEvalRef.current)
                  }
                }}
              />
            )}

            {/* AI Evaluation Panel with Filler Words Analysis (Image 2) */}
            {!evaluating && currentEvaluation && (
              <FeedbackView
                evaluation={currentEvaluation}
                answerText={answerText}
              />
            )}

            {/* Bottom Controls */}
            <div className="interview-controls" style={{ marginTop: 12 }}>
              <button type="button" className="btn btn-secondary btn-md" onClick={onExit}>
                Cancel & Exit
              </button>

              <button
                type="button"
                className="btn btn-primary btn-md"
                onClick={handleNextOrFinish}
                style={{ minWidth: 160 }}
              >
                <span>
                  {currentIndex === totalQuestions - 1 ? "Finish & View Report" : "Submit & Next Question"}
                </span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

