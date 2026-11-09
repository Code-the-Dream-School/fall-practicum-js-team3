/*
  ConfirmDeleteShapeDialog: asks "Delete this shape?" before a shape is removed.

  - Cancel (or the Escape key) keeps the shape.
  - Delete shape removes it.
  Cancel gets the focus first, so pressing Enter by accident does not delete anything.
*/
import './SaveProjectDialog.css'
import './ConfirmDeleteShapeDialog.css'

interface ConfirmDeleteShapeDialogProps {
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDeleteShapeDialog({ onConfirm, onCancel }: ConfirmDeleteShapeDialogProps) {
  return (
    <div
      className='save-dialog-backdrop confirm-delete-backdrop'
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onCancel()
      }}
    >
      <div className='save-dialog' role='dialog' aria-modal='true' aria-labelledby='delete-shape-title'>
        <h2 id='delete-shape-title'>Delete this shape?</h2>
        <p>The shape will be removed from your design.</p>
        <div className='save-dialog-actions'>
          <button type='button' className='action-btn' onClick={onCancel} autoFocus>
            Cancel
          </button>
          <button type='button' className='action-btn' onClick={onConfirm}>
            Delete shape
          </button>
        </div>
      </div>
    </div>
  )
}