import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLeagueMembership } from '@/hooks/useLeagueMembership';
import { NoLeagueGate } from '@/components/NoLeagueGate';

interface ProtectedRouteProps {
  children: ReactNode;
  requireLeague?: boolean; // New prop to control league requirement
}

export function ProtectedRoute({ children, requireLeague = true }: ProtectedRouteProps) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { hasLeagues, loading: leagueLoading } = useLeagueMembership();
  const location = useLocation();

  // Show loading while checking authentication and league membership
  if (authLoading || leagueLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Show league gate if user needs to join/create a league
  if (requireLeague && !hasLeagues) {
    return <NoLeagueGate />;
  }

  return <>{children}</>;
}
