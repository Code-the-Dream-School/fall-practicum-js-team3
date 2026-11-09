/*
  SaveProjectDialog: asks for a project name, then sends the current design to the server.

  What it does:
  1. Checks the name in the browser: required, at most 100 characters.
  2. Sends the name and the design (toJSON) with the user's token.
  3. While waiting, disables the buttons and shows 'Saving...'.
  4. On success, keeps the project id and name in the design store and closes.
  5. On failure, shows the problem inside the dialog and keeps it open so the user can retry.
*/
import { useForm } from 'react-hook-form'
import { ApiError } from '../services/apiClient'
import { createProject } from '../services/projectApi'
import { useAuthStore } from '../hooks/useAuthStore'
import { useDesignStore } from '../hooks/useDesignStore'
import FormField from './FormField'
import './SaveProjectDialog.css'

interface SaveProjectFormValues {
  name: string
}

interface SaveProjectDialogProps {
  onClose: () => void
}

export default function SaveProjectDialog({ onClose }: SaveProjectDialogProps) {
  const token = useAuthStore((state) => state.token)
  const project = useDesignStore((state) => state.project)
  const toJSON = useDesignStore((state) => state.toJSON)
  const markSaved = useDesignStore((state) => state.markSaved)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SaveProjectFormValues>({ defaultValues: { name: project?.name ?? '' } })

  async function submitProject({ name }: SaveProjectFormValues) {
    if (!token) {
      setError('root.serverError', { message: 'Please sign in to save your project.' })
      return
    }
    try {
      const saved = await createProject({ name: name.trim(), design: toJSON() }, token)
      markSaved(saved)
      onClose()
    } catch (err) {
      let message = 'Something went wrong. Please try again.'
      if (err instanceof ApiError && err.status === 401) {
        message = 'Your session has expired. Please sign in again.'
      } else if (err instanceof ApiError && (err.status === 400 || err.status === 422)) {
        setError('name', { message: err.message })
        return
      } else if (err instanceof ApiError && err.status === 429) {
        message = 'Too many attempts. Please wait a moment and try again.'
      } else if (err instanceof Error) {
        message = err.message
      }
      setError('root.serverError', { message })
    }
  }

  return (
    <div
      className='save-dialog-backdrop'
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !isSubmitting) onClose()
      }}
    >
      <div className='save-dialog' role='dialog' aria-modal='true' aria-labelledby='save-dialog-title'>
        <h2 id='save-dialog-title'>Save project</h2>
        <form onSubmit={handleSubmit(submitProject)} noValidate>
          <FormField
            id='project-name'
            label='Project name'
            autoComplete='off'
            autoFocus
            error={errors.name}
            registration={register('name', {
              validate: (value) => value.trim().length > 0 || 'Please enter a project name.',
              maxLength: { value: 100, message: 'Project name must be at most 100 characters.' },
            })}
          />

          {errors.root?.serverError && (
            <p role='alert' className='form-error'>
              {errors.root.serverError.message}
            </p>
          )}

          <div className='save-dialog-actions'>
            <button type='button' className='action-btn' onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type='submit' className='action-btn' disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
