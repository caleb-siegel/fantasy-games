import { Navigation } from "@/components/ui/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Settings, Trophy, TrendingUp, Calendar, DollarSign, Loader2, Plus, Users, Target, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
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
    winRate: 0,
    longestWinStreak: 0,
    // Real betting stats from API
    totalWagered: 0,
    totalWon: 0,
    netProfit: 0,
    winPercentage: 0,
    totalBets: 0,
    wonBets: 0,
    lostBets: 0,
    pendingBets: 0,
    // Current week stats
    currentWeekBets: 0,
    currentWeekParlays: 0,
    currentWeekRemaining: 100,
    currentWeekWagered: 0,
    currentWeekRegularWagered: 0,
    currentWeekParlayWagered: 0,
    foundWeek: 1
  })
  const [userLeagues, setUserLeagues] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [validatingBets, setValidatingBets] = useState(false)
  const [validationStatus, setValidationStatus] = useState<{type: 'success' | 'error' | null, message: string}>({type: null, message: ''})

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setLoading(true)
        
        // Fetch comprehensive betting statistics
        const bettingStatsResponse: any = await apiService.getUserBettingStats()
        const bettingStats: any = bettingStatsResponse || {}
        
        // Fetch user's league data
        const leaguesResponse = await apiService.getUserLeagues()
        const leagues = leaguesResponse.leagues || []
        
        // Store leagues for display
        setUserLeagues(leagues)
        
        // Try to get betting data for multiple weeks to find where the user has bets
        let currentWeekData: any = {}
        let foundWeek = 1
        
        // Try weeks 1-17 to find where user has betting activity
        for (let week = 1; week <= 17; week++) {
          try {
            const betsResponse = await apiService.getUserBets(week)
            const weekData: any = betsResponse || {}
            
            
            // If this week has any betting activity, use it
            if ((weekData.bets?.length > 0) || (weekData.parlay_bets?.length > 0)) {
              currentWeekData = weekData
              foundWeek = week
              break
            }
          } catch (error) {
            console.log(`❌ Error fetching Week ${week}:`, error)
          }
        }
        
        
        // Calculate stats from real data
        const totalLeagues = leagues.length
        const activeLeagues = leagues.filter(league => league.is_setup_complete).length
        
        // Calculate best record from league standings
        const records = leagues.map(league => league.record || "0-0")
        const bestRecord = records.reduce((best, current) => {
          const [wins, losses] = current.split('-').map(Number)
          const [bestWins, bestLosses] = best.split('-').map(Number)
          return wins > bestWins || (wins === bestWins && losses < bestLosses) ? current : best
        }, "0-0")
        
        // Calculate overall win rate from league records
        const totalWins = leagues.reduce((sum, league) => {
          const [wins] = (league.record || "0-0").split('-').map(Number)
          return sum + wins
        }, 0)
        const totalGames = leagues.reduce((sum, league) => {
          const [wins, losses] = (league.record || "0-0").split('-').map(Number)
          return sum + wins + losses
        }, 0)
        const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0
        
        // Get longest win streak from leagues
        const longestWinStreak = Math.max(...leagues.map(league => league.longest_win_streak || 0), 0)
        
        // Calculate totals from current week data (includes parlays)
        const totalWageredFromWeek = currentWeekData.total_bet_amount || 0
        const totalBetsFromWeek = (currentWeekData.bets?.length || 0) + (currentWeekData.parlay_bets?.length || 0)
        
        // Calculate pending bets from current week data (includes parlays)
        const pendingRegularBets = currentWeekData.bets?.filter(bet => bet.status === null || bet.status === 'pending').length || 0
        const pendingParlayBets = currentWeekData.parlay_bets?.filter(parlay => parlay.status === 'pending' || parlay.status === 'locked').length || 0
        const totalPendingBets = pendingRegularBets + pendingParlayBets
        
        setUserStats({
          totalLeagues,
          activeLeagues,
          totalWinnings: 0, // This would need to be calculated from actual winnings
          bestRecord,
          winRate,
          longestWinStreak,
          // Use current week data for betting statistics (includes parlays)
          totalWagered: totalWageredFromWeek,
          totalWon: bettingStats.total_won || 0,
          netProfit: (bettingStats.total_won || 0) - totalWageredFromWeek,
          winPercentage: bettingStats.win_percentage || 0,
          totalBets: totalBetsFromWeek,
          wonBets: bettingStats.won_bets || 0,
          lostBets: bettingStats.lost_bets || 0,
          pendingBets: totalPendingBets,
          // Current week stats
          currentWeekBets: currentWeekData.bets?.length || 0,
          currentWeekParlays: currentWeekData.parlay_bets?.length || 0,
          currentWeekRemaining: currentWeekData.remaining_balance || 100,
          currentWeekWagered: currentWeekData.total_bet_amount || 0,
          currentWeekRegularWagered: currentWeekData.total_regular_bet_amount || 0,
          currentWeekParlayWagered: currentWeekData.total_parlay_bet_amount || 0,
          foundWeek: foundWeek
        })
        
        // Build recent activity from real data
        const activity = []
        
        // Add account creation
        activity.push({
          action: "Account created",
          league: "System",
          amount: "",
          date: user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Recently",
          timestamp: user?.created_at ? new Date(user.created_at).getTime() : Date.now()
        })
        
        // Add league activities
        leagues.forEach(league => {
          // Add league join/creation
          activity.push({
            action: league.is_commissioner ? "Created league" : "Joined league",
            league: league.name,
            amount: "",
            date: league.joined_at ? new Date(league.joined_at).toLocaleDateString() : "Recently",
            timestamp: league.joined_at ? new Date(league.joined_at).getTime() : Date.now()
          })
        })
        
        // Add recent bets activity from current week (regular bets)
        if (currentWeekData.bets && currentWeekData.bets.length > 0) {
          const recentBets = currentWeekData.bets.slice(0, 3) // Show last 3 regular bets
          recentBets.forEach(bet => {
            activity.push({
              action: `Bet placed on ${bet.betting_option?.outcome_name || 'game'}`,
              league: "Current Week",
              amount: `-$${bet.amount.toFixed(2)}`,
              date: bet.created_at ? new Date(bet.created_at).toLocaleDateString() : "Recently",
              timestamp: bet.created_at ? new Date(bet.created_at).getTime() : Date.now()
            })
          })
        }
        
        // Add recent parlay bets activity from current week
        if (currentWeekData.parlay_bets && currentWeekData.parlay_bets.length > 0) {
          const recentParlays = currentWeekData.parlay_bets.slice(0, 2) // Show last 2 parlay bets
          recentParlays.forEach(parlay => {
            activity.push({
              action: `Parlay bet placed (${parlay.legs?.length || 0} legs)`,
              league: "Current Week",
              amount: `-$${parlay.amount.toFixed(2)}`,
              date: parlay.created_at ? new Date(parlay.created_at).toLocaleDateString() : "Recently",
              timestamp: parlay.created_at ? new Date(parlay.created_at).getTime() : Date.now()
            })
          })
        }
        
        // Sort by timestamp (most recent first) and limit to 10 items
        activity.sort((a, b) => b.timestamp - a.timestamp)
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

  const handleManualBetValidation = async () => {
    try {
      setValidatingBets(true)
      setValidationStatus({type: null, message: ''})
      
      const result = await apiService.runBetValidation() as any
      
      if (result?.success) {
        setValidationStatus({
          type: 'success',
          message: `Validation complete! Processed ${result.results?.games_processed || 0} games and settled ${result.results?.bets_evaluated || 0} bets.`
        })
        
        // Refresh user stats to show updated data
        const bettingStatsResponse: any = await apiService.getUserBettingStats()
        const bettingStats: any = bettingStatsResponse || {}
        
        // Also refresh current week data to get updated parlay info
        const currentWeekData = await apiService.getUserBets(prev.foundWeek)
        const totalWageredFromWeek = currentWeekData.total_bet_amount || 0
        const totalBetsFromWeek = (currentWeekData.bets?.length || 0) + (currentWeekData.parlay_bets?.length || 0)
        
        // Calculate pending bets from current week data (includes parlays)
        const pendingRegularBets = currentWeekData.bets?.filter(bet => bet.status === null || bet.status === 'pending').length || 0
        const pendingParlayBets = currentWeekData.parlay_bets?.filter(parlay => parlay.status === 'pending' || parlay.status === 'locked').length || 0
        const totalPendingBets = pendingRegularBets + pendingParlayBets
        
        setUserStats(prev => ({
          ...prev,
          totalWagered: totalWageredFromWeek,
          totalWon: bettingStats.total_won || 0,
          netProfit: (bettingStats.total_won || 0) - totalWageredFromWeek,
          winPercentage: bettingStats.win_percentage || 0,
          totalBets: totalBetsFromWeek,
          wonBets: bettingStats.won_bets || 0,
          lostBets: bettingStats.lost_bets || 0,
          pendingBets: totalPendingBets,
          // Update current week stats too
          currentWeekBets: currentWeekData.bets?.length || 0,
          currentWeekParlays: currentWeekData.parlay_bets?.length || 0,
          currentWeekRemaining: currentWeekData.remaining_balance || 100,
          currentWeekWagered: currentWeekData.total_bet_amount || 0,
          currentWeekRegularWagered: currentWeekData.total_regular_bet_amount || 0,
          currentWeekParlayWagered: currentWeekData.total_parlay_bet_amount || 0
        }))
      } else {
        setValidationStatus({
          type: 'error',
          message: result.error || 'Validation failed. Please try again.'
        })
      }
    } catch (error) {
      console.error('Manual validation error:', error)
      setValidationStatus({
        type: 'error',
        message: 'Failed to validate bets. Please try again.'
      })
    } finally {
      setValidatingBets(false)
    }
  }

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
                        <span>This Week's Balance</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-primary">${userStats.currentWeekRemaining.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">Remaining of $100</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>League Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span>Overall Win Rate</span>
                          <span className="font-semibold">{userStats.winRate}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>This Week Wagered</span>
                          <span className="font-semibold">${userStats.currentWeekWagered.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Longest Win Streak</span>
                          <span className="font-semibold">{userStats.longestWinStreak} weeks</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Week {userStats.foundWeek} Bets</span>
                          <span className="font-semibold">{userStats.currentWeekBets + userStats.currentWeekParlays}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Betting Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span>Total Wagered</span>
                          <span className="font-semibold">${userStats.totalWagered.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Total Won</span>
                          <span className="font-semibold text-success">${userStats.totalWon.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Net Profit</span>
                          <span className={`font-semibold ${userStats.netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                            ${userStats.netProfit.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Bet Win Rate</span>
                          <span className="font-semibold">{userStats.winPercentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Bet Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">All Bets</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Total Bets:</span>
                            <span>{userStats.totalBets}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Won:</span>
                            <span className="text-success">{userStats.wonBets}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Lost:</span>
                            <span className="text-destructive">{userStats.lostBets}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pending:</span>
                            <span className="text-muted-foreground">{userStats.pendingBets}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Win Rate:</span>
                            <span className="font-semibold">{userStats.winPercentage.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-3">Week {userStats.foundWeek}</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Regular Bets:</span>
                            <span>{userStats.currentWeekBets}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Parlay Bets:</span>
                            <span>{userStats.currentWeekParlays}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Wagered:</span>
                            <span>${userStats.currentWeekWagered.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Remaining:</span>
                            <span className="text-success">${userStats.currentWeekRemaining.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Budget Used:</span>
                            <span className="font-semibold">
                              {((100 - userStats.currentWeekRemaining) / 100 * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
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
                      } else if (activity.action.includes("Parlay bet placed")) {
                        Icon = Target
                        iconColor = "text-purple-500"
                        bgColor = "bg-purple-100"
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
