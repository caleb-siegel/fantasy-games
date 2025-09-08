import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/ui/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { BettingInterface } from '@/components/betting/BettingInterface';
import { apiService } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function Betting() {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(1);
  const [userLeagues, setUserLeagues] = useState<any[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<any>(null);
  const [currentMatchup, setCurrentMatchup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (selectedLeague) {
      loadMatchup();
    }
  }, [selectedLeague, currentWeek]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load user's leagues
      const leaguesResponse = await apiService.getUserLeagues();
      console.log('Leagues response:', leaguesResponse); // Debug log
      setUserLeagues(leaguesResponse.leagues);
      
      // Select first league if available
      if (leaguesResponse.leagues.length > 0) {
        setSelectedLeague(leaguesResponse.leagues[0]);
        console.log('Selected league:', leaguesResponse.leagues[0]); // Debug log
      }
      
    } catch (error) {
      console.error('Failed to load user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const loadMatchup = async () => {
    if (!selectedLeague) return;
    
    try {
      const matchupResponse = await apiService.getUserMatchup(selectedLeague.id, currentWeek);
      setCurrentMatchup(matchupResponse.matchup);
    } catch (error) {
      console.error('Failed to load matchup:', error);
      setCurrentMatchup(null);
      // Don't show error toast for this as it's expected if no matchup exists
    }
  };

  const handleRefreshOdds = async () => {
    try {
      setRefreshing(true);
      await apiService.forceUpdateOdds(currentWeek);
      toast.success('Odds updated successfully');
    } catch (error) {
      console.error('Failed to refresh odds:', error);
      toast.error('Failed to refresh odds');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading betting data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Please log in to access betting</h2>
              <p className="text-muted-foreground">You need to be logged in to place bets.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (userLeagues.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">No leagues found</h2>
              <p className="text-muted-foreground">Join or create a league to start betting.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">NFL Betting</h1>
            <p className="text-muted-foreground">Week {currentWeek} • {selectedLeague?.name}</p>
          </div>
          <Button
            onClick={handleRefreshOdds}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Odds
          </Button>
        </div>

        {/* League Selection */}
        {userLeagues.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Select League</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {userLeagues.map((league) => (
                  <Button
                    key={league.id}
                    variant={selectedLeague?.id === league.id ? 'default' : 'outline'}
                    onClick={() => setSelectedLeague(league)}
                    className="justify-start"
                  >
                    {league.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}


        {/* Betting Interface */}
        {selectedLeague && currentMatchup && (
          <BettingInterface
            matchupId={currentMatchup.id}
            week={currentWeek}
          />
        )}
        
        {/* No matchup message */}
        {selectedLeague && !currentMatchup && !loading && (
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">No matchup found</h2>
              <p className="text-muted-foreground">You don't have a matchup scheduled for Week {currentWeek} in {selectedLeague.name}.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}