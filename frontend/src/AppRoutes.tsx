/*
  AppRoutes: decides which page to show for each address in the browser.
    /          -> the existing starter page (App)
    /register  -> the registration page
  /login     -> the sign-in page
  When the app starts, it also checks whether a saved login (token) is still valid,
  so a user who reloads the page stays logged in.
*/
import { useEffect } from 'react';
import { Route, Routes, useBlocker } from 'react-router-dom';
import App from './App.tsx';
import Header from './components/Header.tsx';
import { useAuthStore } from './hooks/useAuthStore.ts';
import { useDesignStore } from './hooks/useDesignStore.ts';
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import MyProjectsPage from './pages/MyProjectsPage.tsx';
import EditorPage from './pages/EditorPage.tsx';
import ProtectedRoute from './components/auth/ProtectedRoute.tsx';

export default function AppRoutes() {
  const loadUser = useAuthStore((state) => state.loadUser);
  const isDirty = useDesignStore((state) => state.isDirty);
  const discardDesign = useDesignStore((state) => state.reset);
  const blocker = useBlocker(isDirty);

  // Runs once at startup. If the page closes first, the request is cancelled
  useEffect(() => {
    const controller = new AbortController();
    loadUser(controller.signal);
    return () => controller.abort();
  }, [loadUser]);

  // Protect in-app navigation, including links and browser Back/Forward.
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (window.confirm('You have unsaved changes. Leave this page and lose them?')) {
      discardDesign();
      blocker.proceed();
    } else {
      blocker.reset();
    }
  }, [blocker, discardDesign]);

  // Protect refresh, tab close, and navigation to another site.
  useEffect(() => {
    if (!isDirty) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [isDirty]);
  return (
    <>
      <Header />
      <Routes>
        <Route
          path='/'
          element={
            <ProtectedRoute>
              <App />
            </ProtectedRoute>
          }
        />
        <Route path='/register' element={<RegisterPage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route
          path='/projects'
          element={
            <ProtectedRoute>
              <MyProjectsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/editor/:id'
          element={
            <ProtectedRoute>
              <EditorPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
