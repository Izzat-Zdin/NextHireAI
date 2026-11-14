// Resume persistence via the Laravel API: the original file goes to the private
// `resumes` disk (storage/app/private/resumes/<user_id>/<file>) and the analysis to public.resume.
//
// TODO (Shafinaz): bina semula fail ini. Ikut corak resources/js/modules/m3-mock-interview/services/interviewService.ts.
// Anda akan perlukan: import { api, qs } from "@/lib/api"
// Constants asal: const MAX_STORED_TEXT = 20_000; const FEEDBACK_SUGGESTIONS = 3
import type { ResumeRow } from "@/lib/types"
import type { ResumeAnalysis } from "../types"

/** Plain-text feedback stored in resume.feedback: the summary followed by the top suggestions. */
export function buildFeedback(analysis: Pick<ResumeAnalysis, "summary" | "suggestions">): string {
  // TODO (Shafinaz):
  // 1. Ambil 3 suggestion pertama (FEEDBACK_SUGGESTIONS), setiap satu jadi baris `• ${title}: ${detail}`.
  // 2. Gabung [summary.trim() (atau ""), ...baris] — buang yang kosong — dengan "\n".
  void analysis
  return ""
}

export function sanitizeFileName(name: string) {
  // TODO (Shafinaz): sama seperti sanitizeFileName dalam ResumeController.php:
  // 1. dot = name.lastIndexOf("."); jika dot > 0: base = sebelum dot, ext = dari dot (lowercase, buang selain [a-z0-9.]).
  // 2. base -> .normalize("NFKD") -> ganti run selain [a-zA-Z0-9._-] dengan "-" -> gabung "-" berulang
  //    -> trim "-" / "." di awal & hujung -> slice(0, 80); jika kosong guna "resume".
  // 3. return `${safeBase}${ext}`
  return name
}

export interface SaveResumeInput {
  userId: string
  file?: File | null
  text: string
  targetRole: string
  jobDescription?: string | null
  analysis: ResumeAnalysis
  /** ISO timestamp of when the analysis finished (defaults to the time of saving). */
  analyzedAt?: string
}

export interface SaveResumeResult {
  row: ResumeRow
  /** Set when the analysis was saved but the original file could not be stored. */
  warning: string | null
}

export async function uploadAndSave({ file, text, targetRole, jobDescription, analysis, analyzedAt }: SaveResumeInput): Promise<SaveResumeResult> {
  // TODO (Shafinaz): bina FormData dan POST ke /api/resumes dengan api.postForm<SaveResumeResult>("/api/resumes", form):
  //   "file"            -> file (jika ada), dengan nama sanitizeFileName(file.name)
  //   "file_name"       -> file?.name ?? "Pasted resume.txt"
  //   "file_size"       -> String(file?.size ?? new Blob([text]).size)
  //   "target_role"     -> targetRole
  //   "job_description" -> jobDescription yang di-trim, atau "" jika kosong
  //   "extracted_text"  -> text.slice(0, MAX_STORED_TEXT)
  //   "analysis"        -> JSON.stringify(analysis)
  //   "feedback"        -> buildFeedback(analysis)
  //   "analyzed_at"     -> analyzedAt ?? new Date().toISOString()
  // Server pulangkan { row, warning } (201).
  void [file, text, targetRole, jobDescription, analysis, analyzedAt]
  throw new Error("Belum dibina (TODO)")
}

export async function getResume(id: string): Promise<ResumeRow | null> {
  // TODO (Shafinaz):
  // 1. Jika id bukan UUID (regex /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) -> return null.
  // 2. return api.getOrNull<ResumeRow>(`/api/resumes/${id}`)   (404 -> null)
  void id
  return null
}

export function listResumes(_userId: string, limit = 50): Promise<ResumeRow[]> {
  // TODO (Shafinaz): return api.get<ResumeRow[]>(`/api/resumes${qs({ limit })}`)   (terbaru dahulu)
  void limit
  return Promise.resolve([])
}

export async function deleteResume(row: Pick<ResumeRow, "analysis_id" | "file_path">): Promise<void> {
  // TODO (Shafinaz): await api.delete(`/api/resumes/${row.analysis_id}`)   (server padam row + fail)
  void row
  throw new Error("Belum dibina (TODO)")
}

/** Signed, short-lived download link for the stored file (the backend streams it to the owner only). */
export async function getDownloadUrl(path: string): Promise<string> {
  // TODO (Shafinaz): const { url } = await api.get<{ url: string }>(`/api/resumes/download-url${qs({ path })}`); return url
  void path
  throw new Error("Belum dibina (TODO)")
}

export const resumeService = { uploadAndSave, getResume, listResumes, deleteResume, getDownloadUrl }
