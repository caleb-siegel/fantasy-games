import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

interface WeekInfo {
  current_week: number;
  season_year: number;
  week_type: string;
  can_rollover: boolean;
}

interface WeekStatus {
  week: number;
  week_type: string;
  week_start: string;
  week_end: string;
  total_matchups: number;
  completed_matchups: number;
  completion_percentage: number;
  total_bets: number;
  total_parlay_bets: number;
  is_current_week: boolean;
  can_rollover: boolean;
}

export function useCurrentWeek() {
  const [weekInfo, setWeekInfo] = useState<WeekInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentWeek = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getCurrentWeek();
      setWeekInfo(data);
    } catch (err) {
      console.error('Failed to fetch current week:', err);
      setError('Failed to load current week');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentWeek();
  }, [fetchCurrentWeek]);

  const refreshWeek = useCallback(() => {
    fetchCurrentWeek();
  }, [fetchCurrentWeek]);

  return {
    currentWeek: weekInfo?.current_week || 1,
    seasonYear: weekInfo?.season_year || 2024,
    weekType: weekInfo?.week_type || 'Regular Season',
    canRollover: weekInfo?.can_rollover || false,
    loading,
    error,
    refreshWeek
  };
}

export function useWeekStatus(week?: number) {
  const [weekStatus, setWeekStatus] = useState<WeekStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeekStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getWeekStatus(week);
      setWeekStatus(data);
    } catch (err) {
      console.error('Failed to fetch week status:', err);
      setError('Failed to load week status');
    } finally {
      setLoading(false);
    }
  }, [week]);

  useEffect(() => {
    fetchWeekStatus();
  }, [fetchWeekStatus]);

  const refreshStatus = useCallback(() => {
    fetchWeekStatus();
  }, [fetchWeekStatus]);

  return {
    weekStatus,
    loading,
    error,
    refreshStatus
  };
}

export function useWeekManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rolloverWeek = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiService.rolloverWeek();
      if (!result.success) {
        throw new Error(result.message);
      }
      return result;
    } catch (err) {
      console.error('Failed to rollover week:', err);
      setError(err instanceof Error ? err.message : 'Failed to rollover week');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const setCurrentWeek = useCallback(async (week: number) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiService.setCurrentWeek(week);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result;
    } catch (err) {
      console.error('Failed to set current week:', err);
      setError(err instanceof Error ? err.message : 'Failed to set current week');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    rolloverWeek,
    setCurrentWeek,
    loading,
    error
  };
}
