import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Navigation } from '@/components/ui/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Users, Trophy, Calendar, Settings, Target, BarChart3, RefreshCw } from 'lucide-react';
import { apiService } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { useLeagueMembership } from '@/hooks/useLeagueMembership';
import { BettingInterface } from '@/components/betting/BettingInterface';
import { ComprehensiveStandings } from '@/components/standings/ComprehensiveStandings';
import { ComprehensiveMatchups } from '@/components/matchups/ComprehensiveMatchups';
import { toast } from 'sonner';

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

interface Standing {
  id: number;
  league_id: number;
  user_id: number;
  username: string;
  wins: number;
  losses: number;
  points_for: number;
  points_against: number;
  joined_at: string;
}

export default function LeaguePage() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { refreshLeagues } = useLeagueMembership();
  
  const [league, setLeague] = useState<League | null>(null);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentMatchup, setCurrentMatchup] = useState<Matchup | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [allMatchups, setAllMatchups] = useState<Matchup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Get initial tab from URL parameters
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (leagueId) {
      loadLeagueData();
    }
  }, [leagueId]);

  useEffect(() => {
    // Update active tab when URL parameters change
    const tabFromUrl = searchParams.get('tab') || 'overview';
    setActiveTab(tabFromUrl);
  }, [searchParams]);

  useEffect(() => {
    if (league && league.is_setup_complete) {
      loadMatchupData();
      loadStandings();
    }
  }, [league?.id, league?.is_setup_complete, currentWeek]);

  const loadLeagueData = async () => {
    if (!leagueId) return;
    
    try {
      setLoading(true);
      
      // Load league details
      const leagueResponse = await apiService.getLeague(parseInt(leagueId));
      setLeague(leagueResponse.league);
      
    } catch (error) {
      console.error('Failed to load league data:', error);
      toast.error('Failed to load league data');
      navigate('/leagues');
    } finally {
      setLoading(false);
    }
  };

  const loadMatchupData = async () => {
    if (!league) return;
    
    try {
      const matchupResponse = await apiService.getUserMatchup(league.id, currentWeek);
      setCurrentMatchup(matchupResponse.matchup);
    } catch (error) {
      console.error('Failed to load matchup:', error);
      setCurrentMatchup(null);
    }
  };

  const loadStandings = async () => {
    if (!league) return;
    
    try {
      const standingsResponse = await apiService.getLeagueStandings(league.id);
      setStandings(standingsResponse.standings);
    } catch (error) {
      console.error('Failed to load standings:', error);
    }
  };

  const handleRefreshOdds = async () => {
    try {
      setRefreshing(true);
      await apiService.forceUpdateOdds(currentWeek);
      toast.success('Odds refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh odds:', error);
      toast.error('Failed to refresh odds');
    } finally {
      setRefreshing(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Update URL to reflect the active tab
    const newSearchParams = new URLSearchParams(searchParams);
    if (tab === 'overview') {
      newSearchParams.delete('tab');
    } else {
      newSearchParams.set('tab', tab);
    }
    navigate(`/leagues/${leagueId}?${newSearchParams.toString()}`, { replace: true });
  };

  const handleWeekChange = (week: number) => {
    if (week >= 1 && week <= 17) {
      setCurrentWeek(week);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = direction === 'prev' ? currentWeek - 1 : currentWeek + 1;
    handleWeekChange(newWeek);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">League not found</h2>
              <p className="text-muted-foreground mb-4">The league you're looking for doesn't exist or you don't have access to it.</p>
              <Button onClick={() => navigate('/leagues')}>Back to Leagues</Button>
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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">{league.name}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <Badge variant={league.is_setup_complete ? "default" : "secondary"}>
                {league.is_setup_complete ? "Active" : "Setup Pending"}
              </Badge>
              <span className="text-muted-foreground">
                {league.member_count} members
              </span>
              {league.is_commissioner && (
                <Badge variant="outline">
                  <Settings className="w-3 h-3 mr-1" />
                  Commissioner
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefreshOdds}
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Odds
            </Button>
            {league.is_commissioner && (
              <Button
                onClick={() => navigate(`/leagues/${league.id}/settings`)}
                variant="outline"
                size="sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            )}
          </div>
        </div>

        {/* Week Navigation */}
        {league.is_setup_complete && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span>Week {currentWeek}</span>
                  <Badge variant={currentWeek <= 14 ? "default" : "secondary"}>
                    {currentWeek <= 14 ? "Regular Season" : "Playoffs"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateWeek('prev')}
                    disabled={currentWeek <= 1}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>
                  <Select value={currentWeek.toString()} onValueChange={(value) => handleWeekChange(parseInt(value))}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 17 }, (_, i) => i + 1).map((week) => (
                        <SelectItem key={week} value={week.toString()}>
                          Week {week} {week <= 14 ? '(RS)' : '(PO)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateWeek('next')}
                    disabled={currentWeek >= 17}
                    className="flex items-center gap-1"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center justify-center gap-1 text-xs px-1 sm:px-2 lg:px-3">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="truncate">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="matchups" className="flex items-center justify-center gap-1 text-xs px-1 sm:px-2 lg:px-3">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="truncate">Matchups</span>
            </TabsTrigger>
            <TabsTrigger value="standings" className="flex items-center justify-center gap-1 text-xs px-1 sm:px-2 lg:px-3">
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="truncate">Standings</span>
            </TabsTrigger>
            <TabsTrigger value="betting" className="flex items-center justify-center gap-1 text-xs px-1 sm:px-2 lg:px-3">
              <Target className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="truncate">Betting</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* League Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    League Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invite Code</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">{league.invite_code}</span>
                      <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(league.invite_code)}>
                        Copy
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Members</span>
                    <span className="font-semibold">{league.member_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={league.is_setup_complete ? "default" : "secondary"}>
                      {league.is_setup_complete ? "Active" : "Setup Pending"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span>{new Date(league.created_at).toLocaleDateString()}</span>
                  </div>
                  {league.is_setup_complete && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Week</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Week {currentWeek}</span>
                        <Badge variant={currentWeek <= 14 ? "default" : "secondary"}>
                          {currentWeek <= 14 ? "Regular Season" : "Playoffs"}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Current Week Summary */}
              {league.is_setup_complete && currentMatchup && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      This Week's Matchup
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-4">
                      <div className="text-2xl font-bold">
                        {currentMatchup.user1_username} vs {currentMatchup.user2_username}
                      </div>
                      <div className="text-muted-foreground">
                        Week {currentWeek} • {league.name}
                      </div>
                      {currentMatchup.winner_id ? (
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="text-green-800 font-semibold">
                            Winner: {currentMatchup.winner_id === currentMatchup.user1_id ? currentMatchup.user1_username : currentMatchup.user2_username}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Button 
                            onClick={() => setActiveTab('betting')}
                            className="w-full"
                          >
                            <Target className="h-4 w-4 mr-2" />
                            Place Bets
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => setActiveTab('matchups')}
                            className="w-full"
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            View Matchup Details
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('matchups')}
                    className="flex flex-col items-center gap-2 h-auto py-3 lg:py-4"
                  >
                    <Calendar className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span className="text-sm lg:text-base">View Matchups</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('standings')}
                    className="flex flex-col items-center gap-2 h-auto py-3 lg:py-4"
                  >
                    <Trophy className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span className="text-sm lg:text-base">Standings</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('betting')}
                    className="flex flex-col items-center gap-2 h-auto py-3 lg:py-4"
                  >
                    <Target className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span className="text-sm lg:text-base">Place Bets</span>
                  </Button>
                  {league.is_commissioner && (
                    <Button 
                      variant="outline" 
                      onClick={() => navigate(`/leagues/${league.id}/settings`)}
                      className="flex flex-col items-center gap-2 h-auto py-3 lg:py-4"
                    >
                      <Settings className="h-5 w-5 lg:h-6 lg:w-6" />
                      <span className="text-sm lg:text-base">Settings</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Matchups Tab */}
          <TabsContent value="matchups" className="space-y-6">
            {league.is_setup_complete ? (
              <ComprehensiveMatchups 
                leagueId={league.id}
                currentWeek={currentWeek}
                onWeekChange={handleWeekChange}
              />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-semibold mb-2">League Setup Required</h3>
                  <p className="text-muted-foreground mb-4">
                    The commissioner needs to complete league setup before matchups can be generated.
                  </p>
                  {league.is_commissioner && (
                    <Button onClick={() => navigate(`/leagues/${league.id}/settings`)}>
                      Complete Setup
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Standings Tab */}
          <TabsContent value="standings" className="space-y-6">
            {league.is_setup_complete ? (
              <ComprehensiveStandings leagueId={league.id} />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-semibold mb-2">League Setup Required</h3>
                  <p className="text-muted-foreground mb-4">
                    The commissioner needs to complete league setup before standings can be calculated.
                  </p>
                  {league.is_commissioner && (
                    <Button onClick={() => navigate(`/leagues/${league.id}/settings`)}>
                      Complete Setup
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Betting Tab */}
          <TabsContent value="betting" className="space-y-6">
            {league.is_setup_complete ? (
              currentMatchup ? (
                <BettingInterface 
                  matchupId={currentMatchup.id} 
                  week={currentWeek} 
                  leagueId={league.id}
                />
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <h3 className="text-xl font-semibold mb-2">No Matchup Available</h3>
                    <p className="text-muted-foreground">
                      No matchup found for week {currentWeek}. Please check with your commissioner.
                    </p>
                  </CardContent>
                </Card>
              )
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-semibold mb-2">League Setup Required</h3>
                  <p className="text-muted-foreground mb-4">
                    The commissioner needs to complete league setup before betting can begin.
                  </p>
                  {league.is_commissioner && (
                    <Button onClick={() => navigate(`/leagues/${league.id}/settings`)}>
                      Complete Setup
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
