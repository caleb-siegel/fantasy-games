import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, ShoppingCart, DollarSign, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

interface BettingOption {
  id: number;
  game_id: string;
  market_type: string;
  outcome_name: string;
  outcome_point: number | null;
  bookmaker: string;
  american_odds: number;
  decimal_odds: number;
  is_locked?: boolean;
  locked_at?: string;
}

interface BetslipBet {
  bettingOption: BettingOption;
  amount: number;
  gameInfo: {
    home_team: string;
    away_team: string;
    start_time: string;
  };
}

interface BetslipProps {
  bets: BetslipBet[];
  onRemoveBet: (index: number) => void;
  onUpdateAmount: (index: number, amount: number) => void;
  onPlaceBets: () => void;
  remainingBalance: number;
  placingBets: boolean;
  error: string | null;
  week: number;
}

export const Betslip: React.FC<BetslipProps> = ({
  bets,
  onRemoveBet,
  onUpdateAmount,
  onPlaceBets,
  remainingBalance,
  placingBets,
  error,
  week
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const formatOdds = (americanOdds: number) => {
    return americanOdds > 0 ? `+${americanOdds}` : americanOdds.toString();
  };

  const getMarketDisplayName = (marketType: string) => {
    switch (marketType) {
      case 'h2h': return 'Moneyline';
      case 'spreads': return 'Spread';
      case 'totals': return 'Total';
      default: return marketType;
    }
  };

  const getOutcomeDisplayName = (bet: BetslipBet) => {
    const { bettingOption } = bet;
    if (bettingOption.market_type === 'totals') {
      return `${bettingOption.outcome_name} ${bettingOption.outcome_point}`;
    } else if (bettingOption.market_type === 'spreads') {
      return `${bettingOption.outcome_name} ${bettingOption.outcome_point > 0 ? '+' : ''}${bettingOption.outcome_point}`;
    }
    return bettingOption.outcome_name;
  };

  const totalBetAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);
  const totalPotentialPayout = bets.reduce((sum, bet) => sum + (bet.amount * bet.bettingOption.decimal_odds), 0);
  const totalProfit = totalPotentialPayout - totalBetAmount;
  const budgetUsed = totalBetAmount;
  const budgetPercentage = (budgetUsed / 100) * 100;

  const emptyState = bets.length === 0;
  const hasLockedBets = bets.some(bet => bet.bettingOption.is_locked);

  const handlePlaceBets = () => {
    if (hasLockedBets) {
      return; // Don't allow placing bets with locked options
    }
    setShowConfirmation(true);
  };

  const confirmPlaceBets = () => {
    setShowConfirmation(false);
    onPlaceBets();
  };

  const formatGameTime = (startTime: string) => {
    const date = new Date(startTime);
    const now = new Date();
    const timeDiff = date.getTime() - now.getTime();
    
    if (timeDiff <= 0) {
      return 'Started';
    }
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  return (
    <>
      <div className="bg-gray-900 border-t border-gray-800 shadow-lg">
        <div className="container mx-auto px-4 py-3">
          {/* Mobile Layout - Stacked */}
          <div className="block md:hidden space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-white" />
                <span className="text-white font-semibold">Betslip ({bets.length})</span>
              </div>
              <Badge variant="secondary" className="bg-green-600 text-white">
                ${remainingBalance.toFixed(2)} remaining
              </Badge>
            </div>

            {/* Budget Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-300">
                <span>Week {week} Budget</span>
                <span>${budgetUsed.toFixed(2)} / $100</span>
              </div>
              <Progress value={budgetPercentage} className="h-2" />
            </div>

            {/* Bets List - Vertical on mobile */}
            {emptyState ? (
              <div className="text-center text-gray-400 py-4">
                <p className="text-sm">No bets selected - Click on odds to add bets</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bets.map((bet, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-white font-semibold text-sm">
                          {bet.gameInfo.home_team} vs {bet.gameInfo.away_team}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {getOutcomeDisplayName(bet)} • {getMarketDisplayName(bet.bettingOption.market_type)}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {bet.bettingOption.bookmaker} • {formatOdds(bet.bettingOption.american_odds)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveBet(index)}
                        className="text-gray-400 hover:text-white p-1"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">$</span>
                        <Input
                          type="number"
                          value={bet.amount}
                          onChange={(e) => onUpdateAmount(index, parseFloat(e.target.value) || 0)}
                          className="w-20 h-8 text-sm bg-gray-700 border-gray-600 text-white"
                          min="0"
                          max={remainingBalance + bet.amount}
                          step="0.01"
                        />
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold text-sm">
                          ${(bet.amount * bet.bettingOption.decimal_odds).toFixed(2)}
                        </div>
                        <div className="text-gray-400 text-xs">
                          +${((bet.amount * bet.bettingOption.decimal_odds) - bet.amount).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    {bet.bettingOption.is_locked && (
                      <div className="mt-2 flex items-center gap-1 text-yellow-400 text-xs">
                        <Clock className="h-3 w-3" />
                        <span>Locked</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            {!emptyState && (
              <div className="bg-gray-800 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Stake:</span>
                  <span className="text-white font-semibold">${totalBetAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Potential Payout:</span>
                  <span className="text-white font-semibold">${totalPotentialPayout.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Potential Profit:</span>
                  <span className={`font-semibold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${totalProfit.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Remaining Budget:</span>
                  <span className="text-white font-semibold">${remainingBalance.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <Alert className="bg-red-900/20 border-red-800">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-200">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Place Bets Button */}
            {!emptyState && (
              <Button
                onClick={handlePlaceBets}
                disabled={placingBets || hasLockedBets || totalBetAmount === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
              >
                {placingBets ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Placing Bets...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Place {bets.length} Bet{bets.length !== 1 ? 's' : ''} (${totalBetAmount.toFixed(2)})
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Desktop Layout - Sidebar */}
          <div className="hidden md:block">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-white" />
                <span className="text-white font-semibold">Betslip ({bets.length})</span>
              </div>
              <Badge variant="secondary" className="bg-green-600 text-white">
                ${remainingBalance.toFixed(2)} remaining
              </Badge>
            </div>

            {/* Budget Progress Bar */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm text-gray-300">
                <span>Week {week} Budget</span>
                <span>${budgetUsed.toFixed(2)} / $100</span>
              </div>
              <Progress value={budgetPercentage} className="h-2" />
            </div>

            {/* Bets List */}
            {emptyState ? (
              <div className="text-center text-gray-400 py-8">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No bets selected</p>
                <p className="text-xs text-gray-500">Click on odds to add bets</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {bets.map((bet, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-white font-semibold text-sm">
                          {bet.gameInfo.home_team} vs {bet.gameInfo.away_team}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {getOutcomeDisplayName(bet)} • {getMarketDisplayName(bet.bettingOption.market_type)}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {bet.bettingOption.bookmaker} • {formatOdds(bet.bettingOption.american_odds)}
                        </div>
                        <div className="text-gray-500 text-xs mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {formatGameTime(bet.gameInfo.start_time)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveBet(index)}
                        className="text-gray-400 hover:text-white p-1"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">$</span>
                        <Input
                          type="number"
                          value={bet.amount}
                          onChange={(e) => onUpdateAmount(index, parseFloat(e.target.value) || 0)}
                          className="w-20 h-8 text-sm bg-gray-700 border-gray-600 text-white"
                          min="0"
                          max={remainingBalance + bet.amount}
                          step="0.01"
                        />
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold text-sm">
                          ${(bet.amount * bet.bettingOption.decimal_odds).toFixed(2)}
                        </div>
                        <div className="text-gray-400 text-xs">
                          +${((bet.amount * bet.bettingOption.decimal_odds) - bet.amount).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    {bet.bettingOption.is_locked && (
                      <div className="mt-2 flex items-center gap-1 text-yellow-400 text-xs">
                        <Clock className="h-3 w-3" />
                        <span>Locked</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            {!emptyState && (
              <div className="bg-gray-800 rounded-lg p-4 mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Stake:</span>
                  <span className="text-white font-semibold">${totalBetAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Potential Payout:</span>
                  <span className="text-white font-semibold">${totalPotentialPayout.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Potential Profit:</span>
                  <span className={`font-semibold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${totalProfit.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Remaining Budget:</span>
                  <span className="text-white font-semibold">${remainingBalance.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <Alert className="bg-red-900/20 border-red-800 mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-200">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Place Bets Button */}
            {!emptyState && (
              <Button
                onClick={handlePlaceBets}
                disabled={placingBets || hasLockedBets || totalBetAmount === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 mt-4"
              >
                {placingBets ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Placing Bets...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Place {bets.length} Bet{bets.length !== 1 ? 's' : ''} (${totalBetAmount.toFixed(2)})
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Your Bets</DialogTitle>
            <DialogDescription>
              Please review your bets before placing them. Once placed, bets cannot be cancelled.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Bet Summary:</h4>
              {bets.map((bet, index) => (
                <div key={index} className="text-sm bg-gray-100 p-2 rounded">
                  <div className="font-medium">
                    {bet.gameInfo.home_team} vs {bet.gameInfo.away_team}
                  </div>
                  <div className="text-gray-600">
                    {getOutcomeDisplayName(bet)} • ${bet.amount} • {formatOdds(bet.bettingOption.american_odds)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Total Stake:</span>
                <span className="font-semibold">${totalBetAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Potential Payout:</span>
                <span className="font-semibold">${totalPotentialPayout.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Potential Profit:</span>
                <span className={`font-semibold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${totalProfit.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Remaining Budget:</span>
                <span className="font-semibold">${remainingBalance.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>
              Cancel
            </Button>
            <Button onClick={confirmPlaceBets} className="bg-green-600 hover:bg-green-700">
              <DollarSign className="h-4 w-4 mr-2" />
              Place Bets
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
