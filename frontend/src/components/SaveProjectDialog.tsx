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
import { createProject, updateProject } from '../services/projectApi'
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
      const payload = { name: name.trim(), design: toJSON() }
      const saved = project
        ? await updateProject(project.id, payload, token)
        : await createProject(payload, token)
      markSaved(saved)
      onClose()
    } catch (err) {
      let message = 'Could not save your project. Your design is still here; please try again.'
      if (err instanceof ApiError) {
        switch (err.status) {
          case 0:
            message = 'Cannot reach the server. Your design is still here; check your connection and retry.'
            break
          case 400:
          case 422:
            message = 'Some project details are invalid. Check the name and try again.'
            break
          case 401:
            message = 'Your session has expired. Please log in again, then retry saving.'
            break
          case 404:
            message = 'This project could not be found. Your design is still here; try saving again.'
            break
          case 413:
            message = 'This design is too large to save. Remove some shapes and try again.'
            break
          case 500:
            message = 'The server could not save your project. Your design is still here; try again.'
            break
          case 429:
            message = 'Too many save attempts. Please wait a moment and try again.'
            break
          default:
            message = 'Could not save your project. Your design is still here; please try again.'
        }
      } else if (err instanceof Error && err.message.includes('Cannot reach the server')) {
        message = 'Cannot reach the server. Your design is still here; check your connection and retry.'
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
              {isSubmitting ? 'Saving...' : errors.root?.serverError ? 'Retry save' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
