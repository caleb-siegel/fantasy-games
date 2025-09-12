import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ShoppingCart, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

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

interface CompactBetslipProps {
  bets: BetslipBet[];
  onRemoveBet: (index: number) => void;
  onContinueToReview: () => void;
  remainingBalance: number;
  week: number;
}

export const CompactBetslip: React.FC<CompactBetslipProps> = ({
  bets,
  onRemoveBet,
  onContinueToReview,
  remainingBalance,
  week
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Calculate max height based on screen size - 30% of viewport height
  const maxHeight = typeof window !== 'undefined' ? `${window.innerHeight * 0.3}px` : '192px';
  
  // Different scroll triggers for mobile vs desktop
  const mobileScrollTrigger = 3;
  const desktopScrollTrigger = 5;
  
  const formatOdds = (americanOdds: number) => {
    return americanOdds > 0 ? `+${americanOdds}` : americanOdds.toString();
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
  const emptyState = bets.length === 0;

  return (
    <div className="bg-gray-900 border-t border-gray-800 shadow-lg">
      <div className="container mx-auto px-4 py-3">
        {/* Mobile Layout */}
        <div className="block md:hidden space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-white" />
              <span className="text-white font-semibold">Betslip ({bets.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-600 text-white">
                ${remainingBalance.toFixed(2)} remaining
              </Badge>
              {!emptyState && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="text-gray-400 hover:text-white p-1"
                >
                  {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>

          {/* Compact Bets List */}
          {emptyState ? (
            <div className="text-center text-gray-400 py-4">
              <p className="text-sm">No bets selected - Click on odds to add bets</p>
            </div>
          ) : !isCollapsed ? (
            <div className={`space-y-2 ${bets.length > mobileScrollTrigger ? 'overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800' : ''}`} style={{ maxHeight: bets.length > mobileScrollTrigger ? maxHeight : 'none' }}>
              {bets.slice().reverse().map((bet, index) => (
                <Card key={bets.length - 1 - index} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white text-sm truncate">
                          {bet.gameInfo.away_team} @ {bet.gameInfo.home_team}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {getOutcomeDisplayName(bet)} • {formatOdds(bet.bettingOption.american_odds)}
                        </div>
                        <div className="text-xs text-gray-500">
                          ${bet.amount} • {bet.bettingOption.bookmaker}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveBet(bets.length - 1 - index)}
                        className="text-gray-400 hover:text-white p-1 h-6 w-6 flex-shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}

          {/* Continue Button */}
          {!emptyState && (
            <Button
              onClick={onContinueToReview}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold h-12"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Continue to Review ({bets.length} bet{bets.length !== 1 ? 's' : ''})
            </Button>
          )}
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-white" />
                <span className="text-white font-semibold">Betslip ({bets.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-600 text-white">
                  ${remainingBalance.toFixed(2)} remaining
                </Badge>
                {!emptyState && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="text-gray-400 hover:text-white p-1"
                  >
                    {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>

            {/* Bets List - Vertical with scroll limit */}
            {emptyState ? (
              <div className="text-center text-gray-400 py-4">
                <p className="text-sm">No bets selected - Click on odds to add bets</p>
              </div>
            ) : !isCollapsed ? (
              <div className={`space-y-2 ${bets.length > desktopScrollTrigger ? 'overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800' : ''}`} style={{ maxHeight: bets.length > desktopScrollTrigger ? maxHeight : 'none' }}>
                {bets.slice().reverse().map((bet, index) => (
                  <Card key={bets.length - 1 - index} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white text-sm truncate">
                            {bet.gameInfo.away_team} @ {bet.gameInfo.home_team}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {getOutcomeDisplayName(bet)} • {formatOdds(bet.bettingOption.american_odds)}
                          </div>
                          <div className="text-xs text-gray-500">
                            ${bet.amount} • {bet.bettingOption.bookmaker}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveBet(bets.length - 1 - index)}
                          className="text-gray-400 hover:text-white p-1 h-6 w-6 flex-shrink-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : null}

            {/* Continue Button */}
            {!emptyState && (
              <Button
                onClick={onContinueToReview}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Continue ({bets.length})
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
