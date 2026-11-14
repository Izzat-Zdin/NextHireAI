import { useState } from "react"
import { Trash2 } from "lucide-react"
import { Alert, Button, Modal, Spinner } from "@/components/ui"
import { errorMessage } from "@/lib/format"
import type { ResumeRow } from "@/lib/types"
import { deleteResume } from "../services/resumeService"

export default function DeleteResumeModal({
  resume,
  onClose,
  onDeleted,
}: {
  resume: Pick<ResumeRow, "analysis_id" | "file_path" | "file_name">
  onClose: () => void
  onDeleted: () => void
}) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirm = async () => {
    setDeleting(true)
    setError(null)
    try {
      await deleteResume(resume)
      onDeleted()
    } catch (err) {
      setError(errorMessage(err))
      setDeleting(false)
    }
  }

  return (
    <Modal
      title="Delete analysis?"
      onClose={deleting ? () => undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirm} disabled={deleting}>
            {deleting ? <Spinner label="Deleting…" /> : <><Trash2 size={15} /> Delete</>}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-muted-foreground">
        This permanently deletes the report for <strong className="font-semibold text-foreground [overflow-wrap:anywhere]">{resume.file_name}</strong>
        {resume.file_path ? " and the uploaded file" : ""}. This cannot be undone.
      </p>
      {error && (
        <div className="mt-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
    </Modal>
  )
}
