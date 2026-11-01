import { useAuthStore } from "../../hooks/useAuthStore.ts";
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const sessionError = useAuthStore((state) => state.sessionError);

  if (isLoading) {
    // wait
    return <p>Authenticating...</p>;
  }

  if (sessionError) {
    // block protected content, but don't redirect
    return null;
  }

  if (!user) {
    //redirect to /login
    return <Navigate to="/login" replace={true} />;
  }

  return children;
}

export default ProtectedRoute;
