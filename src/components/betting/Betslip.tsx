import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BettingOption {
  id: number;
  game_id: string;
  market_type: string;
  outcome_name: string;
  outcome_point: number | null;
  bookmaker: string;
  american_odds: number;
  decimal_odds: number;
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
}

export const Betslip: React.FC<BetslipProps> = ({
  bets,
  onRemoveBet,
  onUpdateAmount,
  onPlaceBets,
  remainingBalance,
  placingBets,
  error
}) => {
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

  const emptyState = bets.length === 0;

  return (
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

          {/* Bets List - Vertical on mobile */}
          {emptyState ? (
            <div className="text-center text-gray-400 py-4">
              <p className="text-sm">No bets selected - Click on odds to add bets</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bets.map((bet, index) => (
                <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white text-sm truncate">
                        {bet.gameInfo.away_team} @ {bet.gameInfo.home_team}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {getOutcomeDisplayName(bet)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {bet.bettingOption.bookmaker} • {formatOdds(bet.bettingOption.american_odds)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveBet(index)}
                      className="text-gray-400 hover:text-white p-1 h-6 w-6 flex-shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <Input
                      type="number"
                      value={bet.amount === 0 ? '' : bet.amount}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || value === '0') {
                          onUpdateAmount(index, 0);
                        } else {
                          const numValue = parseFloat(value);
                          if (!isNaN(numValue)) {
                            onUpdateAmount(index, numValue);
                          }
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      min="1"
                      max={remainingBalance + bet.amount}
                      step="0.01"
                      className="h-8 text-sm flex-1"
                      placeholder="0.00"
                    />
                    <div className="text-sm text-gray-400 flex-shrink-0">
                      ${(bet.amount * bet.bettingOption.decimal_odds).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary and Place Bets - Stacked on mobile */}
          {!emptyState && (
            <div className="space-y-3">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Total:</span>
                  <span className="text-white font-semibold">${totalBetAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Payout:</span>
                  <span className="text-green-400 font-semibold">${totalPotentialPayout.toFixed(2)}</span>
                </div>
              </div>
              
              <Button
                onClick={onPlaceBets}
                disabled={placingBets || totalBetAmount <= 0 || totalBetAmount > remainingBalance}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold h-12"
              >
                {placingBets ? (
                  <>
                    <TrendingUp className="h-4 w-4 animate-spin mr-2" />
                    Placing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Place {bets.length} Bet{bets.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
              
            </div>
          )}
        </div>

        {/* Desktop Layout - Horizontal */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between">
            {/* Left side - Betslip info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-white" />
                <span className="text-white font-semibold">Betslip ({bets.length})</span>
              </div>
              <Badge variant="secondary" className="bg-green-600 text-white">
                ${remainingBalance.toFixed(2)} remaining
              </Badge>
            </div>

            {/* Middle - Bets list (horizontal scroll) */}
            <div className="flex-1 mx-4">
              {emptyState ? (
                <div className="text-center text-gray-400">
                  <p className="text-sm">No bets selected - Click on odds to add bets</p>
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pb-2">
                  {bets.map((bet, index) => (
                    <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-3 min-w-64 flex-shrink-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white text-sm truncate">
                            {bet.gameInfo.away_team} @ {bet.gameInfo.home_team}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {getOutcomeDisplayName(bet)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {bet.bettingOption.bookmaker} • {formatOdds(bet.bettingOption.american_odds)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveBet(index)}
                          className="text-gray-400 hover:text-white p-1 h-6 w-6 flex-shrink-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <Input
                          type="number"
                          value={bet.amount === 0 ? '' : bet.amount}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || value === '0') {
                              onUpdateAmount(index, 0);
                            } else {
                              const numValue = parseFloat(value);
                              if (!isNaN(numValue)) {
                                onUpdateAmount(index, numValue);
                              }
                            }
                          }}
                          onFocus={(e) => e.target.select()}
                          min="1"
                          max={remainingBalance + bet.amount}
                          step="0.01"
                          className="h-8 text-sm flex-1"
                          placeholder="0.00"
                        />
                        <div className="text-sm text-gray-400 flex-shrink-0">
                          ${(bet.amount * bet.bettingOption.decimal_odds).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right side - Summary and Place Bets */}
            <div className="flex items-center gap-4">
              {!emptyState && (
                <div className="text-right">
                  <div className="text-sm text-gray-400">Total: <span className="text-white font-semibold">${totalBetAmount.toFixed(2)}</span></div>
                  <div className="text-sm text-gray-400">Payout: <span className="text-green-400 font-semibold">${totalPotentialPayout.toFixed(2)}</span></div>
                </div>
              )}
              
              <Button
                onClick={onPlaceBets}
                disabled={placingBets || totalBetAmount <= 0 || totalBetAmount > remainingBalance}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6"
              >
                {placingBets ? (
                  <>
                    <TrendingUp className="h-4 w-4 animate-spin mr-2" />
                    Placing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Place {bets.length} Bet{bets.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
              
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-2">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
};