import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/ui/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  Users, 
  Trophy, 
  TrendingUp, 
  Clock, 
  Target,
  BarChart3,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { apiService } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Matchup {
  id: number;
  league_id: number;
  week: number;
  user1_id: number;
  user2_id: number;
  user1_username: string;
  user2_username: string;
  winner_id: number | null;
  created_at: string;
}

interface UserBet {
  id: number;
  user_id: number;
  matchup_id: number;
  betting_option_id: number;
  amount: number;
  potential_payout: number;
  status: string;
  created_at: string;
  betting_option: {
    id: number;
    game_id: string;
    market_type: string;
    outcome_name: string;
    outcome_point: number | null;
    bookmaker: string;
    american_odds: number;
    decimal_odds: number;
    game: {
      id: string;
      home_team: string;
      away_team: string;
      start_time: string;
    };
  };
}

interface MatchupComparison {
  matchup: Matchup;
  user1_bets: UserBet[];
  user2_bets: UserBet[];
  user1_total: number;
  user2_total: number;
  user1_potential_payout: number;
  user2_potential_payout: number;
  current_week: number;
}

export default function WeeklyMatchup() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [matchupData, setMatchupData] = useState<MatchupComparison | null>(null);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (leagueId) {
      loadCurrentWeekMatchup();
    }
  }, [leagueId, currentWeek]);

  const loadCurrentWeekMatchup = async () => {
    if (!leagueId) return;
    
    try {
      setLoading(true);
      
      // Get current week's matchup
      const matchupResponse = await apiService.getUserMatchup(parseInt(leagueId), currentWeek);
      const matchup = matchupResponse.matchup;
      
      // Get both users' bets for this matchup
      const [user1BetsResponse, user2BetsResponse] = await Promise.all([
        apiService.getUserBetsForMatchup(matchup.id, matchup.user1_id),
        apiService.getUserBetsForMatchup(matchup.id, matchup.user2_id)
      ]);
      
      const user1Bets = user1BetsResponse.bets || [];
      const user2Bets = user2BetsResponse.bets || [];
      
      // Calculate totals
      const user1Total = user1Bets.reduce((sum, bet) => sum + bet.amount, 0);
      const user2Total = user2Bets.reduce((sum, bet) => sum + bet.amount, 0);
      const user1PotentialPayout = user1Bets.reduce((sum, bet) => sum + bet.potential_payout, 0);
      const user2PotentialPayout = user2Bets.reduce((sum, bet) => sum + bet.potential_payout, 0);
      
      setMatchupData({
        matchup,
        user1_bets: user1Bets,
        user2_bets: user2Bets,
        user1_total: user1Total,
        user2_total: user2Total,
        user1_potential_payout: user1PotentialPayout,
        user2_potential_payout: user2PotentialPayout,
        current_week: currentWeek
      });
      
    } catch (error) {
      console.error('Failed to load matchup data:', error);
      toast.error('Failed to load matchup data');
      navigate('/leagues');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadCurrentWeekMatchup();
      toast.success('Matchup data refreshed');
    } catch (error) {
      toast.error('Failed to refresh matchup data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleWeekChange = (newWeek: number) => {
    if (newWeek >= 1 && newWeek <= 17) {
      setCurrentWeek(newWeek);
    }
  };

  const getWeekType = (week: number) => {
    if (week <= 14) return 'Regular Season';
    if (week <= 17) return 'Playoffs';
    return 'Unknown';
  };

  const getWeekStatus = (week: number) => {
    const now = new Date();
    const currentDate = now.getDate();
    const currentMonth = now.getMonth();
    
    // Simple logic - in a real app, this would be based on actual NFL schedule
    if (week === currentWeek) return 'current';
    if (week < currentWeek) return 'completed';
    return 'upcoming';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading matchup data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!matchupData) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">No matchup found</h2>
              <p className="text-muted-foreground">No matchup scheduled for Week {currentWeek}.</p>
              <Button onClick={() => navigate('/leagues')} className="mt-4">
                Back to Leagues
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { matchup, user1_bets, user2_bets, user1_total, user2_total, user1_potential_payout, user2_potential_payout } = matchupData;
  const isUser1 = user?.id === matchup.user1_id;
  const myBets = isUser1 ? user1_bets : user2_bets;
  const opponentBets = isUser1 ? user2_bets : user1_bets;
  const myTotal = isUser1 ? user1_total : user2_total;
  const opponentTotal = isUser1 ? user2_total : user1_total;
  const myPotentialPayout = isUser1 ? user1_potential_payout : user2_potential_payout;
  const opponentPotentialPayout = isUser1 ? user2_potential_payout : user1_potential_payout;
  const myUsername = isUser1 ? matchup.user1_username : matchup.user2_username;
  const opponentUsername = isUser1 ? matchup.user2_username : matchup.user1_username;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Weekly Matchup</h1>
            <p className="text-muted-foreground">
              Week {currentWeek} • {getWeekType(currentWeek)} • {myUsername} vs {opponentUsername}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => navigate('/leagues')} variant="outline">
              Back to Leagues
            </Button>
          </div>
        </div>

        {/* Week Navigation */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleWeekChange(currentWeek - 1)}
                disabled={currentWeek <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous Week
              </Button>
              
              <div className="text-center">
                <h2 className="text-xl font-bold">Week {currentWeek}</h2>
                <p className="text-sm text-muted-foreground">{getWeekType(currentWeek)}</p>
                <Badge variant={getWeekStatus(currentWeek) === 'current' ? 'default' : 'secondary'}>
                  {getWeekStatus(currentWeek) === 'current' ? 'Current Week' : 
                   getWeekStatus(currentWeek) === 'completed' ? 'Completed' : 'Upcoming'}
                </Badge>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleWeekChange(currentWeek + 1)}
                disabled={currentWeek >= 17}
              >
                Next Week
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Matchup Overview */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Your Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-500" />
                <span>Your Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">${myTotal.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Total Bet Amount</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">${myPotentialPayout.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Potential Payout</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{myBets.length}</div>
                <div className="text-sm text-muted-foreground">Number of Bets</div>
              </div>
            </CardContent>
          </Card>

          {/* Opponent Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-red-500" />
                <span>{opponentUsername}'s Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">${opponentTotal.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Total Bet Amount</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">${opponentPotentialPayout.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Potential Payout</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{opponentBets.length}</div>
                <div className="text-sm text-muted-foreground">Number of Bets</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Head-to-Head Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Head-to-Head Comparison</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="bets" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="bets">Bet Comparison</TabsTrigger>
                <TabsTrigger value="games">Game Analysis</TabsTrigger>
                <TabsTrigger value="schedule">Matchup Schedule</TabsTrigger>
              </TabsList>

              {/* Bet Comparison Tab */}
              <TabsContent value="bets" className="space-y-4 mt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Your Bets */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-blue-600">Your Bets</h3>
                    <div className="space-y-3">
                      {myBets.length > 0 ? (
                        myBets.map((bet) => (
                          <div key={bet.id} className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium text-sm">
                                  {bet.betting_option.game.home_team} vs {bet.betting_option.game.away_team}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {bet.betting_option.outcome_name} {bet.betting_option.outcome_point && `(${bet.betting_option.outcome_point})`}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {bet.betting_option.bookmaker} • {bet.betting_option.american_odds > 0 ? '+' : ''}{bet.betting_option.american_odds}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-sm">${bet.amount.toFixed(2)}</div>
                                <div className="text-xs text-green-600">${bet.potential_payout.toFixed(2)}</div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No bets placed yet</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Opponent's Bets */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-red-600">{opponentUsername}'s Bets</h3>
                    <div className="space-y-3">
                      {opponentBets.length > 0 ? (
                        opponentBets.map((bet) => (
                          <div key={bet.id} className="p-3 border rounded-lg bg-red-50 dark:bg-red-900/20">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium text-sm">
                                  {bet.betting_option.game.home_team} vs {bet.betting_option.game.away_team}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {bet.betting_option.outcome_name} {bet.betting_option.outcome_point && `(${bet.betting_option.outcome_point})`}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {bet.betting_option.bookmaker} • {bet.betting_option.american_odds > 0 ? '+' : ''}{bet.betting_option.american_odds}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-sm">${bet.amount.toFixed(2)}</div>
                                <div className="text-xs text-green-600">${bet.potential_payout.toFixed(2)}</div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No bets placed yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Game Analysis Tab */}
              <TabsContent value="games" className="space-y-4 mt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Game analysis coming soon</p>
                  <p className="text-sm mt-2">Detailed game-by-game analysis will be available here</p>
                </div>
              </TabsContent>

              {/* Matchup Schedule Tab */}
              <TabsContent value="schedule" className="space-y-4 mt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Matchup schedule coming soon</p>
                  <p className="text-sm mt-2">Full season matchup schedule will be displayed here</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => navigate(`/betting?league=${leagueId}&week=${currentWeek}`)}>
                <Target className="w-4 h-4 mr-2" />
                Place Bets
              </Button>
              <Button variant="outline" onClick={() => navigate('/standings')}>
                <Trophy className="w-4 h-4 mr-2" />
                View Standings
              </Button>
              <Button variant="outline" onClick={() => navigate('/leagues')}>
                <Users className="w-4 h-4 mr-2" />
                Back to Leagues
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
