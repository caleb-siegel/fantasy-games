import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Calendar, Clock, Trophy, Target, Eye, RefreshCw, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { apiService } from '@/services/api';
import { formatGameDateTime, getCompactGameDateTime } from '@/utils/dateUtils';
import { useAuth } from '@/hooks/useAuth';

interface MatchupDetail {
  id: number;
  league_id: number;
  week: number;
  user1_id: number;
  user2_id: number;
  user1_username: string;
  user2_username: string;
  winner_id: number | null;
  created_at: string;
  // Enhanced data
  user1_bets: BetSummary[];
  user2_bets: BetSummary[];
  user1_total_bet: number;
  user2_total_bet: number;
  user1_potential_payout: number;
  user2_potential_payout: number;
  user1_final_balance?: number;
  user2_final_balance?: number;
  is_locked: boolean;
  lock_time?: string;
}

interface BetSummary {
  id: number;
  amount: number;
  potential_payout: number;
  actual_payout?: number;
  status: 'pending' | 'won' | 'lost' | 'cancelled';
  outcome?: 'won' | 'lost' | 'pending' | 'cancelled';
  player_name?: string;
  // Denormalized betting option data
  game_id?: string;
  market_type?: string;
  outcome_name?: string;
  outcome_point?: number | null;
  bookmaker?: string;
  odds_snapshot_american?: number;
  odds_snapshot_decimal?: number;
  // Denormalized game data
  home_team?: string;
  away_team?: string;
  start_time?: string;
  result?: string;
  home_score?: number;
  away_score?: number;
  total_points?: number;
  point_spread?: number;
  is_final?: boolean;
  // Fallback to betting_option relationship
  betting_option?: {
    id: number;
    outcome_name: string;
    outcome_point: number | null;
    bookmaker: string;
    american_odds: number;
    decimal_odds: number;
    market_type: string;
    player_name: string;
  };
  // Fallback to game relationship
  game?: {
    id: string;
    home_team: string;
    away_team: string;
    start_time: string;
  };
  is_parlay?: boolean;
  parlay_legs?: Array<{
    id: number;
    parlay_bet_id: number;
    betting_option_id: number;
    leg_number: number;
    american_odds: number;
    decimal_odds: number;
    outcome_name: string;
    outcome_point: number | null;
    market_type: string;
  }>;
}

interface ComprehensiveMatchupsProps {
  leagueId: number;
  currentWeek: number;
  onWeekChange: (week: number) => void;
}

