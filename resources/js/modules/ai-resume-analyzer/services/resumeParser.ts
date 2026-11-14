// Browser-side text extraction for PDF (pdfjs-dist), DOCX (mammoth) and TXT resumes.
//
// TODO (Shafinaz): bina semula fail ini. Imports asal (package sudah ada dalam package.json):
//   import { GlobalWorkerOptions, getDocument } from "pdfjs-dist"
//   import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"
//   import mammoth from "mammoth"
//   GlobalWorkerOptions.workerSrc = workerUrl
// Constants di bawah ialah data (sudah siap) — jangan ubah, page/komponen guna nilainya.
import type { ParsedResume } from "../types"

export const MAX_FILE_SIZE = 5 * 1024 * 1024
export const MIN_TEXT_LENGTH = 100
export const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt"]
export const ACCEPT_ATTRIBUTE =
  ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"

// TODO (Shafinaz): helper/const lain yang perlu ditulis semula:
//   const UNREADABLE_MESSAGE = "Could not read text — scanned PDFs are not supported; try DOCX or paste text."
//   type FileKind = "pdf" | "docx" | "txt"
//   function fileKind(file): FileKind | null  -> ikut hujung nama fail (lowercase): .pdf / .docx / .txt, selain itu null

export function formatFileSize(bytes?: number | null) {
  // TODO (Shafinaz):
  //   !bytes -> "—";  < 1024 -> `${bytes} B`;  < 1 MB -> `${Math.round(bytes / 1024)} KB`;
  //   selain itu `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  void bytes
  return "—"
}

/** Returns an error message when the file can't be analysed, otherwise null. */
export function validateResumeFile(file: File): string | null {
  // TODO (Shafinaz): pulangkan mesej ralat (string) atau null jika OK, ikut urutan ini:
  //   1. jenis tidak disokong: jika nama berakhir ".doc" ->
  //        "Old .doc files are not supported. Save it as .docx or PDF and try again."
  //      selain itu -> "Unsupported file type. Upload a PDF, DOCX or TXT file."
  //   2. file.size === 0 -> "This file is empty."
  //   3. file.size > MAX_FILE_SIZE -> `File is too large (${formatFileSize(file.size)}). The maximum size is 5 MB.`
  //   4. return null
  void file
  return null
}

/** Normalises whitespace while keeping meaningful line breaks. */
export function normaliseText(raw: string) {
  // TODO (Shafinaz): urutan:
  //   \r\n atau \r -> \n;  non-breaking space (U+00A0) -> " ";  run [ \t\f\v]+ -> satu space;
  //   trim setiap baris;  3 atau lebih \n berturut -> "\n\n";  trim keseluruhan.
  return raw
}

// TODO (Shafinaz): async function extractPdf(file): Promise<{ text: string; pageCount: number }>
//   1. data = new Uint8Array(await file.arrayBuffer()); pdf = await getDocument({ data }).promise
//   2. Untuk setiap page 1..numPages: content = await page.getTextContent(); bina string `out`:
//      - abaikan item tanpa "str"/"transform"; x = transform[4], y = transform[5]
//      - lineHeight = Math.max(2, (item.height || 10) * 0.5)
//      - jika |y - lastY| > lineHeight -> baris baru ("\n" jika out belum berakhir dengan \n), reset lastEndX
//      - else jika baris sama dan ada jurang (x - lastEndX > 1) dan out/str tidak sudah ada space -> tambah " "
//      - out += item.str; jika str tidak kosong: lastY = y, lastEndX = x + width
//      - jika item.hasEOL -> out += "\n", reset lastEndX
//      - page.cleanup()
//   3. finally: void pdf.destroy(). Return { text: pages.join("\n\n"), pageCount: pdf.numPages }
// TODO (Shafinaz): async function extractDocx(file) -> (await mammoth.extractRawText({ arrayBuffer })).value

/** Extracts plain text from a resume file. Throws a readable Error on failure. */
export async function parseResumeFile(file: File): Promise<ParsedResume> {
  // TODO (Shafinaz):
  // 1. const invalid = validateResumeFile(file); jika ada -> throw new Error(invalid)
  // 2. Ikut fileKind: pdf -> extractPdf (simpan pageCount); docx -> extractDocx; txt -> await file.text()
  // 3. Jika extraction gagal (catch):
  //      error.name === "PasswordException"   -> "This PDF is password-protected. Remove the password and try again."
  //      error.name === "InvalidPDFException" -> "This PDF appears to be damaged or is not a valid PDF file."
  //      selain itu -> `We couldn't open this ${KIND} file. Try saving it again or paste the text instead.` (KIND = PDF/DOCX/TXT)
  // 4. text = normaliseText(raw); jika bilangan aksara bukan-whitespace < MIN_TEXT_LENGTH -> throw UNREADABLE_MESSAGE
  // 5. return { text, fileName: file.name, source: kind, pageCount }
  void file
  throw new Error("Belum dibina (TODO)")
}

/** Validates pasted resume text. */
export function parsePastedText(raw: string): ParsedResume {
  // TODO (Shafinaz):
  // 1. text = normaliseText(raw)
  // 2. jika aksara bukan-whitespace < MIN_TEXT_LENGTH ->
  //      throw new Error(`Paste at least ${MIN_TEXT_LENGTH} characters of resume text so we can analyse it.`)
  // 3. return { text, fileName: "Pasted resume.txt", source: "paste" }
  void raw
  throw new Error("Belum dibina (TODO)")
}
