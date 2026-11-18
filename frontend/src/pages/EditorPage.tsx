/*
  EditorPage: opens a saved project at /editor/:id.
  It fetches the project, puts its shapes into the design store, and then shows the normal editor.
  While it works the user sees "Loading..."; if the project cannot be opened, a clear message.
*/
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import App from '../App.tsx';
import { useAuthStore } from '../hooks/useAuthStore.ts';
import { useDesignStore } from '../hooks/useDesignStore.ts';
import { ApiError } from '../services/apiClient.ts';
import { fetchProject } from '../services/projectApi.ts';

type LoadState = 'loading' | 'ready' | 'not-found' | 'error';

// The answer of one loading attempt, together with the attempt it belongs to
interface LoadResult {
  key: string;
  state: Exclude<LoadState, 'loading'>;
}

export default function EditorPage() {
  // The ":id" part of the address /editor/:id
  const { id } = useParams();
  const token = useAuthStore((state) => state.token);
  const fromJSON = useDesignStore((state) => state.fromJSON);
  const markSaved = useDesignStore((state) => state.markSaved);

  // Changing this number runs the loading again (the "Try again" button)
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<LoadResult | null>(null);

  // One key per project and attempt. Until an answer arrives for the current key, we are loading
  const requestKey = `${id}-${attempt}`;
  const loadState: LoadState = result?.key === requestKey ? result.state : 'loading';

  useEffect(() => {
    if (!id || !token) return;
    const controller = new AbortController();

    fetchProject(token, id, controller.signal)
      .then((project) => {
        fromJSON(project.design);
        markSaved({ id: project.id, name: project.name });
        setResult({ key: requestKey, state: 'ready' });
      })
      .catch((err: unknown) => {
        // The user left the page before the answer came: nothing to show
        if (err instanceof DOMException && err.name === 'AbortError') return;
        // 404: no such project, or it is not theirs. 400: the id is not valid
        if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
          setResult({ key: requestKey, state: 'not-found' });
        } else {
          setResult({ key: requestKey, state: 'error' });
        }
      });

    return () => controller.abort();
  }, [id, token, requestKey, fromJSON, markSaved]);

  if (loadState === 'loading') {
    return (
      <main>
        <p>Loading your project...</p>
      </main>
    );
  }

  if (loadState === 'not-found') {
    return (
      <main>
        <h1>Project not found</h1>
        <p>This project does not exist, or it is not yours.</p>
        <Link to='/projects'>Back to My Projects</Link>
      </main>
    );
  }

  if (loadState === 'error') {
    return (
      <main>
        <h1>Could not open the project</h1>
        <p>Something went wrong. Please try again.</p>
        <button type='button' onClick={() => setAttempt((n) => n + 1)}>
          Try again
        </button>{' '}
        <Link to='/projects'>Back to My Projects</Link>
      </main>
    );
  }

  return <App />;
}