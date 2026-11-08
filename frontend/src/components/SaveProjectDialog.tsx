import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { ApiError } from '../services/apiClient';
import { createProject } from '../services/projectApi';
import { useAuthStore } from '../hooks/useAuthStore';
import { useDesignStore } from '../hooks/useDesignStore';
import './SaveProjectDialog.css';

interface SaveProjectDialogProps {
  onClose: () => void;
  onSaved: (name: string) => void;
}

export default function SaveProjectDialog({ onClose, onSaved }: SaveProjectDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const project = useDesignStore((state) => state.project);
  const user = useAuthStore((state) => state.user);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ name: string }>({
    defaultValues: { name: project?.userId === user?.id ? project?.name : '' },
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  const submit = handleSubmit(async ({ name }) => {
    setSaveError(null);
    setNeedsLogin(false);
    const { user: currentUser, token } = useAuthStore.getState();
    if (!currentUser || !token) {
      setNeedsLogin(true);
      setSaveError('Please sign in to save your project.');
      return;
    }

    try {
      const saved = await createProject(name.trim(), useDesignStore.getState().toJSON(), token);
      if (!saved || typeof saved.id !== 'string' || !saved.id || typeof saved.name !== 'string' || !saved.name) {
        throw new Error('The server returned an invalid project response.');
      }
      if (useAuthStore.getState().user?.id !== currentUser.id || useAuthStore.getState().token !== token) {
        throw new Error('Your session changed while saving. Sign in again to continue.');
      }
      useDesignStore.getState().setProject({ id: saved.id, name: saved.name, userId: currentUser.id });
      onSaved(saved.name);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setNeedsLogin(true);
        setSaveError('Your session has expired. Please sign in again to save your project.');
      } else {
        setSaveError(error instanceof Error ? error.message : 'Could not save your project. Please try again.');
      }
    }
  });

  return (
    <dialog
      ref={dialogRef}
      className="save-dialog"
      aria-labelledby="save-dialog-title"
      onCancel={(event) => {
        if (isSubmitting) event.preventDefault();
        else onClose();
      }}
    >
      <form onSubmit={submit} noValidate>
        <h2 id="save-dialog-title">Save project</h2>
        <label htmlFor="project-name">Project name</label>
        <input
          id="project-name"
          autoFocus
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'project-name-error' : undefined}
          disabled={isSubmitting}
          {...register('name', {
            validate: (value) => {
              const name = value.trim();
              if (!name) return 'Enter a project name.';
              if (name.length > 100) return 'Project name must be at most 100 characters.';
              return true;
            },
          })}
        />
        {errors.name && <p id="project-name-error" role="alert">{errors.name.message}</p>}
        {saveError && <p role="alert">{saveError} {needsLogin && <Link to="/login" onClick={onClose}>Sign in</Link>}</p>}
        <div className="save-dialog-actions">
          <button type="button" className="action-btn" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          <button type="submit" className="action-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save project'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
