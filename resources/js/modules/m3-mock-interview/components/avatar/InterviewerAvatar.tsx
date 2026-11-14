import type { JSX, ReactNode } from "react"
import type { Persona } from "../../types"
import { personaInfo } from "../../services/personas"

export type AvatarState = "idle" | "speaking" | "listening" | "thinking"

/* Animation rules from design-reference/avatar-states.html, prefixed iv- to avoid clashes. */
const AVATAR_CSS = `
@keyframes iv-blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
@keyframes iv-nod{0%,100%{transform:rotate(0deg) translateY(0)}50%{transform:rotate(2.5deg) translateY(2px)}}
@keyframes iv-talk{0%,100%{transform:scaleY(.25)}50%{transform:scaleY(1)}}
@keyframes iv-breathe{0%,100%{transform:translateY(0)}50%{transform:translateY(1.5px)}}
.iv-eye{transform-box:fill-box;transform-origin:center;animation:iv-blink 4.2s infinite}
.iv-nod{transform-box:fill-box;transform-origin:50% 85%;animation:iv-nod 2.6s ease-in-out infinite}
.iv-talk{transform-box:fill-box;transform-origin:center;animation:iv-talk .3s ease-in-out infinite}
.iv-breathe{animation:iv-breathe 3.5s ease-in-out infinite}
@media (prefers-reduced-motion: reduce){.iv-eye,.iv-nod,.iv-talk,.iv-breathe{animation:none}}
`

const INDICATOR_CSS = `
@keyframes iv-bar{0%,100%{height:4px}50%{height:12px}}
@keyframes iv-dot{0%,80%,100%{opacity:.25}40%{opacity:1}}
.iv-bar{animation:iv-bar .7s ease-in-out infinite}
.iv-dot{animation:iv-dot 1.2s infinite}
@media (prefers-reduced-motion: reduce){.iv-bar,.iv-dot{animation:none}}
`

const STATE_LABEL: Record<AvatarState, string> = {
  idle: "idle",
  speaking: "speaking",
  listening: "listening",
  thinking: "thinking",
}

/** Smallest mouth opening (fraction of full) when driven by audio, so the mouth never vanishes. */
const MIN_MOUTH_OPEN = 0.2
const MOUTH_RX = 8
const MOUTH_RY = 6

interface Look {
  background: string
  suit: string
  /** Drawn behind the face (hijab, long hair, neck). */
  back: ReactNode
  skin: string
  face: { cx: number; cy: number; rx: number; ry: number }
  /** Drawn over the face (hijab front, fringe). */
  front: ReactNode
  brow: { color: string; width: number; kind: "curve" | "straight"; y: number }
  eye: { color: string; lx: number; rx: number; cy: number; rX: number; rY: number }
  cheeks: boolean
  /** y is the mouth centre; rest = idle mouth path, smile = listening mouth path. */
  mouth: { color: string; y: number; rest: string; smile: string }
}

