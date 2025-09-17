import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/ui/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Settings, Users, Trophy, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { apiService } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface LeagueDetails {
  id: number;
  name: string;
  commissioner_id: number;
  invite_code: string;
  is_setup_complete: boolean;
  setup_completed_at: string | null;
  created_at: string;
  member_count: number;
  members?: Array<{
    id: number;
    username: string;
    wins: number;
    losses: number;
  }>;
}

export default function LeagueSettings() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [league, setLeague] = useState<LeagueDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmingSetup, setConfirmingSetup] = useState(false);
  const [regeneratingSchedule, setRegeneratingSchedule] = useState(false);

  useEffect(() => {
    if (leagueId) {
      loadLeagueDetails();
    }
  }, [leagueId]);

  const loadLeagueDetails = async () => {
    if (!leagueId) return;
    
    try {
      setLoading(true);
      const response = await apiService.getLeague(parseInt(leagueId));
      setLeague(response.league);
    } catch (error) {
      console.error('Failed to load league details:', error);
      toast.error('Failed to load league details');
      navigate('/leagues');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSetup = async () => {
    if (!league) return;
    
    try {
      setConfirmingSetup(true);
      const response = await apiService.confirmLeagueSetup(league.id);
      
      toast.success(`League setup confirmed! Generated ${response.total_matchups} matchups (${response.regular_season_matchups} regular season, ${response.playoff_matchups} playoffs)`);
      
      // Reload league data to get updated setup status
      await loadLeagueDetails();
      
    } catch (error) {
      console.error('Failed to confirm league setup:', error);
      toast.error('Failed to confirm league setup');
    } finally {
      setConfirmingSetup(false);
    }
  };

  const handleRegenerateSchedule = async () => {
    if (!leagueId) return;
    
    try {
      setRegeneratingSchedule(true);
      await apiService.generateSchedule(parseInt(leagueId));
      toast.success('Schedule regenerated successfully!');
      // Reload league details to show updated status
      await loadLeagueDetails();
    } catch (error) {
      console.error('Failed to regenerate schedule:', error);
      toast.error('Failed to regenerate schedule');
    } finally {
      setRegeneratingSchedule(false);
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
              <p className="text-muted-foreground">Loading league details...</p>
            </div>
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
              <p className="text-muted-foreground">The league you're looking for doesn't exist.</p>
              <Button onClick={() => navigate('/leagues')} className="mt-4">
                Back to Leagues
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isCommissioner = user?.id === league.commissioner_id;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{league.name}</h1>
            <p className="text-muted-foreground">League Settings & Management</p>
          </div>
          <Button onClick={() => navigate('/leagues')} variant="outline">
            Back to Leagues
          </Button>
        </div>

        {/* League Status */}
        {league.is_setup_complete ? (
          <Card className="border-green-500 bg-green-50 dark:bg-green-900/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">League setup complete!</span>
                <span className="text-sm text-green-600 dark:text-green-400">
                  Matchups generated for weeks 1-17
                </span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-200">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">League setup pending</span>
                <span className="text-sm text-yellow-600 dark:text-yellow-400">
                  Commissioner needs to confirm setup
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5" />
                    <span>League Info</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{league.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invite Code:</span>
                    <Badge variant="secondary">{league.invite_code}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Members:</span>
                    <span className="font-medium">{league.member_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-medium">
                      {new Date(league.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={league.is_setup_complete ? "default" : "secondary"}>
                      {league.is_setup_complete ? "Active" : "Setup Pending"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>Season Schedule</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Regular Season</span>
                      <Badge variant="outline">Weeks 1-18</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Playoffs</span>
                      <Badge variant="outline">Weeks 19-22</Badge>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-3">
                        {league.is_setup_complete 
                          ? "All matchups have been generated"
                          : "Matchups will be generated when setup is confirmed"
                        }
                      </p>
                      {league.is_setup_complete && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleRegenerateSchedule}
                          disabled={regeneratingSchedule}
                          className="w-full"
                        >
                          <RefreshCw className={`w-4 h-4 mr-2 ${regeneratingSchedule ? 'animate-spin' : ''}`} />
                          Regenerate Schedule
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4 mt-6">
            {isCommissioner ? (
              <div className="space-y-6">
                {/* Commissioner Setup */}
                {!league.is_setup_complete && (
                  <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
                    <CardHeader>
                      <CardTitle className="text-yellow-800 dark:text-yellow-200">
                        🏆 Complete League Setup
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-yellow-700 dark:text-yellow-300">
                          As the commissioner, you need to confirm the league setup to generate matchups for the entire season.
                        </p>
                        <div className="bg-yellow-100 dark:bg-yellow-800/30 p-4 rounded-lg">
                          <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                            What happens when you confirm:
                          </h4>
                          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                            <li>• Regular season matchups generated for weeks 1-14</li>
                            <li>• Playoff bracket created for weeks 15-17</li>
                            <li>• League becomes active and ready for betting</li>
                            <li>• This action cannot be undone</li>
                          </ul>
                        </div>
                        <Button
                          onClick={handleConfirmSetup}
                          disabled={confirmingSetup}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                          {confirmingSetup ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                              Confirming Setup...
                            </>
                          ) : (
                            'Confirm League Setup'
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Other Commissioner Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>League Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Additional league settings coming soon</p>
                      <p className="text-sm mt-2">More customization options will be available here</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Settings Access Restricted</h3>
                  <p className="text-muted-foreground">
                    Only the league commissioner can access league settings.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>League Members ({league.member_count})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Member list coming soon</p>
                  <p className="text-sm mt-2">Detailed member information will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
