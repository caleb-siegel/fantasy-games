import { Navigation } from "@/components/ui/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Users, Plus, Trophy, TrendingUp, Calendar, Settings, Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { apiService } from "@/services/api"
import { useAuth } from "@/hooks/useAuth"
import { CreateLeagueDialog } from "@/components/CreateLeagueDialog"
import { JoinLeagueDialog } from "@/components/JoinLeagueDialog"

interface League {
  id: number
  name: string
  member_count: number
  is_commissioner: boolean
  invite_code: string
  created_at: string
  record?: string
  total_winnings?: number
  avg_balance?: number
  longest_win_streak?: number
}

export default function Leagues() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [myLeagues, setMyLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)

  useEffect(() => {
    fetchUserLeagues()
  }, [])

  const fetchUserLeagues = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiService.getUserLeagues()
      setMyLeagues(response.leagues)
    } catch (err) {
      console.error('Failed to fetch leagues:', err)
      setError('Failed to load leagues. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Leagues</h1>
            <p className="text-muted-foreground">Manage and view all your fantasy betting leagues</p>
          </div>
          <Button 
            className="bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create League
          </Button>
        </div>

        {/* My Active Leagues */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">My Leagues</h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Loading leagues...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchUserLeagues}>Try Again</Button>
            </div>
          ) : myLeagues.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No leagues yet</h3>
              <p className="text-muted-foreground mb-6">Create your first league or join one with an invite code</p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create League
                </Button>
                <Button variant="outline" onClick={() => setJoinDialogOpen(true)}>
                  Join League
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {myLeagues.map((league) => (
              <Card key={league.id} className="hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-card to-card/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{league.name}</span>
                        {league.is_commissioner && (
                          <Badge variant="secondary" className="text-xs">
                            Commissioner
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center space-x-4 mt-2">
                        <span className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{league.member_count} members</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Created {new Date(league.created_at).toLocaleDateString()}</span>
                        </span>
                      </CardDescription>
                    </div>
                    {league.is_commissioner && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate('/profile')}
                        title="League Settings"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* League Info */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Invite Code</span>
                      <span className="font-mono font-semibold">{league.invite_code}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Share this code to invite others
                    </div>
                  </div>

                  {/* User Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Your Record</p>
                      <p className="font-semibold">{league.record || "0-0"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Total Winnings</p>
                      <p className="font-semibold text-green-600">${league.total_winnings || 0}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Avg Balance</p>
                      <p className="font-semibold">${league.avg_balance || 100}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Win Streak</p>
                      <p className="font-semibold">{league.longest_win_streak || 0}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      className="flex-1" 
                      onClick={() => navigate('/betting')}
                    >
                      Place Bets
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/standings')}
                    >
                      View Standings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          )}
        </div>

        {/* Create or Join League */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Create or Join a League</h2>
          
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Create League Card */}
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>Create New League</span>
                </CardTitle>
                <CardDescription>
                  Start your own fantasy betting league and invite friends to join
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p>• Set up your league name</p>
                    <p>• Generate invite code for members</p>
                    <p>• Manage league settings</p>
                    <p>• Track standings and results</p>
                  </div>
                  <Button 
                    className="w-full"
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create League
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Join League Card */}
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Join Existing League</span>
                </CardTitle>
                <CardDescription>
                  Enter an invite code to join a league created by someone else
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p>• Enter 8-character invite code</p>
                    <p>• Join instantly if code is valid</p>
                    <p>• Start betting immediately</p>
                    <p>• Compete with league members</p>
                  </div>
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => setJoinDialogOpen(true)}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Join League
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
      
      {/* Dialogs */}
      <CreateLeagueDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onLeagueCreated={fetchUserLeagues}
      />
      <JoinLeagueDialog
        open={joinDialogOpen}
        onOpenChange={setJoinDialogOpen}
        onLeagueJoined={fetchUserLeagues}
      />
    </div>
  )
}

