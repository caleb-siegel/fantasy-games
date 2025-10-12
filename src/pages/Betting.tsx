import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/ui/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RefreshCw, Calendar, AlertTriangle } from 'lucide-react';
import { BettingInterface } from '@/components/betting/BettingInterface';
import { apiService } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentWeek } from '@/hooks/useWeekManagement';
import { toast } from 'sonner';

export default function Betting() {
  const { user } = useAuth();
  const { currentWeek } = useCurrentWeek();
  const [userLeagues, setUserLeagues] = useState<any[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<any>(null);
  const [currentMatchup, setCurrentMatchup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRolloverDialog, setShowRolloverDialog] = useState(false);
  const [rollingOver, setRollingOver] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (selectedLeague && currentWeek) {
      loadMatchup();
    }
  }, [selectedLeague, currentWeek]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load user's leagues
      const leaguesResponse = await apiService.getUserLeagues();
      setUserLeagues(leaguesResponse.leagues);
      
      // Select first league if available
      if (leaguesResponse.leagues.length > 0) {
        setSelectedLeague(leaguesResponse.leagues[0]);
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

  const handleRolloverWeek = () => {
    setShowRolloverDialog(true);
  };

  const confirmRolloverWeek = async () => {
    try {
      setRollingOver(true);
      const result = await apiService.rolloverWeek();
      toast.success(`Successfully rolled over from Week ${result.previous_week} to Week ${result.new_week}`);
      setShowRolloverDialog(false);
      
      // Reload the page to refresh all data
      window.location.reload();
    } catch (error) {
      console.error('Failed to rollover week:', error);
      toast.error('Failed to rollover week');
    } finally {
      setRollingOver(false);
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
          {user?.id === 3 && (
            <Button
              onClick={handleRolloverWeek}
              disabled={rollingOver}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
            >
              <Calendar className={`h-4 w-4 ${rollingOver ? 'animate-spin' : ''}`} />
              Rollover Week
            </Button>
          )}
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
            leagueId={selectedLeague.id}
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

      {/* Rollover Confirmation Dialog */}
      <Dialog open={showRolloverDialog} onOpenChange={setShowRolloverDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Rollover Week
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to rollover to the next week? This action will:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            <div className="text-sm space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                <span>Finalize all pending matchups for Week {currentWeek - 1}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                <span>Update league standings and records</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                <span>Refresh betting options for the new week</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                <span>Advance playoff teams (if applicable)</span>
              </div>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
              <p className="text-sm text-orange-800 dark:text-orange-200 font-medium">
                ⚠️ This action cannot be undone!
              </p>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRolloverDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmRolloverWeek} 
              disabled={rollingOver}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {rollingOver ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Rolling Over...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Rollover Week
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}