export function ComprehensiveMatchups({ 
  leagueId, 
  currentWeek, 
  onWeekChange 
}: ComprehensiveMatchupsProps) {
  const { user } = useAuth();

  // Helper function to check if a bet should be visible
  const shouldShowBet = (bet: BetSummary, betOwnerId: number) => {
    // Always show your own bets
    if (user?.id === betOwnerId) {
      return true;
    }
    
    // For other users' bets, only show if the game has started
    const gameStartTime = bet.start_time || bet.game?.start_time;
    if (!gameStartTime) {
      return false; // Hide if no start time available
    }
    
    const now = new Date();
    const startTime = new Date(gameStartTime);
    
    return now >= startTime;
  };

  // Helper function to filter bets based on visibility rules
  const getVisibleBets = (bets: BetSummary[], betOwnerId: number) => {
    return bets.filter(bet => shouldShowBet(bet, betOwnerId));
  };
  const [currentWeekMatchups, setCurrentWeekMatchups] = useState<MatchupDetail[]>([]);
  const [allMatchups, setAllMatchups] = useState<MatchupDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'week' | 'calendar'>('week');
  const [validatingBets, setValidatingBets] = useState(false);
  const [validationStatus, setValidationStatus] = useState<{type: 'success' | 'error' | null, message: string}>({type: null, message: ''});

  useEffect(() => {
    loadMatchupData();
  }, [leagueId, currentWeek]);

  const handleManualBetValidation = async () => {
    try {
      setValidatingBets(true);
      setValidationStatus({type: null, message: ''});
      
      const result = await apiService.runBetValidation() as any;
      
      if (result?.success) {
        setValidationStatus({
          type: 'success',
          message: `Validation complete! Processed ${result.results?.games_processed || 0} games and settled ${result.results?.bets_evaluated || 0} bets.`
        });
        
        // Refresh matchup data to show updated bet outcomes
        await loadMatchupData();
      } else {
        setValidationStatus({
          type: 'error',
          message: result?.error || 'Validation failed. Please try again.'
        });
      }
    } catch (error) {
      console.error('Manual validation error:', error);
      setValidationStatus({
        type: 'error',
        message: 'Failed to validate bets. Please try again.'
      });
    } finally {
      setValidatingBets(false);
    }
  };

  const loadMatchupData = async () => {
    try {
      setLoading(true);
      console.log('Loading matchup data for league:', leagueId, 'week:', currentWeek);
      
      // Load all matchups for the current week
      const currentWeekResponse = await apiService.getWeekMatchups(leagueId, currentWeek);
      console.log('Current week response:', currentWeekResponse);
      setCurrentWeekMatchups((currentWeekResponse as any).matchups);
      
      // Load all matchups for calendar view
      const allMatchupsResponse = await apiService.getAllMatchups(leagueId);
      console.log('All matchups response:', allMatchupsResponse);
      setAllMatchups((allMatchupsResponse as any).matchups);
      
    } catch (error) {
      console.error('Failed to load matchup data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = direction === 'prev' ? currentWeek - 1 : currentWeek + 1;
    if (newWeek >= 1 && newWeek <= 17) {
      onWeekChange(newWeek);
    }
  };

  const getMatchupStatus = (matchup: MatchupDetail) => {
    if (matchup.winner_id) {
      return { status: 'completed', text: 'Completed', color: 'bg-green-100 text-green-800' };
    }
    if (matchup.is_locked) {
      return { status: 'locked', text: 'Locked', color: 'bg-yellow-100 text-yellow-800' };
    }
    return { status: 'active', text: 'Active', color: 'bg-blue-100 text-blue-800' };
  };

  const getBetStatusIcon = (status: string) => {
    switch (status) {
      case 'won':
        return <Trophy className="h-4 w-4 text-green-500" />;
      case 'lost':
        return <Target className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getBetPayoutInfo = (bet: BetSummary) => {
    // If bet has been evaluated (has outcome), show final payout
    if (bet.outcome && bet.outcome !== 'pending') {
      const finalPayout = bet.actual_payout || 0;
      return {
        label: 'Final',
        amount: finalPayout,
        color: bet.outcome === 'won' ? 'text-green-600' : 'text-red-600'
      };
    }
    
    // Otherwise show potential payout
    return {
      label: 'Potential',
      amount: bet.potential_payout,
      color: bet.is_parlay ? 'text-blue-100' : 'text-green-600'
    };
  };

  const getUserTotalPayoutInfo = (bets: BetSummary[]) => {
    const evaluatedBets = bets.filter(bet => bet.outcome && bet.outcome !== 'pending');
    const pendingBets = bets.filter(bet => !bet.outcome || bet.outcome === 'pending');
    
    // Only show "Final" if ALL bets have been evaluated
    if (evaluatedBets.length === bets.length && evaluatedBets.length > 0) {
      const totalFinalPayout = evaluatedBets.reduce((sum, bet) => {
        return sum + (bet.actual_payout || 0);
      }, 0);
      
      return {
        label: 'Final',
        amount: totalFinalPayout,
        color: 'text-green-600'
      };
    }
    
    // If some bets are evaluated but not all, show partial results
    if (evaluatedBets.length > 0) {
      const evaluatedPayout = evaluatedBets.reduce((sum, bet) => {
        return sum + (bet.actual_payout || 0);
      }, 0);
      const pendingPayout = pendingBets.reduce((sum, bet) => sum + bet.potential_payout, 0);
      
      return {
        label: 'Partial',
        amount: evaluatedPayout + pendingPayout,
        color: 'text-yellow-600'
      };
    }
    
    // All bets are pending
    const totalPotentialPayout = bets.reduce((sum, bet) => sum + bet.potential_payout, 0);
    return {
      label: 'Potential',
      amount: totalPotentialPayout,
      color: 'text-green-600'
    };
  };

  const getMarketDisplayName = (marketType: string) => {
    switch (marketType) {
      case 'h2h': return 'Moneyline';
      case 'spreads': return 'Spread';
      case 'totals': return 'Total';
      default: return marketType;
    }
  };

  const formatBetDescription = (bet: BetSummary) => {
    if (bet.is_parlay) {
      return `Parlay: ${bet.outcome_name || bet.betting_option?.outcome_name}`;
    }
    
    const marketType = getMarketDisplayName(bet.market_type || bet.betting_option?.market_type || '');
    const outcomeName = bet.outcome_name || bet.betting_option?.outcome_name;
    const outcomePoint = bet.outcome_point || bet.betting_option?.outcome_point;
    const playerName = bet.player_name || bet.betting_option?.player_name;
    
    if (playerName) {
      return `${marketType}: ${playerName} ${outcomeName} ${outcomePoint || ''}`;
    }
    
    return `${marketType}: ${outcomeName} ${outcomePoint || ''}`;
  };

  const getParlayLegDisplayName = (leg: any) => {
    if (leg.market_type === 'totals') {
      return `${leg.outcome_name} ${leg.outcome_point}`;
    } else if (leg.market_type === 'spreads') {
      return `${leg.outcome_name} ${leg.outcome_point && leg.outcome_point > 0 ? '+' : ''}${leg.outcome_point}`;
    } else if (leg.market_type === 'team_totals') {
      return `${leg.outcome_name} ${leg.outcome_point}`;
    } else if (leg.market_type === 'h2h') {
      return `${leg.outcome_name}`;
    }
    return `${leg.market_type}: ${leg.player_name} ${leg.outcome_name} ${leg.outcome_point || ''}`
  };

  const getParlayLegStatusIcon = (leg: any) => {
    if (leg.result === 'won') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (leg.result === 'lost') {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    } else if (leg.result === 'pending') {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
    return <Clock className="h-4 w-4 text-gray-500" />;
  };

  const formatAmericanOdds = (americanOdds: number) => {
    return americanOdds > 0 ? `+${americanOdds}` : americanOdds.toString();
  };

  const renderWeekView = () => {
    console.log('Rendering week view with matchups:', currentWeekMatchups);
    
    if (currentWeekMatchups.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No matchups found for Week {currentWeek}</p>
        </div>
      );
    }
    
    return (
    <div className="space-y-4">
      {currentWeekMatchups.map((matchup) => {
        const matchupStatus = getMatchupStatus(matchup);
        return (
          <Card key={matchup.id}>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-lg lg:text-xl">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 lg:h-8 lg:w-8">
                      <AvatarFallback className="text-xs lg:text-sm">
                        {matchup.user1_username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{matchup.user1_username}</span>
                  </div>
                  <span className="text-muted-foreground hidden sm:inline">vs</span>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 lg:h-8 lg:w-8">
                      <AvatarFallback className="text-xs lg:text-sm">
                        {matchup.user2_username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{matchup.user2_username}</span>
                  </div>
                </CardTitle>
                <Badge className={`${matchupStatus.color} text-xs lg:text-sm`}>
                  {matchupStatus.text}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {/* User 1 Bets */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h4 className="font-semibold text-sm lg:text-base">{matchup.user1_username}</h4>
                    <div className="text-right">
                      <div className="text-xs lg:text-sm text-muted-foreground">
                        Bet: ${matchup.user1_total_bet}
                      </div>
                      <div className="font-semibold text-sm lg:text-base">
                        {getUserTotalPayoutInfo(matchup.user1_bets).label}: ${getUserTotalPayoutInfo(matchup.user1_bets).amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {getVisibleBets(matchup.user1_bets, matchup.user1_id).length > 0 ? (
                      getVisibleBets(matchup.user1_bets, matchup.user1_id).map((bet) => (
                        <div key={bet.id} className={`p-3 rounded-lg border ${bet.is_parlay ? 'bg-blue-900 border-blue-700' : 'bg-muted/50'}`}>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {getBetStatusIcon(bet.status)}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate text-blue-100">
                                  {bet.is_parlay ? 'Parlay Bet' : `${bet.away_team || bet.game?.away_team} @ ${bet.home_team || bet.game?.home_team}`}
                                </div>
                                <div className="text-xs text-blue-300 truncate">
                                  {formatBetDescription(bet)}
                                </div>
                                <div className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {getCompactGameDateTime(bet.start_time || bet.game?.start_time, user?.timezone || 'America/New_York')}
                                </div>
                                {bet.is_parlay && bet.parlay_legs && (
                                  <div className="space-y-2 mt-2">
                                    {bet.parlay_legs.map((leg: any, index: number) => (
                                      <div key={leg.id} className="text-sm bg-blue-800 p-2 rounded">
                                        <div className="font-medium text-blue-200 flex items-center gap-2">
                                          Leg {index + 1}: {leg.away_team || 'Away'} @ {leg.home_team || 'Home'}
                                          {getParlayLegStatusIcon(leg)}
                                        </div>
                                        <div className="text-blue-300">
                                          {getParlayLegDisplayName(leg)} • {formatAmericanOdds(leg.american_odds)} • {leg.bookmaker || 'Multiple'}
                                        </div>
                                        {leg.start_time && (
                                          <div className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {getCompactGameDateTime(leg.start_time, user?.timezone || 'America/New_York')}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Badge variant="outline" className={`text-xs flex-shrink-0 ${bet.is_parlay ? 'border-blue-500 text-blue-200 bg-blue-800' : ''}`}>
                              {bet.bookmaker || bet.betting_option?.bookmaker}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-3">
                              <div>
                                <span className={bet.is_parlay ? "text-blue-300" : "text-muted-foreground"}>Bet:</span>
                                <span className={`font-medium ml-1 ${bet.is_parlay ? "text-blue-100" : ""}`}>${bet.amount}</span>
                              </div>
                              <div>
                                <span className={bet.is_parlay ? "text-blue-300" : "text-muted-foreground"}>Odds:</span>
                                <span className={`font-medium ml-1 ${bet.is_parlay ? "text-blue-100" : ""}`}>{formatAmericanOdds(bet.odds_snapshot_american || bet.betting_option?.american_odds)}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={bet.is_parlay ? "text-blue-300" : "text-muted-foreground"}>
                                {getBetPayoutInfo(bet).label}:
                              </div>
                              <div className={`font-semibold ${getBetPayoutInfo(bet).color}`}>
                                ${getBetPayoutInfo(bet).amount.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-muted-foreground text-sm">
                        {matchup.user1_bets.length > 0 ? 'Bets hidden until games start' : 'No bets placed yet'}
                      </div>
                    )}
                  </div>
                </div>

                {/* User 2 Bets */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h4 className="font-semibold text-sm lg:text-base">{matchup.user2_username}</h4>
                    <div className="text-right">
                      <div className="text-xs lg:text-sm text-muted-foreground">
                        Bet: ${matchup.user2_total_bet}
                      </div>
                      <div className="font-semibold text-sm lg:text-base">
                        {getUserTotalPayoutInfo(matchup.user2_bets).label}: ${getUserTotalPayoutInfo(matchup.user2_bets).amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {getVisibleBets(matchup.user2_bets, matchup.user2_id).length > 0 ? (
                      getVisibleBets(matchup.user2_bets, matchup.user2_id).map((bet) => (
                        <div key={bet.id} className={`p-3 rounded-lg border ${bet.is_parlay ? 'bg-blue-900 border-blue-700' : 'bg-muted/50'}`}>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {getBetStatusIcon(bet.status)}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate text-blue-100">
                                  {bet.is_parlay ? 'Parlay Bet' : `${bet.away_team || bet.game?.away_team} @ ${bet.home_team || bet.game?.home_team}`}
                                </div>
                                <div className="text-xs text-blue-300 truncate">
                                  {formatBetDescription(bet)}
                                </div>
                                <div className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {getCompactGameDateTime(bet.start_time || bet.game?.start_time, user?.timezone || 'America/New_York')}
                                </div>
                                {bet.is_parlay && bet.parlay_legs && (
                                  <div className="space-y-2 mt-2">
                                    {bet.parlay_legs.map((leg: any, index: number) => (
                                      <div key={leg.id} className="text-sm bg-blue-800 p-2 rounded">
                                        <div className="font-medium text-blue-200 flex items-center gap-2">
                                          Leg {index + 1}: {leg.away_team || 'Away'} @ {leg.home_team || 'Home'}
                                          {getParlayLegStatusIcon(leg)}
                                        </div>
                                        <div className="text-blue-300">
                                          {getParlayLegDisplayName(leg)} • {formatAmericanOdds(leg.american_odds)} • {leg.bookmaker || 'Multiple'}
                                        </div>
                                        {leg.start_time && (
                                          <div className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {getCompactGameDateTime(leg.start_time, user?.timezone || 'America/New_York')}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Badge variant="outline" className={`text-xs flex-shrink-0 ${bet.is_parlay ? 'border-blue-500 text-blue-200 bg-blue-800' : ''}`}>
                              {bet.bookmaker || bet.betting_option?.bookmaker}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-3">
                              <div>
                                <span className={bet.is_parlay ? "text-blue-300" : "text-muted-foreground"}>Bet:</span>
                                <span className={`font-medium ml-1 ${bet.is_parlay ? "text-blue-100" : ""}`}>${bet.amount}</span>
                              </div>
                              <div>
                                <span className={bet.is_parlay ? "text-blue-300" : "text-muted-foreground"}>Odds:</span>
                                <span className={`font-medium ml-1 ${bet.is_parlay ? "text-blue-100" : ""}`}>{formatAmericanOdds(bet.odds_snapshot_american || bet.betting_option?.american_odds)}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={bet.is_parlay ? "text-blue-300" : "text-muted-foreground"}>
                                {getBetPayoutInfo(bet).label}:
                              </div>
                              <div className={`font-semibold ${getBetPayoutInfo(bet).color}`}>
                                ${getBetPayoutInfo(bet).amount.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-muted-foreground text-sm">
                        {matchup.user2_bets.length > 0 ? 'Bets hidden until games start' : 'No bets placed yet'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {matchup.winner_id && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <div className="text-center">
                    <Trophy className="h-5 w-5 lg:h-6 lg:w-6 text-green-600 mx-auto mb-2" />
                    <div className="font-semibold text-green-800 text-sm lg:text-base">
                      Winner: {matchup.winner_id === matchup.user1_id ? matchup.user1_username : matchup.user2_username}
                    </div>
                    {matchup.user1_final_balance && matchup.user2_final_balance && (
                      <div className="text-xs lg:text-sm text-green-600 mt-1">
                        Final: ${matchup.user1_final_balance} vs ${matchup.user2_final_balance}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
    );
  };

  const renderCalendarView = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
        {Array.from({ length: 17 }, (_, i) => i + 1).map((week) => {
          const weekMatchups = allMatchups.filter(m => m.week === week);
          return (
            <Card key={week} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base lg:text-lg">Week {week}</CardTitle>
              </CardHeader>
              <CardContent>
                {weekMatchups.length > 0 ? (
                  <div className="space-y-2">
                    {weekMatchups.map((matchup) => (
                      <div key={matchup.id} className="text-xs lg:text-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 min-w-0 flex-1">
                            <span className="truncate text-xs lg:text-sm">
                              {matchup.user1_username}
                            </span>
                            <span className="text-muted-foreground text-xs">vs</span>
                            <span className="truncate text-xs lg:text-sm">
                              {matchup.user2_username}
                            </span>
                          </div>
                          {matchup.winner_id && (
                            <Trophy className="h-3 w-3 lg:h-4 lg:w-4 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs lg:text-sm text-muted-foreground text-center py-2">
                    No matchups
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Matchups
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('prev')}
              disabled={currentWeek <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 py-1 bg-muted rounded text-sm font-medium">
              Week {currentWeek}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('next')}
              disabled={currentWeek >= 17}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            {/* Bet Validation Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualBetValidation}
              disabled={validatingBets}
              className="ml-2"
            >
              {validatingBets ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Check Bets
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Validation Status Message */}
        {validationStatus.type && (
          <div className={`flex items-center gap-2 p-3 rounded-md mt-4 ${
            validationStatus.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {validationStatus.type === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span className="text-sm">{validationStatus.message}</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'week' | 'calendar')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="week" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Week View
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              All Weeks
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="week" className="mt-6">
            {renderWeekView()}
          </TabsContent>
          
          <TabsContent value="calendar" className="mt-6">
            {renderCalendarView()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
