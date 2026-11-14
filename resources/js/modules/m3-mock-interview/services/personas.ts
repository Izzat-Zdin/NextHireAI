import type { Persona } from "../types"

export interface PersonaInfo {
  id: Persona
  name: string
  /** One-line description, English and Malay. */
  blurb: { en: string; ms: string }
  /**
   * Speech synthesis tuning. `prefer` picks a female or male voice; pitch only applies to older
   * desktop voices (natural voices keep their own pitch so they don't sound robotic).
   */
  voice: { pitch: number; rate: number; prefer: "female" | "male" }
  /** Short line for the setup page voice check. */
  greeting: { en: string; ms: string }
}

/** Display order on the setup page. Values match interview_sessions.persona. */
export const PERSONAS: PersonaInfo[] = [
  {
    id: "friendly",
    name: "Aisyah",
    blurb: { en: "Friendly HR lead. Good for a first try.", ms: "Ketua HR yang mesra. Sesuai untuk cubaan pertama." },
    voice: { pitch: 1.1, rate: 0.98, prefer: "female" },
    greeting: { en: "Hi, I'm Aisyah. I'll be your interviewer today.", ms: "Hai, saya Aisyah. Saya akan menemu duga anda hari ini." },
  },
  {
    id: "strict",
    name: "Encik Faiz",
    blurb: { en: "Strict tech lead. Asks hard follow-ups.", ms: "Ketua teknikal yang tegas. Soalan susulan yang sukar." },
    voice: { pitch: 0.85, rate: 1.0, prefer: "male" },
    greeting: { en: "Good day, I'm Faiz. Let's get started.", ms: "Selamat sejahtera, saya Faiz. Mari kita mulakan." },
  },
  {
    id: "neutral",
    name: "Ms. Mei Ling",
    blurb: { en: "Calm senior manager. Probes on impact.", ms: "Pengurus kanan yang tenang. Bertanya tentang impak." },
    voice: { pitch: 1.0, rate: 0.95, prefer: "female" },
    greeting: { en: "Hello, I'm Mei Ling. Take your time with each answer.", ms: "Helo, saya Mei Ling. Ambil masa anda untuk setiap jawapan." },
  },
]

export const personaInfo = (id: Persona): PersonaInfo => PERSONAS.find((p) => p.id === id) ?? PERSONAS[0]
