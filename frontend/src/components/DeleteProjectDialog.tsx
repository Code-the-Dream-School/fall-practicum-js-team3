import './DeleteProjectDialog.css'

type DeleteProjectDialogProps = {
  projectName: string
  onCancel: () => void
  onConfirm: () => void
  isDeleting: boolean
  errorMessage: string
}

export default function DeleteProjectDialog({
  projectName,
  onCancel,
  onConfirm,
  isDeleting,
  errorMessage,
}: DeleteProjectDialogProps) {
  return (
    <div className="delete-dialog-overlay">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        className="delete-dialog"
      >

        <h2 id="delete-dialog-title">
          Delete project?
        </h2>

        <p className="delete-project-name">
          "{projectName}"
        </p>

        <p id="delete-dialog-description">
          This will permanently delete this project and
          all its data. This cannot be undone.
        </p>

        {errorMessage && (
          <p role="alert" className="delete-dialog-error">
            {errorMessage}
          </p>
        )}

        <div className="delete-dialog-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="delete-confirm-button"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
