import { Navigation } from "@/components/ui/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, TrendingUp, TrendingDown, Target, Crown, Medal, Award } from "lucide-react"

export default function Standings() {
  const leagueStandings = [
    {
      position: 1,
      name: "Sarah Johnson",
      record: "5-1",
      avgBalance: 142.50,
      totalWinnings: 284.75,
      streak: "W3",
      avatar: "SJ"
    },
    {
      position: 2,
      name: "You",
      record: "4-2", 
      avgBalance: 127.30,
      totalWinnings: 255.60,
      streak: "W1",
      avatar: "ME",
      isCurrentUser: true
    },
    {
      position: 3,
      name: "Mike Chen",
      record: "4-2",
      avgBalance: 118.75,
      totalWinnings: 198.50,
      streak: "L1",
      avatar: "MC"
    },
    {
      position: 4,
      name: "Alex Rodriguez",
      record: "3-3",
      avgBalance: 95.20,
      totalWinnings: 142.30,
      streak: "W2",
      avatar: "AR"
    },
    {
      position: 5,
      name: "Emma Wilson",
      record: "2-4",
      avgBalance: 78.60,
      totalWinnings: 89.25,
      streak: "L2",
      avatar: "EW"
    },
    {
      position: 6,
      name: "David Kim",
      record: "2-4",
      avgBalance: 72.10,
      totalWinnings: 76.80,
      streak: "L3",
      avatar: "DK"
    },
    {
      position: 7,
      name: "Lisa Park",
      record: "1-5",
      avgBalance: 65.40,
      totalWinnings: 45.20,
      streak: "L1",
      avatar: "LP"
    },
    {
      position: 8,
      name: "John Smith",
      record: "1-5",
      avgBalance: 58.90,
      totalWinnings: 38.75,
      streak: "L4",
      avatar: "JS"
    }
  ]

  const weeklyMatchups = [
    {
      week: 6,
      player1: { name: "You", balance: 127.30, result: "W" },
      player2: { name: "Mike Chen", balance: 95.50, result: "L" }
    },
    {
      week: 5,
      player1: { name: "Sarah Johnson", balance: 165.75, result: "W" },
      player2: { name: "Alex Rodriguez", balance: 82.30, result: "L" }
    },
    {
      week: 4,
      player1: { name: "Emma Wilson", balance: 143.20, result: "W" },
      player2: { name: "David Kim", balance: 67.80, result: "L" }
    }
  ]

  const playoffPicture = [
    { position: 1, name: "Sarah Johnson", record: "5-1", status: "clinched" },
    { position: 2, name: "You", record: "4-2", status: "likely" },
    { position: 3, name: "Mike Chen", record: "4-2", status: "likely" },
    { position: 4, name: "Alex Rodriguez", record: "3-3", status: "bubble" }
  ]

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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">League Standings</h1>
          <p className="text-muted-foreground">Work Friends Fantasy • Week 6 of 17</p>
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
                <div className="space-y-3">
                  {leagueStandings.map((player) => (
                    <div 
                      key={player.position}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                        player.isCurrentUser 
                          ? 'bg-primary/10 border-primary/30' 
                          : 'bg-card hover:bg-card/80'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 min-w-[40px]">
                          <span className="text-2xl font-bold text-muted-foreground">
                            {player.position}
                          </span>
                          {getPositionIcon(player.position)}
                        </div>
                        
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className={player.isCurrentUser ? 'bg-primary text-primary-foreground' : ''}>
                            {player.avatar}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <div className="font-semibold flex items-center space-x-2">
                            <span>{player.name}</span>
                            {player.isCurrentUser && (
                              <Badge variant="secondary" className="text-xs">You</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {player.record} • Avg: ${player.avgBalance}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 text-right">
                        <div className="hidden sm:block">
                          <div className="font-semibold text-success">
                            ${player.totalWinnings}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Total Winnings
                          </div>
                        </div>
                        
                        <Badge 
                          variant={getStreakColor(player.streak) as any}
                          className="min-w-[40px] justify-center"
                        >
                          {player.streak}
                        </Badge>

                        <Button variant="ghost" size="sm">
                          View Profile
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
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
                <div className="space-y-4">
                  {weeklyMatchups.map((matchup) => (
                    <div key={matchup.week} className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground mb-3">Week {matchup.week}</div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`text-center px-3 py-2 rounded ${
                            matchup.player1.result === 'W' 
                              ? 'bg-success/20 text-success border border-success/30' 
                              : 'bg-destructive/20 text-destructive border border-destructive/30'
                          }`}>
                            <div className="font-semibold">{matchup.player1.name}</div>
                            <div className="text-lg font-bold">${matchup.player1.balance}</div>
                          </div>
                          
                          <div className="text-2xl font-bold text-muted-foreground">VS</div>
                          
                          <div className={`text-center px-3 py-2 rounded ${
                            matchup.player2.result === 'W' 
                              ? 'bg-success/20 text-success border border-success/30' 
                              : 'bg-destructive/20 text-destructive border border-destructive/30'
                          }`}>
                            <div className="font-semibold">{matchup.player2.name}</div>
                            <div className="text-lg font-bold">${matchup.player2.balance}</div>
                          </div>
                        </div>
                        
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
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
                <div className="space-y-3">
                  {playoffPicture.map((player) => (
                    <div key={player.position} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold w-6">{player.position}</span>
                        <div>
                          <div className="font-semibold">{player.name}</div>
                          <div className="text-sm text-muted-foreground">{player.record}</div>
                        </div>
                      </div>
                      
                      <Badge 
                        variant={
                          player.status === 'clinched' ? 'default' :
                          player.status === 'likely' ? 'secondary' : 'outline'
                        }
                      >
                        {player.status === 'clinched' && 'Clinched'}
                        {player.status === 'likely' && 'Likely'}
                        {player.status === 'bubble' && 'On Bubble'}
                      </Badge>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-muted/20 rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    <strong>Playoff Format:</strong> Top 6 teams make playoffs (Weeks 15-17)
                    <br />
                    <strong>Championship:</strong> Week 17 • Top 2 seeds get bye weeks
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* League Stats */}
          <TabsContent value="stats" className="space-y-4 mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Highest Single Week</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">$387.50</div>
                  <div className="text-sm text-muted-foreground">Sarah Johnson • Week 3</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Best Record</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5-1</div>
                  <div className="text-sm text-muted-foreground">Sarah Johnson</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">League Average</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$98.20</div>
                  <div className="text-sm text-muted-foreground">Weekly Balance</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}