/*
  MyProjectsPage: lists the logged-in user's projects.
  The page is always in exactly one of these situations:
  not signed in, loading, session expired, error, no projects yet, or showing the list.
*/
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../hooks/useAuthStore.ts'
import { ApiError } from '../services/apiClient.ts'
import { fetchProjects } from '../services/projectApi.ts'
import type { Project } from '../types/project.ts'

export default function MyProjectsPage() {
  const token = useAuthStore((state) => state.token)
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSessionExpired, setIsSessionExpired] = useState(false)
  // Pressing "Try again" raises this number, which runs the loading effect again
  const [retryCount, setRetryCount] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

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

  // Temporary: the protected route (Kelly's PR) will make this unnecessary
  if (!token) {
    return (
      <main>
        <h1>My Projects</h1>
        <p>Please <Link to='/login'>sign in</Link> to see your projects.</p>
      </main>
    )
  }

    return (
    <main>
      <h1>My Projects</h1>

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

      {!isLoading && errorMessage && (
        <p role='alert'>
          {errorMessage}{' '}
          <button type='button' onClick={() => setRetryCount((count) => count + 1)}>
            Try again
          </button>
        </p>
      )}

      {!isLoading && !isSessionExpired && !errorMessage && projects.length === 0 && (
        debouncedSearch.trim() ? (
          <p>No projects match "{debouncedSearch.trim()}".</p>
        ) : (
          <p>You have no projects yet. <Link to='/'>Start building</Link></p>
        )
      )}

      {!isLoading && !isSessionExpired && !errorMessage && projects.length > 0 && (
        <ul>
          {projects.map((project) => (
            <li key={project.id}>
              <Link to={`/editor/${project.id}`}>{project.name}</Link>
              <span> Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}