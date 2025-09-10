import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { apiService } from '@/services/api';
import { useAuth } from './useAuth';

interface LeagueMembershipContextType {
  hasLeagues: boolean;
  loading: boolean;
  leagues: any[];
  refreshLeagues: () => Promise<void>;
}

const LeagueMembershipContext = createContext<LeagueMembershipContextType | undefined>(undefined);

export const useLeagueMembership = () => {
  const context = useContext(LeagueMembershipContext);
  if (context === undefined) {
    throw new Error('useLeagueMembership must be used within a LeagueMembershipProvider');
  }
  return context;
};

interface LeagueMembershipProviderProps {
  children: ReactNode;
}

export const LeagueMembershipProvider = ({ children }: LeagueMembershipProviderProps) => {
  const [hasLeagues, setHasLeagues] = useState(false);
  const [loading, setLoading] = useState(true);
  const [leagues, setLeagues] = useState<any[]>([]);
  const { isAuthenticated } = useAuth();

  const refreshLeagues = useCallback(async () => {
    if (!isAuthenticated) {
      setHasLeagues(false);
      setLeagues([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.getUserLeagues();
      const userLeagues = response.leagues || [];
      setLeagues(userLeagues);
      setHasLeagues(userLeagues.length > 0);
    } catch (error) {
      console.error('Failed to fetch user leagues:', error);
      setHasLeagues(false);
      setLeagues([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshLeagues();
  }, [isAuthenticated]);

  const value: LeagueMembershipContextType = {
    hasLeagues,
    loading,
    leagues,
    refreshLeagues,
  };

  return (
    <LeagueMembershipContext.Provider value={value}>
      {children}
    </LeagueMembershipContext.Provider>
  );
};
