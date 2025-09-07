import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { X, DollarSign, TrendingUp } from "lucide-react"
import { useState } from "react"

interface Bet {
  id: string
  game: string
  selection: string
  odds: string
  amount: number
  type: "single" | "parlay"
}

interface BettingSlipProps {
  bets: Bet[]
  balance: number
  onRemoveBet: (betId: string) => void
  onUpdateAmount: (betId: string, amount: number) => void
  onPlaceBets: () => void
  onClearAll: () => void
}

export function BettingSlip({ 
  bets, 
  balance, 
  onRemoveBet, 
  onUpdateAmount, 
  onPlaceBets, 
  onClearAll 
}: BettingSlipProps) {
  const [parlayAmount, setParlayAmount] = useState(0)
  
  const totalStaked = bets.reduce((sum, bet) => sum + bet.amount, 0) + parlayAmount
  const potentialReturn = bets.reduce((sum, bet) => {
    const odds = parseFloat(bet.odds.replace('+', ''))
    const multiplier = odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1
    return sum + (bet.amount * multiplier)
  }, 0)

  const parlayBets = bets.filter(bet => bet.type === "parlay")
  const singleBets = bets.filter(bet => bet.type === "single")

  if (bets.length === 0) {
    return (
      <Card className="sticky top-24">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <span>Betting Slip</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Select bets to get started</p>
            <p className="text-sm mt-2">Your weekly balance: <span className="text-success font-semibold">${balance}</span></p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <span>Betting Slip</span>
            <Badge variant="secondary">{bets.length}</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClearAll}>
            Clear All
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Balance Display */}
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Weekly Balance</span>
            <span className="text-lg font-bold text-success">${balance}</span>
          </div>
          <div className="flex justify-between items-center mt-1 text-sm text-muted-foreground">
            <span>Available</span>
            <span>${(balance - totalStaked).toFixed(2)}</span>
          </div>
        </div>

        {/* Single Bets */}
        {singleBets.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Single Bets</h4>
            {singleBets.map((bet) => (
              <div key={bet.id} className="p-3 rounded-lg border border-border bg-card/50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{bet.selection}</p>
                    <p className="text-xs text-muted-foreground">{bet.game}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveBet(bet.id)}
                    className="ml-2 h-6 w-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-success">{bet.odds}</Badge>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs">$</span>
                    <Input
                      type="number"
                      placeholder="0"
                      value={bet.amount || ''}
                      onChange={(e) => onUpdateAmount(bet.id, parseFloat(e.target.value) || 0)}
                      className="w-16 h-8 text-xs"
                      max={balance}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Parlay Bets */}
        {parlayBets.length > 0 && (
          <div className="space-y-3">
            <Separator />
            <h4 className="font-medium text-sm">Parlay ({parlayBets.length} legs)</h4>
            <div className="p-3 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/5 to-success/5">
              {parlayBets.map((bet) => (
                <div key={bet.id} className="flex items-center justify-between py-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{bet.selection}</p>
                    <p className="text-xs text-muted-foreground">{bet.game}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-success text-xs">{bet.odds}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveBet(bet.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Parlay Amount</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs">$</span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={parlayAmount || ''}
                    onChange={(e) => setParlayAmount(parseFloat(e.target.value) || 0)}
                    className="w-16 h-8 text-xs"
                    max={balance}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Summary */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Total Staked</span>
            <span className="font-semibold">${totalStaked.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Potential Return</span>
            <span className="font-semibold text-success">${potentialReturn.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-primary">
            <span>Potential Profit</span>
            <span className="font-bold">${(potentialReturn - totalStaked).toFixed(2)}</span>
          </div>
        </div>

        {/* Place Bet Button */}
        <Button 
          onClick={onPlaceBets}
          disabled={totalStaked === 0 || totalStaked > balance}
          className="w-full bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90"
        >
          Place Bets (${totalStaked.toFixed(2)})
        </Button>

        {totalStaked > balance && (
          <p className="text-xs text-danger text-center">
            Insufficient balance for these bets
          </p>
        )}
      </CardContent>
    </Card>
  )
}