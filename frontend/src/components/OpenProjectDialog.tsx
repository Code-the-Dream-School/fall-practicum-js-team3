/*
  OpenProjectDialog: lets the user pick one of their latest projects and open it in the editor.

  What it does:
  1. Asks the server for the user's projects and keeps the 3 most recently edited.
  2. Shows "Loading your projects...", an error with "Try again", or "No saved projects yet."
     when there is nothing to pick.
  3. The user clicks a project to select it; "Open project" goes to /editor/:id and
     EditorPage loads it.
  4. If the editor has unsaved changes, tells the user they will be lost.
  5. "See all projects" goes to the My Projects page.
*/
import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchProjects } from '../services/projectApi'
import { useAuthStore } from '../hooks/useAuthStore'
import { useDesignStore } from '../hooks/useDesignStore'
import type { Project } from '../types/project'
import './OpenProjectDialog.css'

// A result belongs to one attempt, so an old result is never shown for a new "Try again".
type LoadResult =
  | { attempt: number; status: 'ready'; projects: Project[] }
  | { attempt: number; status: 'error' }

interface OpenProjectDialogProps {
  onClose: () => void
}

const MAX_PROJECTS = 3

export default function OpenProjectDialog({ onClose }: OpenProjectDialogProps) {
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)
  const isDirty = useDesignStore((state) => state.isDirty)
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<LoadResult | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // No result for the current attempt yet means we are still loading.
  const current = result?.attempt === attempt ? result : null

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    fetchProjects(token, '', controller.signal)
      .then(({ projects }) => {
        const latest = [...projects]
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, MAX_PROJECTS)
        setResult({ attempt, status: 'ready', projects: latest })
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setResult({ attempt, status: 'error' })
      })
    return () => controller.abort()
  }, [token, attempt])

  function openSelected() {
    if (!selectedId) return
    onClose()
    navigate(`/editor/${encodeURIComponent(selectedId)}`)
  }

  let content: ReactNode
  if (!token) {
    content = <p role='alert' className='open-dialog-message'>Please sign in to open your projects.</p>
  } else if (!current) {
    content = <p className='open-dialog-message'>Loading your projects...</p>
  } else if (current.status === 'error') {
    content = (
      <div>
        <p role='alert' className='open-dialog-message'>Could not load your projects.</p>
        <button type='button' className='action-btn' onClick={() => setAttempt((value) => value + 1)}>
          Try again
        </button>
      </div>
    )
  } else if (current.projects.length === 0) {
    content = <p className='open-dialog-message'>No saved projects yet.</p>
  } else {
    content = (
      <ul className='open-dialog-list'>
        {current.projects.map((project) => (
          <li key={project.id}>
            <button
              type='button'
              className={`open-dialog-item${project.id === selectedId ? ' is-selected' : ''}`}
              aria-pressed={project.id === selectedId}
              onClick={() => setSelectedId(project.id)}
            >
              <span className='open-dialog-name'>{project.name}</span>
              <span className='open-dialog-date'>
                Edited {new Date(project.updatedAt).toLocaleDateString()}
              </span>
            </button>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div
      className='open-dialog-backdrop'
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
    >
      <div className='open-dialog' role='dialog' aria-modal='true' aria-labelledby='open-dialog-title'>
        <h2 id='open-dialog-title'>Open a project</h2>
        {content}
        {isDirty && (
          <p className='open-dialog-warning'>Unsaved changes in the editor will be lost.</p>
        )}
        <div className='open-dialog-footer'>
          <Link to='/projects' onClick={onClose}>See all projects</Link>
          <div className='open-dialog-actions'>
            <button type='button' className='action-btn' onClick={onClose} autoFocus>
              Cancel
            </button>
            <button type='button' className='action-btn' onClick={openSelected} disabled={!selectedId}>
              Open project
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
