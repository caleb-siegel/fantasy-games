import { Navigation } from "@/components/ui/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Settings, Trophy, TrendingUp, Calendar, DollarSign, Loader2, Plus, Users, Target } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useState, useEffect } from "react"
import apiService from "@/services/api"
import { EditProfileDialog } from "@/components/EditProfileDialog"

export default function Profile() {
  const { user } = useAuth()
  const [userStats, setUserStats] = useState({
    totalLeagues: 0,
    activeLeagues: 0,
    totalWinnings: 0,
    bestRecord: "0-0",
    currentBalance: 100.00,
    winRate: 0,
    avgWeeklyBalance: 100.00,
    longestWinStreak: 0,
    favoriteBetType: "Moneyline"
  })
  const [userLeagues, setUserLeagues] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setLoading(true)
        // Fetch user's league data
        const leaguesResponse = await apiService.getUserLeagues()
        const leagues = leaguesResponse.leagues || []
        
        // Store leagues for display
        setUserLeagues(leagues)
        
        // Fetch user's betting history
        const betsResponse = await apiService.getUserBets(1) // Current week
        const bets = betsResponse.bets || []
        
        // Calculate stats from real data
        const totalLeagues = leagues.length
        const activeLeagues = leagues.filter(league => league.is_active).length
        
        // Calculate total winnings from all leagues
        const totalWinnings = leagues.reduce((sum, league) => sum + (league.total_winnings || 0), 0)
        
        // Calculate best record
        const records = leagues.map(league => league.record || "0-0")
        const bestRecord = records.reduce((best, current) => {
          const [wins, losses] = current.split('-').map(Number)
          const [bestWins, bestLosses] = best.split('-').map(Number)
          return wins > bestWins || (wins === bestWins && losses < bestLosses) ? current : best
        }, "0-0")
        
        // Calculate win rate
        const totalWins = leagues.reduce((sum, league) => {
          const [wins] = (league.record || "0-0").split('-').map(Number)
          return sum + wins
        }, 0)
        const totalGames = leagues.reduce((sum, league) => {
          const [wins, losses] = (league.record || "0-0").split('-').map(Number)
          return sum + wins + losses
        }, 0)
        const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0
        
        // Calculate average weekly balance
        const avgWeeklyBalance = leagues.length > 0 
          ? leagues.reduce((sum, league) => sum + (league.avg_balance || 100), 0) / leagues.length
          : 100
        
        setUserStats({
          totalLeagues,
          activeLeagues,
          totalWinnings,
          bestRecord,
          currentBalance: betsResponse.remaining_balance || 100,
          winRate,
          avgWeeklyBalance,
          longestWinStreak: Math.max(...leagues.map(league => league.longest_win_streak || 0)),
          favoriteBetType: "Moneyline" // This would need more complex calculation
        })
        
        // Build recent activity from real data
        const activity = []
        
        // Add account creation
        activity.push({
          action: "Account created",
          league: "System",
          amount: "",
          date: user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Recently"
        })
        
        // Add league activities
        leagues.forEach(league => {
          // Add league join/creation
          activity.push({
            action: league.is_commissioner ? "Created league" : "Joined league",
            league: league.name,
            amount: "",
            date: league.joined_at ? new Date(league.joined_at).toLocaleDateString() : "Recently"
          })
          
          // Add recent betting activity if available
          if (league.total_winnings > 0) {
            activity.push({
              action: "Weekly winnings",
              league: league.name,
              amount: `+$${league.total_winnings.toFixed(2)}`,
              date: "This week"
            })
          }
        })
        
        // Add recent bets activity
        if (bets.length > 0) {
          const recentBets = bets.slice(0, 3) // Show last 3 bets
          recentBets.forEach(bet => {
            activity.push({
              action: `Bet placed on ${bet.team}`,
              league: "Current Week",
              amount: `-$${bet.amount.toFixed(2)}`,
              date: bet.created_at ? new Date(bet.created_at).toLocaleDateString() : "Recently"
            })
          })
        }
        
        // Sort by date (most recent first) and limit to 10 items
        activity.sort((a, b) => {
          const dateA = new Date(a.date).getTime()
          const dateB = new Date(b.date).getTime()
          return dateB - dateA
        })
        setRecentActivity(activity.slice(0, 10))
        
      } catch (error) {
        console.error('Error fetching user stats:', error)
        // Keep default values on error
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchUserStats()
    }
  }, [user])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                {user?.username ? user.username.slice(0, 2).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{user?.username || 'User'}</h1>
              <p className="text-muted-foreground">{user?.email || 'No email'}</p>
              <p className="text-sm text-muted-foreground">
                Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                }) : 'Recently'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
            <Badge variant="secondary">Active Player</Badge>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="leagues">My Leagues</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-2">Loading your stats...</span>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Trophy className="w-5 h-5 text-primary" />
                        <span>Total Winnings</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-success">${userStats.totalWinnings.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">All time</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-success" />
                        <span>Best Record</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{userStats.bestRecord}</div>
                      <div className="text-sm text-muted-foreground">Season best</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Calendar className="w-5 h-5 text-warning" />
                        <span>Active Leagues</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{userStats.activeLeagues}</div>
                      <div className="text-sm text-muted-foreground">of {userStats.totalLeagues} total</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <DollarSign className="w-5 h-5 text-primary" />
                        <span>Current Balance</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-primary">${userStats.currentBalance.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">This week</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Win Rate</span>
                        <span className="font-semibold">{userStats.winRate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Average Weekly Balance</span>
                        <span className="font-semibold">${userStats.avgWeeklyBalance.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Longest Win Streak</span>
                        <span className="font-semibold">{userStats.longestWinStreak} weeks</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Favorite Bet Type</span>
                        <span className="font-semibold">{userStats.favoriteBetType}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="ml-2">Loading activity...</span>
                  </div>
                ) : recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => {
                      // Determine icon and color based on activity type
                      let Icon = TrendingUp
                      let iconColor = "text-primary"
                      let bgColor = "bg-primary/10"
                      
                      if (activity.action.includes("Account created")) {
                        Icon = User
                        iconColor = "text-blue-500"
                        bgColor = "bg-blue-100"
                      } else if (activity.action.includes("Created league") || activity.action.includes("Joined league")) {
                        Icon = Users
                        iconColor = "text-green-500"
                        bgColor = "bg-green-100"
                      } else if (activity.action.includes("Bet placed")) {
                        Icon = Target
                        iconColor = "text-orange-500"
                        bgColor = "bg-orange-100"
                      } else if (activity.action.includes("winnings")) {
                        Icon = DollarSign
                        iconColor = "text-green-500"
                        bgColor = "bg-green-100"
                      }
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 ${bgColor} rounded-full flex items-center justify-center`}>
                              <Icon className={`w-4 h-4 ${iconColor}`} />
                            </div>
                            <div>
                              <div className="font-medium">{activity.action}</div>
                              <div className="text-sm text-muted-foreground">{activity.league}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            {activity.amount && (
                              <div className={`font-semibold ${activity.amount.startsWith('+') ? 'text-success' : 'text-destructive'}`}>
                                {activity.amount}
                              </div>
                            )}
                            <div className="text-sm text-muted-foreground">{activity.date}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No activity yet</p>
                    <p className="text-sm mt-2">Your betting activity will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Leagues Tab */}
          <TabsContent value="leagues" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>My Leagues</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="ml-2">Loading leagues...</span>
                  </div>
                ) : userLeagues.length > 0 ? (
                  <div className="space-y-4">
                    {userLeagues.map((league) => (
                      <div key={league.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold">{league.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {league.member_count} members • {league.is_commissioner ? 'Commissioner' : 'Member'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            Record: {league.record || '0-0'}
                          </div>
                          <div className="text-sm text-success">
                            ${league.total_winnings?.toFixed(2) || '0.00'} winnings
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="pt-4">
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => window.location.href = '/leagues'}
                      >
                        Manage Leagues
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No leagues yet</p>
                    <p className="text-sm mt-2">Create or join a league to get started</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => window.location.href = '/leagues'}
                    >
                      Browse Leagues
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Settings panel coming soon</p>
                  <p className="text-sm mt-2">Account customization options will be available here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <EditProfileDialog 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen} 
      />
    </div>
  )
}
