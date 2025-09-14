import { useState, useEffect } from 'react';
import { Navigation } from '@/components/ui/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Calendar,
  DollarSign,
  BarChart3,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { apiService } from '@/services/api';

interface PlayerProfile {
  id: number;
  username: string;
  league_id: number;
  wins: number;
  losses: number;
  points_for: number;
  points_against: number;
  joined_at: string;
  // Enhanced stats
  avg_money_per_week: number;
  money_earned_total: number;
  money_against: number;
  current_streak: number;
  longest_win_streak: number;
  longest_loss_streak: number;
  bets_won: number;
  bets_lost: number;
  bets_pending: number;
  total_bets_placed: number;
  win_streak_type: 'win' | 'loss' | 'none';
  win_percentage: number;
  // Parlay stats
  parlay_bets_won: number;
  parlay_bets_lost: number;
  parlay_bets_pending: number;
  total_parlay_bets_placed: number;
  parlay_win_percentage: number;
  // Recent performance
  recent_weeks: WeekPerformance[];
  head_to_head: HeadToHeadRecord[];
}

interface WeekPerformance {
  week: number;
  opponent: string;
  result: 'win' | 'loss';
  money_earned: number;
  money_against: number;
  bets_placed: number;
  bets_won: number;
}

interface HeadToHeadRecord {
  opponent: string;
  wins: number;
  losses: number;
  total_money_earned: number;
  total_money_against: number;
}

