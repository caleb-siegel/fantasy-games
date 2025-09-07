import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, TrendingUp, Plus } from "lucide-react"
import { useState } from "react"

interface Team {
  name: string
  logo: string
  odds: string
}

interface Game {
  id: string
  homeTeam: Team
  awayTeam: Team
  gameTime: string
  spread: string
  total: string
  isLive?: boolean
}

interface GameCardProps {
  game: Game
  onPlaceBet: (gameId: string, betType: string, team?: string) => void
}

export function GameCard({ game, onPlaceBet }: GameCardProps) {
  const [showAllBets, setShowAllBets] = useState(false)
  
  const popularBets = [
    { label: "Moneyline", type: "moneyline" },
    { label: "Spread", type: "spread" },
    { label: "Total", type: "total" }
  ]

  const additionalBets = [
    { label: "First TD", type: "first_td" },
    { label: "Player Props", type: "props" },
    { label: "Team Total", type: "team_total" }
  ]

  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-card to-card/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{game.gameTime}</span>
            {game.isLive && <Badge variant="destructive" className="animate-pulse">LIVE</Badge>}
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowAllBets(!showAllBets)}
            className="text-primary hover:text-primary-foreground"
          >
            <Plus className={`w-4 h-4 transition-transform ${showAllBets ? 'rotate-45' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Teams */}
        <div className="space-y-3">
          {/* Away Team */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full flex items-center justify-center text-xs font-bold">
                {game.awayTeam.name.slice(0, 2)}
              </div>
              <span className="font-medium">{game.awayTeam.name}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-success">{game.awayTeam.odds}</div>
            </div>
          </div>

          {/* Home Team */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full flex items-center justify-center text-xs font-bold">
                {game.homeTeam.name.slice(0, 2)}
              </div>
              <span className="font-medium">{game.homeTeam.name}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-success">{game.homeTeam.odds}</div>
            </div>
          </div>
        </div>

        {/* Popular Bets */}
        <div className="grid grid-cols-3 gap-2">
          {popularBets.map((bet) => (
            <Button
              key={bet.type}
              variant="outline"
              size="sm"
              onClick={() => onPlaceBet(game.id, bet.type)}
              className="flex items-center space-x-1 hover:bg-primary/10 hover:border-primary/50"
            >
              <TrendingUp className="w-3 h-3" />
              <span className="text-xs">{bet.label}</span>
            </Button>
          ))}
        </div>

        {/* Additional Bets (Expandable) */}
        {showAllBets && (
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="grid grid-cols-2 gap-2">
              {additionalBets.map((bet) => (
                <Button
                  key={bet.type}
                  variant="ghost"
                  size="sm"
                  onClick={() => onPlaceBet(game.id, bet.type)}
                  className="text-xs hover:bg-primary/10"
                >
                  {bet.label}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPlaceBet(game.id, "parlay")}
              className="w-full bg-gradient-to-r from-primary/10 to-success/10 hover:from-primary/20 hover:to-success/20 border-primary/30"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add to Parlay
            </Button>
          </div>
        )}

        {/* Game Info */}
        <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t border-border">
          <span>Spread: {game.spread}</span>
          <span>O/U: {game.total}</span>
        </div>
      </CardContent>
    </Card>
  )
}