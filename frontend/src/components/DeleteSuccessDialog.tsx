import './DeleteProjectDialog.css'

interface DeleteSuccessDialogProps {
  onClose: () => void
}

export default function DeleteSuccessDialog({
  onClose,
}: DeleteSuccessDialogProps) {
  return (
    <div className='delete-dialog-overlay'>
      <div
        className='delete-dialog'
        role='dialog'
        aria-modal='true'
        aria-labelledby='delete-success-title'
      >
        <h2 id='delete-success-title'>
          Project deleted successfully!
        </h2>

        <button type='button' onClick={onClose} autoFocus>
          OK
        </button>
      </div>
    </div>
  )
}