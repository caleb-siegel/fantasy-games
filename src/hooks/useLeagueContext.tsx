import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { apiService } from '@/services/api';

// League context for breadcrumb navigation
interface League {
  id: number;
  name: string;
  member_count: number;
  is_commissioner: boolean;
  invite_code: string;
  is_setup_complete: boolean;
  setup_completed_at: string | null;
  created_at: string;
}

interface User {
  id: number;
  username: string;
}

interface LeagueContextType {
  currentLeague: League | null;
  currentUser: User | null;
  loading: boolean;
  refreshCurrentLeague: () => Promise<void>;
  refreshCurrentUser: (userId: number) => Promise<void>;
  clearCurrentLeague: () => void;
  clearCurrentUser: () => void;
}

const LeagueContext = createContext<LeagueContextType | undefined>(undefined);

export const useLeagueContext = () => {
  const context = useContext(LeagueContext);
  if (context === undefined) {
    throw new Error('useLeagueContext must be used within a LeagueContextProvider');
  }
  return context;
};

interface LeagueContextProviderProps {
  children: ReactNode;
}

export const LeagueContextProvider = ({ children }: LeagueContextProviderProps) => {
  const [currentLeague, setCurrentLeague] = useState<League | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const params = useParams<{ leagueId?: string; userId?: string }>();

  const refreshCurrentLeague = useCallback(async () => {
    const leagueId = params.leagueId;
    
    if (!leagueId || !location.pathname.includes('/leagues/')) {
      setCurrentLeague(null);
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.getLeague(parseInt(leagueId));
      setCurrentLeague(response.league);
    } catch (error) {
      console.error('Failed to fetch current league:', error);
      setCurrentLeague(null);
    } finally {
      setLoading(false);
    }
  }, [params.leagueId, location.pathname]);

  const refreshCurrentUser = useCallback(async (userId: number) => {
    const leagueId = params.leagueId;
    if (!leagueId) return;
    
    try {
      setLoading(true);
      const response = await apiService.getPlayerProfile(parseInt(leagueId), userId) as { profile: { username: string } };
      
      if (response.profile && response.profile.username) {
        const userData = { id: userId, username: response.profile.username };
        setCurrentUser(userData);
      } else {
        const fallbackUser = { id: userId, username: `User ${userId}` };
        setCurrentUser(fallbackUser);
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      const fallbackUser = { id: userId, username: `User ${userId}` };
      setCurrentUser(fallbackUser);
    } finally {
      setLoading(false);
    }
  }, [params.leagueId]);

  const clearCurrentLeague = useCallback(() => {
    setCurrentLeague(null);
  }, []);

  const clearCurrentUser = useCallback(() => {
    setCurrentUser(null);
  }, []);

  // Effect for league changes
  useEffect(() => {
    refreshCurrentLeague();
  }, [params.leagueId, location.pathname]);

  // Effect for user changes
  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    if (pathSegments[0] === 'leagues' && pathSegments[2] === 'players' && pathSegments[3]) {
      const userId = parseInt(pathSegments[3]);
      if (!isNaN(userId)) {
        refreshCurrentUser(userId);
      }
    } else {
      setCurrentUser(null);
    }
  }, [params.userId, location.pathname]);

  const value: LeagueContextType = {
    currentLeague,
    currentUser,
    loading,
    refreshCurrentLeague,
    refreshCurrentUser,
    clearCurrentLeague,
    clearCurrentUser,
  };

  return (
    <LeagueContext.Provider value={value}>
      {children}
    </LeagueContext.Provider>
  );
};