const LOOKS: Record<Persona, Look> = {
  friendly: {
    background: "#2F4A48",
    suit: "#3E7A74",
    back: (
      <path
        d="M52 112 C48 60 72 36 100 36 C128 36 152 60 148 112 C146 138 128 154 100 158 C72 154 54 138 52 112 Z"
        fill="#D9B8A3"
      />
    ),
    skin: "#E7B48C",
    face: { cx: 100, cy: 99, rx: 31, ry: 37 },
    front: <path d="M66 88 C70 58 130 58 134 88 C124 70 76 70 66 88 Z" fill="#D9B8A3" />,
    brow: { color: "#4A3328", width: 2.5, kind: "curve", y: 85 },
    eye: { color: "#2A2420", lx: 88, rx: 112, cy: 95, rX: 3.5, rY: 4.5 },
    cheeks: true,
    mouth: { color: "#8A3E36", y: 119, rest: "M90 117 Q100 124 110 117", smile: "M90 117 Q100 124 110 117" },
  },
  strict: {
    background: "#3A3F4A",
    suit: "#2B3A55",
    back: <rect x="88" y="128" width="24" height="18" fill="#C98F66" />,
    skin: "#C98F66",
    face: { cx: 100, cy: 100, rx: 32, ry: 38 },
    front: (
      <path
        d="M68 92 C66 60 86 52 100 52 C116 52 136 60 132 92 C128 74 116 68 100 68 C84 68 72 74 68 92 Z"
        fill="#1F1A17"
      />
    ),
    brow: { color: "#1F1A17", width: 3, kind: "straight", y: 85 },
    eye: { color: "#1F1A17", lx: 88, rx: 112, cy: 96, rX: 3.5, rY: 4 },
    cheeks: false,
    mouth: { color: "#6E3A2E", y: 120, rest: "M91 120 L109 120", smile: "M91 119 Q100 123 109 119" },
  },
  neutral: {
    background: "#4A3F36",
    suit: "#8C5A3C",
    back: (
      <>
        <path
          d="M62 120 C56 70 76 48 100 48 C124 48 144 70 138 120 L128 120 L128 90 L72 90 L72 120 Z"
          fill="#2A211C"
        />
        <rect x="90" y="126" width="20" height="18" fill="#F0C9A4" />
      </>
    ),
    skin: "#F0C9A4",
    face: { cx: 100, cy: 100, rx: 30, ry: 36 },
    front: <path d="M70 92 C72 66 128 66 130 92 C118 76 82 76 70 92 Z" fill="#2A211C" />,
    brow: { color: "#2A211C", width: 2.5, kind: "curve", y: 87 },
    eye: { color: "#2A211C", lx: 89, rx: 111, cy: 96, rX: 3.5, rY: 3 },
    cheeks: false,
    mouth: { color: "#9A4A40", y: 119, rest: "M92 117 Q100 121 108 117", smile: "M91 117 Q100 122 109 117" },
  },
}

/** Vertical brow offsets (left, right) per state; negative = raised. */
const BROW_LIFT: Record<AvatarState, [number, number]> = {
  idle: [0, 0],
  speaking: [-1, -1],
  listening: [0, 0],
  thinking: [-2, -4],
}

function browPath(look: Look, side: "l" | "r", lift: number): string {
  const y = look.brow.y + lift
  const [x1, x2] = side === "l" ? [80, 95] : [105, 120]
  if (look.brow.kind === "straight") {
    // Stern brows: inner ends slightly higher, as in the mockup.
    return side === "l" ? `M${x1} ${y + 1} L${x2} ${y - 1}` : `M${x1} ${y - 1} L${x2} ${y + 1}`
  }
  const apex = (x1 + x2) / 2
  return `M${x1} ${y} Q${apex} ${y - 4 + Math.min(lift, 0)} ${x2} ${y}`
}

function Mouth({ look, state, mouthOpen }: { look: Look; state: AvatarState; mouthOpen?: number | null }) {
  const { color, y } = look.mouth
  if (state === "speaking") {
    if (typeof mouthOpen === "number" && Number.isFinite(mouthOpen)) {
      const open = Math.min(1, Math.max(MIN_MOUTH_OPEN, mouthOpen))
      return <ellipse cx="100" cy={y} rx={MOUTH_RX} ry={MOUTH_RY * open} fill={color} />
    }
    return <ellipse className="iv-talk" cx="100" cy={y} rx={MOUTH_RX} ry={MOUTH_RY} fill={color} />
  }
  const d = state === "thinking" ? `M93 ${y} L108 ${y - 2}` : state === "listening" ? look.mouth.smile : look.mouth.rest
  return <path d={d} stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
}

