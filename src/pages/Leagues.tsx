import { Navigation } from "@/components/ui/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Users, Plus, Trophy, TrendingUp, Calendar, Settings } from "lucide-react"

export default function Leagues() {
  const myLeagues = [
    {
      id: "1",
      name: "Work Friends Fantasy",
      members: 10,
      maxMembers: 12,
      currentWeek: 6,
      totalWeeks: 17,
      isCommissioner: true,
      record: "4-2",
      position: 2,
      balance: "$127.50"
    },
    {
      id: "2", 
      name: "College Buddies League",
      members: 8,
      maxMembers: 8,
      currentWeek: 6,
      totalWeeks: 17,
      isCommissioner: false,
      record: "5-1",
      position: 1,
      balance: "$154.20"
    },
    {
      id: "3",
      name: "Family Championship",
      members: 6,
      maxMembers: 8,
      currentWeek: 6,
      totalWeeks: 17,
      isCommissioner: false,
      record: "2-4",
      position: 5,
      balance: "$68.30"
    }
  ]

  const availableLeagues = [
    {
      id: "4",
      name: "Public League #247",
      members: 7,
      maxMembers: 10,
      description: "Open to all skill levels"
    },
    {
      id: "5",
      name: "High Stakes Championship", 
      members: 11,
      maxMembers: 12,
      description: "Experienced players only"
    }
  ]

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
          <Button className="bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90">
            <Plus className="w-4 h-4 mr-2" />
            Create League
          </Button>
        </div>

        {/* My Active Leagues */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Active Leagues</h2>
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {myLeagues.map((league) => (
              <Card key={league.id} className="hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-card to-card/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{league.name}</span>
                        {league.isCommissioner && (
                          <Badge variant="secondary" className="text-xs">
                            Commissioner
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center space-x-4 mt-2">
                        <span className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{league.members}/{league.maxMembers}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Week {league.currentWeek}</span>
                        </span>
                      </CardDescription>
                    </div>
                    {league.isCommissioner && (
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Season Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Season Progress</span>
                      <span>{league.currentWeek}/{league.totalWeeks}</span>
                    </div>
                    <Progress value={(league.currentWeek / league.totalWeeks) * 100} className="h-2" />
                  </div>

                  {/* Performance Stats */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-success">{league.record}</div>
                      <div className="text-xs text-muted-foreground">Record</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">#{league.position}</div>
                      <div className="text-xs text-muted-foreground">Position</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-primary">{league.balance}</div>
                      <div className="text-xs text-muted-foreground">Avg Balance</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Trophy className="w-3 h-3 mr-1" />
                      Standings
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Place Bets
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Join a League */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Available Leagues</h2>
            <Button variant="outline">
              Browse All
            </Button>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-6">
            {availableLeagues.map((league) => (
              <Card key={league.id} className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{league.name}</span>
                    <Badge variant="outline">
                      {league.members}/{league.maxMembers} spots
                    </Badge>
                  </CardTitle>
                  <CardDescription>{league.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {[...Array(Math.min(4, league.members))].map((_, i) => (
                        <Avatar key={i} className="w-8 h-8 border-2 border-background">
                          <AvatarFallback className="text-xs">U{i + 1}</AvatarFallback>
                        </Avatar>
                      ))}
                      {league.members > 4 && (
                        <div className="w-8 h-8 bg-muted rounded-full border-2 border-background flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">+{league.members - 4}</span>
                        </div>
                      )}
                    </div>
                    <Button size="sm" className="bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90">
                      Join League
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Empty State for New Users */}
        {myLeagues.length === 0 && (
          <Card className="text-center py-12 bg-gradient-to-br from-card to-card/50">
            <CardContent>
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <CardTitle className="text-2xl mb-4">No Leagues Yet</CardTitle>
              <CardDescription className="text-lg mb-6 max-w-md mx-auto">
                Create your first fantasy betting league or join an existing one to get started
              </CardDescription>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your League
                </Button>
                <Button size="lg" variant="outline">
                  Browse Available Leagues
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}