export function PlayerProfile() {
  const navigate = useNavigate();
  const { leagueId: urlLeagueId, userId: urlUserId } = useParams<{ leagueId: string; userId: string }>();
  const leagueId = parseInt(urlLeagueId || '0');
  const userId = parseInt(urlUserId || '0');
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayerProfile();
  }, [leagueId, userId]);

  const loadPlayerProfile = async () => {
    try {
      setLoading(true);
      // Get real player profile data from API
      const response = await apiService.getPlayerProfile(leagueId, userId) as { profile: PlayerProfile };
      
      // Get parlay bet statistics for recent weeks (current week and prior 4 weeks)
      const currentWeek = 1; // For now, hardcode to 1. In production, this would be dynamic
      const parlayStats = {
        parlay_bets_won: 0,
        parlay_bets_lost: 0,
        parlay_bets_pending: 0,
        total_parlay_bets_placed: 0,
        parlay_win_percentage: 0
      };
      
      // Fetch parlay data for recent weeks
      for (let week = Math.max(1, currentWeek - 4); week <= currentWeek; week++) {
        try {
          const parlayResponse = await apiService.getUserParlayBets(week) as { parlay_bets: any[] };
          const parlayBets = parlayResponse.parlay_bets || [];
          
          parlayStats.total_parlay_bets_placed += parlayBets.length;
          parlayStats.parlay_bets_won += parlayBets.filter((bet: any) => bet.status === 'won').length;
          parlayStats.parlay_bets_lost += parlayBets.filter((bet: any) => bet.status === 'lost').length;
          parlayStats.parlay_bets_pending += parlayBets.filter((bet: any) => bet.status === 'pending').length;
        } catch (error) {
          // No parlay data for this week
        }
      }
      
      // Calculate parlay win percentage
      const settledParlayBets = parlayStats.parlay_bets_won + parlayStats.parlay_bets_lost;
      parlayStats.parlay_win_percentage = settledParlayBets > 0 
        ? (parlayStats.parlay_bets_won / settledParlayBets) * 100 
        : 0;
      
      // Filter recent weeks to show current week and prior weeks only
      const filteredRecentWeeks = response.profile.recent_weeks
        .filter(week => week.week <= currentWeek)
        .sort((a, b) => b.week - a.week)
        .slice(0, 5); // Show last 5 weeks
      
      // Combine profile data with parlay stats
      const enhancedProfile = {
        ...response.profile,
        ...parlayStats,
        recent_weeks: filteredRecentWeeks
      };
      
      setProfile(enhancedProfile);
    } catch (error) {
      console.error('Failed to load player profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStreakIcon = (streakType: string) => {
    switch (streakType) {
      case 'win':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'loss':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getResultIcon = (result: string) => {
    return result === 'win' 
      ? <Trophy className="h-4 w-4 text-green-500" />
      : <Target className="h-4 w-4 text-red-500" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Player not found</h2>
              <p className="text-muted-foreground mb-4">The player profile you're looking for doesn't exist.</p>
              <Button onClick={() => navigate(-1)}>Go Back</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="self-start">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
              <AvatarFallback className="text-lg sm:text-xl">
                {profile.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{profile.username}</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                <Badge variant="outline" className="text-xs sm:text-sm">
                  {profile.wins}-{profile.losses} Record
                </Badge>
                <Badge className="bg-green-100 text-green-800 text-xs sm:text-sm">
                  {profile.win_percentage.toFixed(1)}% Win Rate
                </Badge>
                <div className="flex items-center gap-2">
                  {getStreakIcon(profile.win_streak_type)}
                  <span className="text-xs sm:text-sm font-medium">
                    {profile.current_streak} {profile.win_streak_type} streak
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
          <Card>
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="text-xs lg:text-sm font-medium">Money Earned</span>
              </div>
              <div className="text-lg lg:text-2xl font-bold text-green-600">
                ${profile.money_earned_total.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">
                ${profile.avg_money_per_week.toFixed(2)}/week avg
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="text-xs lg:text-sm font-medium">Bets Won</span>
              </div>
              <div className="text-lg lg:text-2xl font-bold text-blue-600">
                {profile.bets_won}
              </div>
              <div className="text-xs text-muted-foreground">
                {profile.total_bets_placed} total bets
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-xs lg:text-sm font-medium">Longest Win Streak</span>
              </div>
              <div className="text-lg lg:text-2xl font-bold text-yellow-600">
                {profile.longest_win_streak}
              </div>
              <div className="text-xs text-muted-foreground">
                games in a row
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                <span className="text-xs lg:text-sm font-medium">Win Rate</span>
              </div>
              <div className="text-lg lg:text-2xl font-bold text-purple-600">
                {profile.win_percentage.toFixed(1)}%
              </div>
              <div className="mt-2">
                <Progress value={profile.win_percentage} className="h-1 lg:h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats */}
        <Tabs defaultValue="recent" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recent" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Recent Weeks
            </TabsTrigger>
            <TabsTrigger value="head-to-head" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Head-to-Head
            </TabsTrigger>
            <TabsTrigger value="detailed" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Detailed Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profile.recent_weeks.length > 0 ? (
                    profile.recent_weeks.map((week) => (
                    <div key={week.week} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getResultIcon(week.result)}
                        <div>
                          <div className="font-medium">Week {week.week}</div>
                          <div className="text-sm text-muted-foreground">
                            vs {week.opponent}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          ${week.money_earned.toFixed(2)} earned
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {week.bets_won}/{week.bets_placed} bets won
                        </div>
                      </div>
                    </div>
                  ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No recent performance data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="head-to-head" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Head-to-Head Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profile.head_to_head.length > 0 ? (
                    profile.head_to_head.map((record) => (
                    <div key={record.opponent} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{record.opponent}</div>
                        <div className="text-sm text-muted-foreground">
                          {record.wins}-{record.losses} record
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          ${record.total_money_earned.toFixed(2)} earned
                        </div>
                        <div className="text-sm text-muted-foreground">
                          vs ${record.total_money_against.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No head-to-head data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Betting Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Bets Placed</span>
                    <span className="font-semibold">{profile.total_bets_placed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bets Won</span>
                    <span className="font-semibold text-green-600">{profile.bets_won}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bets Lost</span>
                    <span className="font-semibold text-red-600">{profile.bets_lost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bets Pending</span>
                    <span className="font-semibold text-yellow-600">{profile.bets_pending}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bet Win Rate</span>
                    <span className="font-semibold">
                      {((profile.bets_won / profile.total_bets_placed) * 100).toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Parlay Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Parlay Bets</span>
                    <span className="font-semibold">{profile.total_parlay_bets_placed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Parlay Bets Won</span>
                    <span className="font-semibold text-green-600">{profile.parlay_bets_won}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Parlay Bets Lost</span>
                    <span className="font-semibold text-red-600">{profile.parlay_bets_lost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Parlay Bets Pending</span>
                    <span className="font-semibold text-yellow-600">{profile.parlay_bets_pending}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Parlay Win Rate</span>
                    <span className="font-semibold">
                      {profile.parlay_win_percentage.toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Streak Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Streak</span>
                    <div className="flex items-center gap-2">
                      {getStreakIcon(profile.win_streak_type)}
                      <span className="font-semibold">
                        {profile.current_streak} {profile.win_streak_type}s
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Longest Win Streak</span>
                    <span className="font-semibold text-green-600">{profile.longest_win_streak}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Longest Loss Streak</span>
                    <span className="font-semibold text-red-600">{profile.longest_loss_streak}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">League Joined</span>
                    <span className="font-semibold">
                      {new Date(profile.joined_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
