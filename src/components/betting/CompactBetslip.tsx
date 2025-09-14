import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ShoppingCart, ArrowRight, ChevronDown, ChevronUp, Calculator, Plus, Clock } from 'lucide-react';
import { BettingOption as ParlayBettingOption, calculateParlayFromOptions, formatAmericanOdds, getOutcomeDisplayName, getMarketDisplayName } from '@/utils/parlayUtils';
import { getCompactGameDateTime } from '@/utils/dateUtils';

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

interface ParlayBet {
  id: string;
  legs: ParlayBettingOption[];
  stake: number;
  gameInfo: {
    home_team: string;
    away_team: string;
    start_time: string;
  };
}

type UnifiedBet = BetslipBet | ParlayBet;

interface CompactBetslipProps {
  bets: BetslipBet[];
  parlayBets: ParlayBettingOption[];
  onRemoveBet: (index: number) => void;
  onRemoveParlayLeg: (bettingOptionId: number) => void;
  onPlaceParlay: (stake: number) => void;
  onContinueToReview: () => void;
  remainingBalance: number;
  week: number;
  placingParlay: boolean;
}

export const CompactBetslip: React.FC<CompactBetslipProps> = ({
  bets,
  parlayBets,
  onRemoveBet,
  onRemoveParlayLeg,
  onPlaceParlay,
  onContinueToReview,
  remainingBalance,
  week,
  placingParlay
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [parlayStake, setParlayStake] = useState<number>(10);
  const [showParlayDetails, setShowParlayDetails] = useState(false);
  
  // Calculate max height based on screen size - 30% of viewport height
  const maxHeight = typeof window !== 'undefined' ? `${window.innerHeight * 0.3}px` : '192px';
  
  // Dynamic scroll triggers based on content height
  const mobileScrollTrigger = 3; // Keep fixed for mobile due to limited space
  const desktopMaxHeight = typeof window !== 'undefined' ? `${window.innerHeight * 0.7}px` : '600px'; // 70% of viewport height for desktop
  
  const totalBets = bets.length + (parlayBets.length > 0 ? 1 : 0);
  const shouldScrollMobile = totalBets >= mobileScrollTrigger;
  
  // For desktop, we'll use CSS to handle dynamic scrolling based on content height
  const emptyState = bets.length === 0 && parlayBets.length === 0;
  
  const parlayCalculation = parlayBets.length >= 2 ? calculateParlayFromOptions(parlayStake, parlayBets) : null;
  
  const handleParlayStakeChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    if (numValue >= 0 && numValue <= remainingBalance) {
      setParlayStake(numValue);
    }
  };
  
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

  const getParlayLegDisplayName = (leg: ParlayBettingOption) => {
    if (leg.market_type === 'totals') {
      return `${leg.outcome_name} ${leg.outcome_point}`;
    } else if (leg.market_type === 'spreads') {
      return `${leg.outcome_name} ${leg.outcome_point && leg.outcome_point > 0 ? '+' : ''}${leg.outcome_point}`;
    }
    return leg.outcome_name;
  };

  const totalBetAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);
  const parlayTotalAmount = parlayCalculation ? parlayCalculation.stake : 0;
  const grandTotal = totalBetAmount + parlayTotalAmount;

  return (
    <div className="bg-gray-900 border-t border-gray-800 shadow-lg">
      <div className="container mx-auto px-4 py-3">
        {/* Mobile Layout */}
        <div className="block md:hidden space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-white" />
              <span className="text-white font-semibold">Betslip ({totalBets})</span>
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
            <div className={`space-y-2 ${shouldScrollMobile ? 'overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800' : ''}`} style={{ maxHeight: shouldScrollMobile ? maxHeight : 'none' }}>
              {/* Parlay Bet - Always at the top */}
              {parlayBets.length > 0 && (
                <Card className="bg-blue-900 border-blue-700">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calculator className="h-4 w-4 text-blue-300" />
                          <span className="text-blue-200 font-medium text-sm">
                            Parlay ({parlayBets.length} legs)
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowParlayDetails(!showParlayDetails)}
                            className="text-blue-300 hover:text-blue-100 p-1"
                          >
                            {showParlayDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => parlayBets.forEach(leg => onRemoveParlayLeg(leg.id))}
                            className="text-blue-300 hover:text-blue-100 p-1 h-6 w-6 flex-shrink-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {parlayCalculation && (
                        <div className="text-xs text-blue-300">
                          Stake: ${parlayStake.toFixed(2)} • Odds: {parlayCalculation.decimal_odds.toFixed(2)} • 
                          Return: ${parlayCalculation.return.toFixed(2)}
                        </div>
                      )}
                      
                      {showParlayDetails && (
                        <div className="space-y-1 pt-2 border-t border-blue-700">
                          {parlayBets.map((leg, index) => (
                            <div key={leg.id} className="flex items-center justify-between text-xs">
                              <div className="text-blue-200">
                                Leg {index + 1}: {getParlayLegDisplayName(leg)} • {formatAmericanOdds(leg.american_odds)}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRemoveParlayLeg(leg.id)}
                                className="text-blue-300 hover:text-blue-100 p-1 h-4 w-4"
                              >
                                <X className="h-2 w-2" />
                              </Button>
                            </div>
                          ))}
                          
                          {parlayBets.length >= 2 && (
                            <div className="pt-2 border-t border-blue-700">
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={parlayStake}
                                  onChange={(e) => handleParlayStakeChange(e.target.value)}
                                  min="1"
                                  max={remainingBalance}
                                  step="0.01"
                                  className="flex-1 bg-blue-800 border border-blue-600 rounded px-2 py-1 text-blue-100 text-xs"
                                  placeholder="Stake"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => onPlaceParlay(parlayStake)}
                                  disabled={placingParlay || parlayStake <= 0 || parlayStake > remainingBalance}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1"
                                >
                                  {placingParlay ? 'Placing...' : 'Place'}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Single Bets */}
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
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getCompactGameDateTime(bet.gameInfo.start_time)}
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
              Continue to Review ({bets.length + (parlayBets.length >= 2 ? 1 : 0)} bet{(bets.length + (parlayBets.length >= 2 ? 1 : 0)) !== 1 ? 's' : ''})
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
                <span className="text-white font-semibold">Betslip ({totalBets})</span>
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
              <div className="space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800" style={{ maxHeight: desktopMaxHeight }}>
                {/* Desktop Parlay Bet - Always at the top */}
                {parlayBets.length > 0 && (
                  <Card className="bg-blue-900 border-blue-700">
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calculator className="h-4 w-4 text-blue-300" />
                            <span className="text-blue-200 font-medium text-sm">
                              Parlay ({parlayBets.length} legs)
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowParlayDetails(!showParlayDetails)}
                              className="text-blue-300 hover:text-blue-100 p-1"
                            >
                              {showParlayDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => parlayBets.forEach(leg => onRemoveParlayLeg(leg.id))}
                              className="text-blue-300 hover:text-blue-100 p-1 h-6 w-6 flex-shrink-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {parlayCalculation && (
                          <div className="text-xs text-blue-300">
                            Stake: ${parlayStake.toFixed(2)} • Odds: {parlayCalculation.decimal_odds.toFixed(2)} • 
                            Return: ${parlayCalculation.return.toFixed(2)}
                          </div>
                        )}
                        
                        {showParlayDetails && (
                          <div className="space-y-1 pt-2 border-t border-blue-700">
                            {parlayBets.map((leg, index) => (
                              <div key={leg.id} className="flex items-center justify-between text-xs">
                                <div className="text-blue-200">
                                  Leg {index + 1}: {getParlayLegDisplayName(leg)} • {formatAmericanOdds(leg.american_odds)}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onRemoveParlayLeg(leg.id)}
                                  className="text-blue-300 hover:text-blue-100 p-1 h-4 w-4"
                                >
                                  <X className="h-2 w-2" />
                                </Button>
                              </div>
                            ))}
                            
                            {parlayBets.length >= 2 && (
                              <div className="pt-2 border-t border-blue-700">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={parlayStake}
                                    onChange={(e) => handleParlayStakeChange(e.target.value)}
                                    min="1"
                                    max={remainingBalance}
                                    step="0.01"
                                    className="flex-1 bg-blue-800 border border-blue-600 rounded px-2 py-1 text-blue-100 text-xs"
                                    placeholder="Stake"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => onPlaceParlay(parlayStake)}
                                    disabled={placingParlay || parlayStake <= 0 || parlayStake > remainingBalance}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1"
                                  >
                                    {placingParlay ? 'Placing...' : 'Place'}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Desktop Single Bets */}
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
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {getCompactGameDateTime(bet.gameInfo.start_time)}
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
                Continue ({bets.length + (parlayBets.length >= 2 ? 1 : 0)})
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
