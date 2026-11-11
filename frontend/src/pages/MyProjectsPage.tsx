/*
  MyProjectsPage: lists the logged-in user's projects.
  The page is always in exactly one of these situations:
  loading, session expired, error, no projects yet, or showing the list.
*/
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../hooks/useAuthStore.ts'
import { ApiError } from '../services/apiClient.ts'
import { fetchProjects, deleteProject } from '../services/projectApi.ts'
import type { Project } from '../types/project.ts'
import DeleteProjectDialog from '../components/DeleteProjectDialog.tsx'

export default function MyProjectsPage() {
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSessionExpired, setIsSessionExpired] = useState(false)
  // Pressing "Try again" raises this number, which runs the loading effect again
  const [retryCount, setRetryCount] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Waits until the user stops typing for 300 ms before updating debouncedSearch
  useEffect(() => {
    const timerId = setTimeout(() => setDebouncedSearch(searchText), 300)
    // If the user types again before 300 ms pass, the old timer is cancelled
    return () => clearTimeout(timerId)
  }, [searchText])

  useEffect(() => {
    if (!token) return

    // Lets us cancel the request if the page closes (or React runs the effect twice in development)
    const controller = new AbortController()

    async function loadProjects() {
      setIsLoading(true)
      setErrorMessage('')
      setIsSessionExpired(false)
      try {
        const response = await fetchProjects(token as string, debouncedSearch, controller.signal)
        setProjects(response.projects)
        setIsLoading(false)
      } catch (error) {
        // A cancelled request is expected. A newer request is already running, so do nothing
        if (error instanceof DOMException && error.name === 'AbortError') return
        if (error instanceof ApiError && error.status === 401) {
          setIsSessionExpired(true)
        } else {
          setErrorMessage('Could not load your projects. Please try again.')
        }
        setIsLoading(false)
      }
    }

    loadProjects()
    return () => controller.abort()
  }, [token, retryCount, debouncedSearch])

    // Deletes the selected project after the user confirms
  async function handleDeleteProject() {
    if (!projectToDelete || !token || isDeleting) return

    const projectId = projectToDelete.id

    setIsDeleting(true)
    setDeleteError('')

    try {
      // Send the DELETE request to the backend
      await deleteProject(token, projectId)

      // Remove the project from the list only after successful deletion
      setProjects((currentProjects) =>
        currentProjects.filter((project) => project.id !== projectId)
      )

      // Close the confirmation dialog
      setProjectToDelete(null)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setIsSessionExpired(true)
        setProjectToDelete(null)
      } else {
        // Keep the dialog open so the user can retry
        setDeleteError('Could not delete the project. Please try again.')
      }
    } finally {
      // Re-enable the buttons
      setIsDeleting(false)
    }
  }

  return (
    <main>
      <div className='projects-header'>
        <h1>My Projects</h1>
        <button
          type='button'
          className='create-project-button'
          onClick={() => navigate('/')}
        >
          + Create New Project
        </button>
      </div>

      <label>
        Search projects{' '}
        <input
          type='search'
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder='Type a project name'
        />
      </label>
      {searchText && (
        <button type='button' onClick={() => setSearchText('')}>
          Clear search
        </button>
      )}

      {isLoading && <p>Loading your projects...</p>}

      {!isLoading && isSessionExpired && (
        <p>Your session has expired. <Link to='/login'>Sign in again</Link></p>
      )}

      {!isLoading && !isSessionExpired && errorMessage && (
        <p role='alert'>
          {errorMessage}{' '}
          <button 
            type='button' 
            onClick={() => setRetryCount((count) => count + 1)}
          >
            Try again
          </button>
        </p>
      )}

      {!isLoading && !isSessionExpired && !errorMessage && projects.length === 0 && (
        debouncedSearch.trim() ? (
          <p>No projects match "{debouncedSearch.trim()}".</p>
        ) : (
          <p>No projects yet.{' '}
            <Link to="/">Create your first project</Link>
          </p>
        )
      )}

      {!isLoading && !isSessionExpired && !errorMessage && projects.length > 0 && (
        <ul>
          {projects.map((project) => (
            <li key={project.id}>
              <Link to={`/editor/${project.id}`}>{project.name}</Link>
              <span> {' '}Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
              <button 
                type="button"
                aria-label={`Delete ${project.name}`} 
                onClick={() => { 
                  setDeleteError('') 
                  setProjectToDelete(project)
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Delete confirmation dialog */}
      {projectToDelete && (
        <DeleteProjectDialog
          projectName={projectToDelete.name}
          onCancel={() => {
            if (isDeleting) return
            setProjectToDelete(null)
            setDeleteError('')
          }}
          onConfirm={handleDeleteProject}
          isDeleting={isDeleting}
          errorMessage={deleteError}
        />
      )}

    </main>
  )
}
