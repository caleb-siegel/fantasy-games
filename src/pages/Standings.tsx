import { Navigation } from "@/components/ui/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, TrendingUp, TrendingDown, Target, Crown, Medal, Award, Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { apiService } from "@/services/api"
import { useToast } from "@/hooks/use-toast"

interface League {
  id: number
  name: string
  commissioner_id: number
  invite_code: string
  created_at: string
  member_count: number
}

interface Standing {
  id: number
  league_id: number
  user_id: number
  username: string
  wins: number
  losses: number
  points_for: number
  points_against: number
  rank: number
  win_percentage: number
  joined_at: string
}

interface Matchup {
  id: number
  league_id: number
  week: number
  user1_id: number
  user2_id: number
  user1_username: string
  user2_username: string
  winner_id: number | null
  created_at: string
  user1_balance?: number
  user2_balance?: number
}

export default function Standings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  
  // State management
  const [leagues, setLeagues] = useState<League[]>([])
  const [selectedLeagueId, setSelectedLeagueId] = useState<number | null>(null)
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null)
  const [standings, setStandings] = useState<Standing[]>([])
  const [matchups, setMatchups] = useState<Matchup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch user's leagues on component mount
  useEffect(() => {
    fetchUserLeagues()
  }, [])

  // Fetch standings and matchups when league is selected
  useEffect(() => {
    if (selectedLeagueId) {
      fetchLeagueData(selectedLeagueId)
    }
  }, [selectedLeagueId])

  const fetchUserLeagues = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiService.getUserLeagues()
      setLeagues(response.leagues)
      
      // Auto-select first league if available
      if (response.leagues.length > 0) {
        setSelectedLeagueId(response.leagues[0].id)
        setSelectedLeague(response.leagues[0])
      }
    } catch (err) {
      console.error('Failed to fetch leagues:', err)
      setError('Failed to load leagues. Please try again.')
      toast({
        title: "Error",
        description: "Failed to load leagues. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchLeagueData = async (leagueId: number) => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch standings
      const standingsResponse = await apiService.getLeagueStandings(leagueId)
      setStandings(standingsResponse.standings)
      
      // Fetch league details for matchups
      const leagueResponse = await apiService.getLeague(leagueId)
      setMatchups(leagueResponse.league.recent_matchups || [])
      
    } catch (err) {
      console.error('Failed to fetch league data:', err)
      setError('Failed to load league data. Please try again.')
      toast({
        title: "Error",
        description: "Failed to load league data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLeagueChange = (leagueId: string) => {
    const id = parseInt(leagueId)
    setSelectedLeagueId(id)
    const league = leagues.find(l => l.id === id)
    setSelectedLeague(league || null)
  }

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return null
    }
  }

  const getStreakColor = (streak: string) => {
    return streak.startsWith('W') ? 'success' : 'destructive'
  }

  const getRecord = (wins: number, losses: number) => {
    return `${wins}-${losses}`
  }

  const getStreak = (wins: number, losses: number) => {
    // This is a simplified streak calculation - in a real app you'd track actual streaks
    if (wins > losses) {
      return `W${Math.min(wins - losses, 5)}` // Cap at W5 for display
    } else if (losses > wins) {
      return `L${Math.min(losses - wins, 5)}` // Cap at L5 for display
    } else {
      return 'E' // Even record
    }
  }

  const getAvatarInitials = (username: string) => {
    return username.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2)
  }

  const isCurrentUser = (userId: number) => {
    return user?.id === userId
  }

  if (loading && leagues.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading leagues...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && leagues.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchUserLeagues}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  if (leagues.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-8">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No Leagues Found</h2>
            <p className="text-muted-foreground mb-4">You're not a member of any leagues yet.</p>
            <Button onClick={() => navigate('/leagues')}>Go to Leagues</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">League Standings</h1>
            <Select value={selectedLeagueId?.toString()} onValueChange={handleLeagueChange}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a league" />
              </SelectTrigger>
              <SelectContent>
                {leagues.map((league) => (
                  <SelectItem key={league.id} value={league.id.toString()}>
                    {league.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedLeague && (
            <p className="text-muted-foreground">
              {selectedLeague.name} • {selectedLeague.member_count} members
            </p>
          )}
        </div>

        <Tabs defaultValue="standings" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="standings">Standings</TabsTrigger>
            <TabsTrigger value="matchups">Weekly Results</TabsTrigger>
            <TabsTrigger value="playoffs">Playoff Picture</TabsTrigger>
            <TabsTrigger value="stats">League Stats</TabsTrigger>
          </TabsList>
          
          {/* Main Standings */}
          <TabsContent value="standings" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  <span>Overall Standings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span>Loading standings...</span>
                  </div>
                ) : standings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No standings data available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {standings.map((standing) => (
                      <div 
                        key={standing.id}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                          isCurrentUser(standing.user_id)
                            ? 'bg-primary/10 border-primary/30' 
                            : 'bg-card hover:bg-card/80'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2 min-w-[40px]">
                            <span className="text-2xl font-bold text-muted-foreground">
                              {standing.rank}
                            </span>
                            {getPositionIcon(standing.rank)}
                          </div>
                          
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className={isCurrentUser(standing.user_id) ? 'bg-primary text-primary-foreground' : ''}>
                              {getAvatarInitials(standing.username)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div>
                            <div className="font-semibold flex items-center space-x-2">
                              <span>{standing.username}</span>
                              {isCurrentUser(standing.user_id) && (
                                <Badge variant="secondary" className="text-xs">You</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {getRecord(standing.wins, standing.losses)} • Win Rate: {Math.round(standing.win_percentage * 100)}%
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6 text-right">
                          <div className="hidden sm:block">
                            <div className="font-semibold text-success">
                              ${standing.points_for.toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Points For
                            </div>
                          </div>
                          
                          <Badge 
                            variant={getStreakColor(getStreak(standing.wins, standing.losses)) as any}
                            className="min-w-[40px] justify-center"
                          >
                            {getStreak(standing.wins, standing.losses)}
                          </Badge>

                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate('/profile')}
                          >
                            View Profile
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Weekly Matchups */}
          <TabsContent value="matchups" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Matchup Results</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span>Loading matchups...</span>
                  </div>
                ) : matchups.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No matchup data available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {matchups.map((matchup) => (
                      <div key={matchup.id} className="p-4 border rounded-lg">
                        <div className="text-sm text-muted-foreground mb-3">Week {matchup.week}</div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`text-center px-3 py-2 rounded ${
                              matchup.winner_id === matchup.user1_id
                                ? 'bg-success/20 text-success border border-success/30' 
                                : 'bg-destructive/20 text-destructive border border-destructive/30'
                            }`}>
                              <div className="font-semibold">{matchup.user1_username}</div>
                              <div className="text-lg font-bold">
                                ${matchup.user1_balance?.toFixed(2) || '0.00'}
                              </div>
                            </div>
                            
                            <div className="text-2xl font-bold text-muted-foreground">VS</div>
                            
                            <div className={`text-center px-3 py-2 rounded ${
                              matchup.winner_id === matchup.user2_id
                                ? 'bg-success/20 text-success border border-success/30' 
                                : 'bg-destructive/20 text-destructive border border-destructive/30'
                            }`}>
                              <div className="font-semibold">{matchup.user2_username}</div>
                              <div className="text-lg font-bold">
                                ${matchup.user2_balance?.toFixed(2) || '0.00'}
                              </div>
                            </div>
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate('/leagues')}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Playoff Picture */}
          <TabsContent value="playoffs" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  <span>Playoff Picture</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span>Loading playoff picture...</span>
                  </div>
                ) : standings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No playoff data available</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {standings.slice(0, 6).map((standing) => {
                        const getPlayoffStatus = (rank: number, wins: number, losses: number) => {
                          const totalGames = wins + losses
                          if (rank <= 2) return 'clinched'
                          if (rank <= 4 && totalGames >= 4) return 'likely'
                          if (rank <= 6) return 'bubble'
                          return 'out'
                        }
                        
                        const status = getPlayoffStatus(standing.rank, standing.wins, standing.losses)
                        
                        return (
                          <div key={standing.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center space-x-3">
                              <span className="text-lg font-bold w-6">{standing.rank}</span>
                              <div>
                                <div className="font-semibold flex items-center space-x-2">
                                  <span>{standing.username}</span>
                                  {isCurrentUser(standing.user_id) && (
                                    <Badge variant="secondary" className="text-xs">You</Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {getRecord(standing.wins, standing.losses)}
                                </div>
                              </div>
                            </div>
                            
                            <Badge 
                              variant={
                                status === 'clinched' ? 'default' :
                                status === 'likely' ? 'secondary' : 
                                status === 'bubble' ? 'outline' : 'destructive'
                              }
                            >
                              {status === 'clinched' && 'Clinched'}
                              {status === 'likely' && 'Likely'}
                              {status === 'bubble' && 'On Bubble'}
                              {status === 'out' && 'Out'}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                    
                    <div className="mt-6 p-4 bg-muted/20 rounded-lg">
                      <div className="text-sm text-muted-foreground">
                        <strong>Playoff Format:</strong> Top 6 teams make playoffs (Weeks 15-17)
                        <br />
                        <strong>Championship:</strong> Week 17 • Top 2 seeds get bye weeks
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* League Stats */}
          <TabsContent value="stats" className="space-y-4 mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Loading league stats...</span>
              </div>
            ) : standings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No league stats available</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Highest Points</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-success">
                      ${standings[0]?.points_for.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {standings[0]?.username || 'N/A'}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Best Record</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {standings[0] ? getRecord(standings[0].wins, standings[0].losses) : '0-0'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {standings[0]?.username || 'N/A'}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">League Average</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${standings.length > 0 
                        ? (standings.reduce((sum, s) => sum + s.points_for, 0) / standings.length).toFixed(2)
                        : '0.00'
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">Points For</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Total Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{standings.length}</div>
                    <div className="text-sm text-muted-foreground">Active Players</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Highest Win Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {standings[0] ? Math.round(standings[0].win_percentage * 100) : 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {standings[0]?.username || 'N/A'}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Total Games Played</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {standings.reduce((sum, s) => sum + s.wins + s.losses, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">All Matchups</div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}