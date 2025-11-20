import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isGlobalAdmin, getUserEntities } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
      return redirectToLogin();
  }

  const hasAdminOrEntityAccess = isGlobalAdmin() || getUserEntities().length > 0;

  if (!hasAdminOrEntityAccess) {
      return redirectToLogin();
  }

  return <>{children}</>;
}

function redirectToLogin() {
    const redirectUrl = import.meta.env.VITE_PUBLIC_REDIRECT_URL;
    if (redirectUrl) {
        window.location.href = redirectUrl;
        return null;
    }
    return <Navigate to="/login" replace />;
}