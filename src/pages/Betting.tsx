import { useState } from "react"
import { Navigation } from "@/components/ui/navigation"
import { GameCard } from "@/components/betting/GameCard"
import { BettingSlip } from "@/components/betting/BettingSlip"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, Clock, TrendingUp, Users, Target } from "lucide-react"

interface Bet {
  id: string
  game: string
  selection: string
  odds: string
  amount: number
  type: "single" | "parlay"
}

export default function Betting() {
  const [bets, setBets] = useState<Bet[]>([])
  const [balance] = useState(100)

  // Mock game data
  const games = [
    {
      id: "1",
      homeTeam: { name: "Dallas Cowboys", logo: "", odds: "-140" },
      awayTeam: { name: "Philadelphia Eagles", logo: "", odds: "+120" },
      gameTime: "Sun 1:00 PM ET",
      spread: "DAL -3.5",
      total: "O/U 47.5"
    },
    {
      id: "2",
      homeTeam: { name: "Green Bay Packers", logo: "", odds: "-110" },
      awayTeam: { name: "Chicago Bears", logo: "", odds: "-110" },
      gameTime: "Sun 1:00 PM ET",
      spread: "GB -1.5",
      total: "O/U 44.5"
    },
    {
      id: "3",
      homeTeam: { name: "Kansas City Chiefs", logo: "", odds: "-180" },
      awayTeam: { name: "Las Vegas Raiders", logo: "", odds: "+150" },
      gameTime: "Sun 4:25 PM ET",
      spread: "KC -4.5",
      total: "O/U 52.5",
      isLive: true
    },
    {
      id: "4",
      homeTeam: { name: "Buffalo Bills", logo: "", odds: "-200" },
      awayTeam: { name: "Miami Dolphins", logo: "", odds: "+170" },
      gameTime: "Sun 8:20 PM ET",
      spread: "BUF -5.5",
      total: "O/U 49.5"
    }
  ]

  const handlePlaceBet = (gameId: string, betType: string, team?: string) => {
    const game = games.find(g => g.id === gameId)
    if (!game) return

    let selection = ""
    let odds = ""

    if (betType === "moneyline") {
      selection = team === "home" ? game.homeTeam.name : game.awayTeam.name
      odds = team === "home" ? game.homeTeam.odds : game.awayTeam.odds
    } else if (betType === "spread") {
      selection = `${game.homeTeam.name} ${game.spread}`
      odds = "-110"
    } else if (betType === "total") {
      selection = `${game.total}`
      odds = "-110"
    } else {
      selection = `${betType} - ${game.homeTeam.name} vs ${game.awayTeam.name}`
      odds = "-110"
    }

    const newBet: Bet = {
      id: Date.now().toString(),
      game: `${game.awayTeam.name} @ ${game.homeTeam.name}`,
      selection,
      odds,
      amount: 0,
      type: betType === "parlay" ? "parlay" : "single"
    }

    setBets(prev => [...prev, newBet])
  }

  const handleRemoveBet = (betId: string) => {
    setBets(prev => prev.filter(bet => bet.id !== betId))
  }

  const handleUpdateAmount = (betId: string, amount: number) => {
    setBets(prev => prev.map(bet => 
      bet.id === betId ? { ...bet, amount } : bet
    ))
  }

  const handlePlaceBets = () => {
    // Handle placing bets
    console.log("Placing bets:", bets)
    setBets([])
  }

  const handleClearAll = () => {
    setBets([])
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Place Your Bets</h1>
              <p className="text-muted-foreground">Week 1 • NFL Regular Season</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-success">$100.00</div>
              <div className="text-sm text-muted-foreground">Weekly Balance</div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-card to-card/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  <div>
                    <div className="text-lg font-semibold">Week 1</div>
                    <div className="text-xs text-muted-foreground">Current</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-success" />
                  <div>
                    <div className="text-lg font-semibold">4-2</div>
                    <div className="text-xs text-muted-foreground">Season Record</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-warning" />
                  <div>
                    <div className="text-lg font-semibold">vs Mike</div>
                    <div className="text-xs text-muted-foreground">This Week</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-danger" />
                  <div>
                    <div className="text-lg font-semibold">2h 15m</div>
                    <div className="text-xs text-muted-foreground">Until First Game</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Games Section */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All Games</TabsTrigger>
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="live">
                  Live
                  <Badge variant="destructive" className="ml-2 animate-pulse">3</Badge>
                </TabsTrigger>
                <TabsTrigger value="favorites">Favorites</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-4 mt-6">
                {games.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    onPlaceBet={handlePlaceBet}
                  />
                ))}
              </TabsContent>
              
              <TabsContent value="today" className="space-y-4 mt-6">
                {games.filter(game => game.gameTime.includes("Sun")).map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    onPlaceBet={handlePlaceBet}
                  />
                ))}
              </TabsContent>
              
              <TabsContent value="live" className="space-y-4 mt-6">
                {games.filter(game => game.isLive).map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    onPlaceBet={handlePlaceBet}
                  />
                ))}
              </TabsContent>
              
              <TabsContent value="favorites" className="space-y-4 mt-6">
                <Card className="p-8 text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No favorite games yet</p>
                  <p className="text-sm text-muted-foreground mt-2">Star games to add them to your favorites</p>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Betting Slip */}
          <div>
            <BettingSlip
              bets={bets}
              balance={balance}
              onRemoveBet={handleRemoveBet}
              onUpdateAmount={handleUpdateAmount}
              onPlaceBets={handlePlaceBets}
              onClearAll={handleClearAll}
            />
          </div>
        </div>
      </div>
    </div>
  )
}