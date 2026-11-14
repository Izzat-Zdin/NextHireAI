import { useRef, useState, type DragEvent } from "react"
import { FileText, UploadCloud, X } from "lucide-react"
import { Button } from "@/components/ui"
import { cn } from "@/lib/utils"
import { ACCEPT_ATTRIBUTE, formatFileSize, validateResumeFile } from "../services/resumeParser"

export default function ResumeUploadZone({
  file,
  onFile,
  onRemove,
  onError,
  disabled,
}: {
  file: File | null
  onFile: (file: File) => void
  onRemove: () => void
  onError: (message: string) => void
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const accept = (candidate?: File | null) => {
    if (!candidate) return
    const problem = validateResumeFile(candidate)
    if (problem) return onError(problem)
    onFile(candidate)
  }

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setDragging(false)
    if (disabled) return
    accept(event.dataTransfer.files?.[0])
  }

  return (
    <div>
      <label
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-muted/30 px-4 py-8 text-center transition-colors",
          "hover:bg-muted/60 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
          dragging && "border-foreground/50 bg-muted",
          disabled && "cursor-not-allowed opacity-60 hover:bg-muted/30",
        )}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        aria-disabled={disabled}
      >
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={ACCEPT_ATTRIBUTE}
          disabled={disabled}
          onChange={(event) => {
            accept(event.target.files?.[0])
            // Allow re-selecting the same file after removing it.
            event.target.value = ""
          }}
        />
        <span className="mb-1 grid size-11 place-items-center rounded-full border bg-background text-foreground shadow-xs">
          <UploadCloud className="size-5" aria-hidden="true" />
        </span>
        <strong className="text-sm font-medium">{dragging ? "Drop your resume here" : "Click to browse or drag & drop your resume"}</strong>
        <p className="max-w-[420px] text-xs leading-relaxed text-muted-foreground">
          PDF, DOCX or TXT · max 5 MB · text-based PDFs only (scanned images can't be read)
        </p>
      </label>

      {file && (
        <div className="mt-3 flex items-center gap-3 rounded-lg border bg-card p-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-md border bg-muted">
            <FileText className="size-4" aria-hidden="true" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <strong className="truncate text-sm font-medium">{file.name}</strong>
            <small className="text-xs text-muted-foreground">
              {formatFileSize(file.size)} · {file.name.split(".").pop()?.toUpperCase()}
            </small>
          </div>
          <Button variant="ghost" size="icon" title="Remove file" onClick={onRemove} disabled={disabled}>
            <X size={16} />
          </Button>
        </div>
      )}
    </div>
  )
}