export function InterviewerAvatar({
  persona,
  state,
  mouthOpen,
  size = 120,
  className,
  label,
  decorative = false,
}: {
  persona: Persona
  state: AvatarState
  /** 0..1. When a number is given and state is "speaking", it drives the mouth opening directly (e.g. from TTS audio volume) instead of the looping CSS talk animation. */
  mouthOpen?: number | null
  /** px, default 120 */
  size?: number
  className?: string
  /** Accessible label. Default: `${name}, ${state label}` e.g. "Aisyah, speaking". Pass decorative to hide from screen readers. */
  label?: string
  decorative?: boolean
}): JSX.Element {
  const look = LOOKS[persona] ?? LOOKS.friendly
  const [liftL, liftR] = BROW_LIFT[state]
  const thinking = state === "thinking"
  const eyeDx = thinking ? 3 : 0
  const eyeDy = thinking ? -3 : 0
  const eyeClass = thinking ? undefined : "iv-eye"
  const figureClass = state === "listening" ? "iv-nod" : state === "speaking" ? undefined : "iv-breathe"
  const a11y = decorative
    ? { "aria-hidden": true as const }
    : { role: "img", "aria-label": label ?? `${personaInfo(persona).name}, ${STATE_LABEL[state]}` }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      focusable="false"
      {...a11y}
    >
      <style>{AVATAR_CSS}</style>
      <circle cx="100" cy="100" r="100" fill={look.background} />
      <g className={figureClass}>
        <path d="M34 200 C38 160 62 142 100 142 C138 142 162 160 166 200 Z" fill={look.suit} />
        <path d="M86 142 L100 166 L114 142 Z" fill="#F2F5F4" />
        {look.back}
        <ellipse cx={look.face.cx} cy={look.face.cy} rx={look.face.rx} ry={look.face.ry} fill={look.skin} />
        {look.front}
        <path
          d={browPath(look, "l", liftL)}
          stroke={look.brow.color}
          strokeWidth={look.brow.width}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={browPath(look, "r", liftR)}
          stroke={look.brow.color}
          strokeWidth={look.brow.width}
          fill="none"
          strokeLinecap="round"
        />
        <ellipse
          className={eyeClass}
          cx={look.eye.lx + eyeDx}
          cy={look.eye.cy + eyeDy}
          rx={look.eye.rX}
          ry={look.eye.rY}
          fill={look.eye.color}
        />
        <ellipse
          className={eyeClass}
          cx={look.eye.rx + eyeDx}
          cy={look.eye.cy + eyeDy}
          rx={look.eye.rX}
          ry={look.eye.rY}
          fill={look.eye.color}
        />
        {look.cheeks && (
          <>
            <circle cx="80" cy="109" r="6" fill="#E59A86" opacity={thinking ? 0.35 : 0.45} />
            <circle cx="120" cy="109" r="6" fill="#E59A86" opacity={thinking ? 0.35 : 0.45} />
          </>
        )}
        <Mouth look={look} state={state} mouthOpen={mouthOpen} />
      </g>
    </svg>
  )
}

/** Small inline status for the panel: animated 3 bars for speaking, 3 dots for thinking, nothing for idle/listening. Decorative (aria-hidden). */
export function AvatarStatusIndicator({
  state,
  className,
}: {
  state: AvatarState
  className?: string
}): JSX.Element | null {
  if (state === "speaking") {
    return (
      <span aria-hidden="true" className={`inline-flex h-3 items-end gap-0.5 ${className ?? ""}`}>
        <style>{INDICATOR_CSS}</style>
        {[0, 0.15, 0.3].map((delay) => (
          <span
            key={delay}
            className="iv-bar block w-[3px] rounded-[1px] bg-[#7FB7B1]"
            style={{ height: 4, animationDelay: `${delay}s` }}
          />
        ))}
      </span>
    )
  }
  if (state === "thinking") {
    return (
      <span aria-hidden="true" className={`inline-flex items-center gap-[3px] ${className ?? ""}`}>
        <style>{INDICATOR_CSS}</style>
        {[0, 0.2, 0.4].map((delay) => (
          <span
            key={delay}
            className="iv-dot block size-[5px] rounded-full bg-[#7FB7B1]"
            style={{ animationDelay: `${delay}s` }}
          />
        ))}
      </span>
    )
  }
  return null
}
