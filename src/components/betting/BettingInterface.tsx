import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, DollarSign, TrendingUp, Clock, ChevronDown, ChevronUp, X } from 'lucide-react';
import { apiService } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { Betslip } from './Betslip';

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

interface Game {
  id: string;
  home_team: string;
  away_team: string;
  start_time: string;
  week: number;
}

interface GameWithOptions {
  game: Game;
  betting_options: {
    [marketType: string]: {
      [outcomeKey: string]: {
        outcome_name: string;
        outcome_point: number | null;
        bookmakers: Array<{
          bookmaker: string;
          american_odds: number;
          decimal_odds: number;
        }>;
      };
    };
  };
}

interface UserBet {
  id: number;
  amount: number;
  potential_payout: number;
  status: string;
  betting_option: BettingOption;
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

interface BettingInterfaceProps {
  matchupId: number;
  week: number;
}

export const BettingInterface: React.FC<BettingInterfaceProps> = ({ matchupId, week }) => {
  const { user } = useAuth();
  const [games, setGames] = useState<GameWithOptions[]>([]);
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [betslipBets, setBetslipBets] = useState<BetslipBet[]>([]);
  const [expandedGames, setExpandedGames] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBettingOption, setSelectedBettingOption] = useState<BettingOption | null>(null);
  const [betAmount, setBetAmount] = useState<string>('');
  const [placingBet, setPlacingBet] = useState(false);
  const [placingBets, setPlacingBets] = useState(false);
  const [popupBookmakers, setPopupBookmakers] = useState<{
    outcomeKey: string;
    bookmakers: any[];
    outcomeName: string;
  } | null>(null);

  const totalBetAmount = userBets.reduce((sum, bet) => sum + bet.amount, 0);
  const betslipTotalAmount = betslipBets.reduce((sum, bet) => sum + bet.amount, 0);
  const remainingBalance = 100 - totalBetAmount; // Only subtract already placed bets

  useEffect(() => {
    loadBettingData();
  }, [week]);

  const loadBettingData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load betting options for the week
      const optionsResponse = await apiService.getWeeklyBettingOptions(week);
      setGames(optionsResponse.games);

      // Load user's existing bets
      const betsResponse = await apiService.getUserBets(week);
      setUserBets(betsResponse.bets);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load betting data');
    } finally {
      setLoading(false);
    }
  };

  const addToBetslip = (bettingOption: BettingOption, gameInfo: { home_team: string; away_team: string; start_time: string }) => {
    // Check if bet already exists in betslip
    const existingBetIndex = betslipBets.findIndex(
      bet => bet.bettingOption.outcome_name === bettingOption.outcome_name &&
             bet.bettingOption.game_id === bettingOption.game_id &&
             bet.bettingOption.market_type === bettingOption.market_type
    );

    if (existingBetIndex >= 0) {
      // Check if the new odds are better than existing ones
      const existingBet = betslipBets[existingBetIndex];
      const isBetterOdds = (newOdds: number, existingOdds: number) => {
        // Convert to decimal odds for proper comparison
        const newDecimal = newOdds > 0 ? (newOdds / 100) + 1 : (100 / Math.abs(newOdds)) + 1;
        const existingDecimal = existingOdds > 0 ? (existingOdds / 100) + 1 : (100 / Math.abs(existingOdds)) + 1;
        
        return newDecimal > existingDecimal;
      };

      if (isBetterOdds(bettingOption.american_odds, existingBet.bettingOption.american_odds)) {
        // Replace with better odds
        const updatedBets = [...betslipBets];
        updatedBets[existingBetIndex] = {
          ...existingBet,
          bettingOption,
          amount: Math.min(existingBet.amount, remainingBalance)
        };
        setBetslipBets(updatedBets);
      } else {
        // Show warning that odds are worse
        setError(`Cannot add bet: ${bettingOption.bookmaker} odds (${formatOdds(bettingOption.american_odds)}) are worse than existing ${existingBet.bettingOption.bookmaker} odds (${formatOdds(existingBet.bettingOption.american_odds)})`);
        setTimeout(() => setError(null), 3000);
      }
    } else {
      // Add new bet to betslip
      const newBet: BetslipBet = {
        bettingOption,
        amount: Math.min(10, remainingBalance),
        gameInfo
      };
      setBetslipBets([...betslipBets, newBet]);
    }
  };

  const removeFromBetslip = (index: number) => {
    setBetslipBets(betslipBets.filter((_, i) => i !== index));
  };

  const updateBetslipAmount = (index: number, amount: number) => {
    if (amount < 0) return;
    
    const updatedBets = [...betslipBets];
    // Ensure amount is a valid number and not NaN
    const validAmount = isNaN(amount) ? 0 : amount;
    updatedBets[index].amount = Math.min(validAmount, remainingBalance + updatedBets[index].amount);
    setBetslipBets(updatedBets);
  };

  const toggleGameExpansion = (gameId: string) => {
    const newExpandedGames = new Set(expandedGames);
    if (newExpandedGames.has(gameId)) {
      newExpandedGames.delete(gameId);
    } else {
      newExpandedGames.add(gameId);
    }
    setExpandedGames(newExpandedGames);
  };

  const placeAllBets = async () => {
    if (betslipBets.length === 0) return;

    try {
      setPlacingBets(true);
      setError(null);

      // Prepare batch bet data
      const batchBets = betslipBets.map(betslipBet => ({
        matchup_id: matchupId,
        betting_option_id: betslipBet.bettingOption.id,
        amount: betslipBet.amount
      }));

      // Place all bets at once using batch API
      await apiService.placeBatchBets({ bets: batchBets });

      // Clear betslip and reload data
      setBetslipBets([]);
      await loadBettingData();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place bets');
    } finally {
      setPlacingBets(false);
    }
  };

  const handlePlaceBet = async () => {
    if (!selectedBettingOption || !betAmount) return;

    const amount = parseFloat(betAmount);
    if (amount <= 0 || amount > remainingBalance) {
      setError(`Bet amount must be between $1 and $${remainingBalance.toFixed(2)}`);
      return;
    }

    try {
      setPlacingBet(true);
      setError(null);

      await apiService.placeBet({
        matchupId,
        bettingOptionId: selectedBettingOption.id,
        amount
      });

      // Reload betting data
      await loadBettingData();
      
      // Reset form
      setSelectedBettingOption(null);
      setBetAmount('');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place bet');
    } finally {
      setPlacingBet(false);
    }
  };

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

  const getOutcomeDisplayName = (outcome: any, marketType: string) => {
    if (marketType === 'totals') {
      return `${outcome.outcome_name} ${outcome.outcome_point}`;
    } else if (marketType === 'spreads') {
      return `${outcome.outcome_name} ${outcome.outcome_point > 0 ? '+' : ''}${outcome.outcome_point}`;
    }
    return outcome.outcome_name;
  };

  const findBestOdds = (bookmakers: Array<{bookmaker: string, american_odds: number, decimal_odds: number}>) => {
    if (!bookmakers.length) return null;
    
    // Sort by best odds: positive odds (highest first), then negative odds (least negative first)
    const sorted = bookmakers.sort((a, b) => {
      if (a.american_odds > 0 && b.american_odds > 0) {
        return b.american_odds - a.american_odds; // Higher positive odds first
      } else if (a.american_odds < 0 && b.american_odds < 0) {
        return b.american_odds - a.american_odds; // Less negative odds first
      } else if (a.american_odds > 0 && b.american_odds < 0) {
        return -1; // Positive odds before negative odds
      } else if (a.american_odds < 0 && b.american_odds > 0) {
        return 1; // Negative odds after positive odds
      }
      return 0;
    });
    
    return sorted[0]; // Return the best odds
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading betting options...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32">
      {/* Main betting content */}
      <div className="space-y-6">
      {/* Balance Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Weekly Betting Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">${remainingBalance.toFixed(2)}</div>
              <div className="text-sm text-gray-400">Remaining</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">${totalBetAmount.toFixed(2)}</div>
              <div className="text-sm text-gray-400">Placed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">${betslipTotalAmount.toFixed(2)}</div>
              <div className="text-sm text-gray-400">Betslip</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">${userBets.reduce((sum, bet) => sum + bet.potential_payout, 0).toFixed(2)}</div>
              <div className="text-sm text-gray-400">Potential Payout</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Games and Betting Options */}
      <div className="space-y-6">
        {games.map((gameWithOptions) => (
          <Card key={gameWithOptions.game.id} className="bg-black shadow-lg border-gray-800">
            <CardHeader 
              className="bg-gray-900 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors"
              onClick={() => toggleGameExpansion(gameWithOptions.game.id)}
            >
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="font-bold text-white">
                  {gameWithOptions.game.away_team} @ {gameWithOptions.game.home_team}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
                    <Clock className="h-4 w-4" />
                    {new Date(gameWithOptions.game.start_time).toLocaleString()}
                  </div>
                  {expandedGames.has(gameWithOptions.game.id) ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            {expandedGames.has(gameWithOptions.game.id) && (
              <CardContent className="p-6">
              <Tabs defaultValue="h2h" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-900">
                  <TabsTrigger value="h2h" className="font-semibold text-white data-[state=active]:bg-green-600 data-[state=active]:text-white">Moneyline</TabsTrigger>
                  <TabsTrigger value="spreads" className="font-semibold text-white data-[state=active]:bg-green-600 data-[state=active]:text-white">Spread</TabsTrigger>
                  <TabsTrigger value="totals" className="font-semibold text-white data-[state=active]:bg-green-600 data-[state=active]:text-white">Total</TabsTrigger>
                </TabsList>

                {Object.entries(gameWithOptions.betting_options).map(([marketType, outcomes]) => (
                  <TabsContent key={marketType} value={marketType}>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-lg text-white">{getMarketDisplayName(marketType)}</h4>
                      
                      {/* Organized betting layout with left/right sections */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left section - Away team or Under */}
                        <div className="border border-gray-600 rounded-lg p-4 bg-gray-800/50">
                          <h5 className="font-semibold text-sm text-white text-center mb-3">
                            {marketType === 'totals' ? 'Under' : gameWithOptions.game.away_team}
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(outcomes)
                              .filter(([outcomeKey, outcome]) => {
                                if (marketType === 'totals') {
                                  return outcome.outcome_name.toLowerCase().includes('under');
                                } else if (marketType === 'spreads') {
                                  return outcome.outcome_name === gameWithOptions.game.away_team;
                                } else {
                                  return outcome.outcome_name === gameWithOptions.game.away_team;
                                }
                              })
                              .map(([outcomeKey, outcome]) => {
                                const bestOdds = findBestOdds(outcome.bookmakers);
                                
                                return (
                                  <div key={outcomeKey} className="border rounded-lg p-4 bg-gray-900 hover:shadow-md transition-all duration-200 border-gray-700 hover:border-green-500 hover:bg-gray-800">
                                    {/* Outcome name */}
                                    <div className="font-semibold text-sm mb-2 text-white text-center">
                                      {getOutcomeDisplayName(outcome, marketType)}
                                    </div>
                                    
                                    {/* Best odds - compact display */}
                                    {bestOdds && (
                                      <div className="mb-2">
                                        <div
                                          className="p-2 border rounded-lg cursor-pointer transition-all duration-200 border-gray-600 hover:border-green-500 hover:bg-gray-800 hover:shadow-sm"
                                          onClick={() => addToBetslip({
                                            id: bestOdds.id,
                                            game_id: gameWithOptions.game.id,
                                            market_type: marketType,
                                            outcome_name: outcome.outcome_name,
                                            outcome_point: outcome.outcome_point,
                                            bookmaker: bestOdds.bookmaker,
                                            american_odds: bestOdds.american_odds,
                                            decimal_odds: bestOdds.decimal_odds
                                          }, {
                                            home_team: gameWithOptions.game.home_team,
                                            away_team: gameWithOptions.game.away_team,
                                            start_time: gameWithOptions.game.start_time
                                          })}
                                        >
                                          <div className="flex justify-between items-center mb-1">
                                            <div className="text-xs font-medium text-gray-300">
                                              {bestOdds.bookmaker}
                                            </div>
                                            <Badge variant="default" className="text-xs font-bold px-2 py-0.5 bg-green-600 text-white">
                                              {formatOdds(bestOdds.american_odds)}
                                            </Badge>
                                          </div>
                                          <div className="text-xs text-gray-400 font-medium">
                                            ${(remainingBalance * bestOdds.decimal_odds).toFixed(2)}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Show/hide all bookmakers - compact */}
                                    {outcome.bookmakers.length > 1 && (
                                      <div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setPopupBookmakers({
                                            outcomeKey: `${gameWithOptions.game.id}-${marketType}-${outcomeKey}`,
                                            bookmakers: outcome.bookmakers,
                                            outcomeName: outcome.outcome_name
                                          })}
                                          className="flex items-center gap-1 text-xs h-8 px-3 border-gray-600 hover:border-green-500 text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 w-full"
                                        >
                                          Show ({outcome.bookmakers.length})
                                          <ChevronDown className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        </div>

                        {/* Right section - Home team or Over */}
                        <div className="border border-gray-600 rounded-lg p-4 bg-gray-800/50">
                          <h5 className="font-semibold text-sm text-white text-center mb-3">
                            {marketType === 'totals' ? 'Over' : gameWithOptions.game.home_team}
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(outcomes)
                              .filter(([outcomeKey, outcome]) => {
                                if (marketType === 'totals') {
                                  return outcome.outcome_name.toLowerCase().includes('over');
                                } else if (marketType === 'spreads') {
                                  return outcome.outcome_name === gameWithOptions.game.home_team;
                                } else {
                                  return outcome.outcome_name === gameWithOptions.game.home_team;
                                }
                              })
                              .map(([outcomeKey, outcome]) => {
                                const bestOdds = findBestOdds(outcome.bookmakers);
                                
                                return (
                                  <div key={outcomeKey} className="border rounded-lg p-4 bg-gray-900 hover:shadow-md transition-all duration-200 border-gray-700 hover:border-green-500 hover:bg-gray-800">
                                    {/* Outcome name */}
                                    <div className="font-semibold text-sm mb-2 text-white text-center">
                                      {getOutcomeDisplayName(outcome, marketType)}
                                    </div>
                                    
                                    {/* Best odds - compact display */}
                                    {bestOdds && (
                                      <div className="mb-2">
                                        <div
                                          className="p-2 border rounded-lg cursor-pointer transition-all duration-200 border-gray-600 hover:border-green-500 hover:bg-gray-800 hover:shadow-sm"
                                          onClick={() => addToBetslip({
                                            id: bestOdds.id,
                                            game_id: gameWithOptions.game.id,
                                            market_type: marketType,
                                            outcome_name: outcome.outcome_name,
                                            outcome_point: outcome.outcome_point,
                                            bookmaker: bestOdds.bookmaker,
                                            american_odds: bestOdds.american_odds,
                                            decimal_odds: bestOdds.decimal_odds
                                          }, {
                                            home_team: gameWithOptions.game.home_team,
                                            away_team: gameWithOptions.game.away_team,
                                            start_time: gameWithOptions.game.start_time
                                          })}
                                        >
                                          <div className="flex justify-between items-center mb-1">
                                            <div className="text-xs font-medium text-gray-300">
                                              {bestOdds.bookmaker}
                                            </div>
                                            <Badge variant="default" className="text-xs font-bold px-2 py-0.5 bg-green-600 text-white">
                                              {formatOdds(bestOdds.american_odds)}
                                            </Badge>
                                          </div>
                                          <div className="text-xs text-gray-400 font-medium">
                                            ${(remainingBalance * bestOdds.decimal_odds).toFixed(2)}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Show/hide all bookmakers - compact */}
                                    {outcome.bookmakers.length > 1 && (
                                      <div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setPopupBookmakers({
                                            outcomeKey: `${gameWithOptions.game.id}-${marketType}-${outcomeKey}`,
                                            bookmakers: outcome.bookmakers,
                                            outcomeName: outcome.outcome_name
                                          })}
                                          className="flex items-center gap-1 text-xs h-8 px-3 border-gray-600 hover:border-green-500 text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 w-full"
                                        >
                                          Show ({outcome.bookmakers.length})
                                          <ChevronDown className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
              </CardContent>
            )}
          </Card>
        ))}
      </div>


      {/* User's Current Bets */}
      {userBets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Bets This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userBets.map((bet) => (
                <div key={bet.id} className="flex justify-between items-center p-3 border rounded bg-gray-900 border-gray-700">
                  <div>
                    <div className="font-medium text-white">{bet.betting_option.outcome_name}</div>
                    <div className="text-sm text-gray-400">
                      {bet.betting_option.bookmaker} • {formatOdds(bet.betting_option.american_odds)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-white">${bet.amount.toFixed(2)}</div>
                    <div className="text-sm text-gray-400">
                      ${bet.potential_payout.toFixed(2)} payout
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bookmaker Popup Overlay */}
      {popupBookmakers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">
                  {popupBookmakers.outcomeName} - All Bookmakers
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPopupBookmakers(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {popupBookmakers.bookmakers
                  .sort((a, b) => {
                    if (a.american_odds > 0 && b.american_odds > 0) {
                      return b.american_odds - a.american_odds;
                    } else if (a.american_odds < 0 && b.american_odds < 0) {
                      return b.american_odds - a.american_odds;
                    } else if (a.american_odds > 0 && b.american_odds < 0) {
                      return -1;
                    } else if (a.american_odds < 0 && b.american_odds > 0) {
                      return 1;
                    }
                    return 0;
                  })
                  .map((bookmaker, index) => (
                    <div
                      key={index}
                      className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedBettingOption?.bookmaker === bookmaker.bookmaker &&
                        selectedBettingOption?.outcome_name === popupBookmakers.outcomeName
                          ? 'border-green-500 bg-green-900 shadow-md'
                          : 'border-gray-600 hover:border-green-500 hover:bg-gray-800 hover:shadow-sm'
                      }`}
                      onClick={() => {
                        // Find the game info for this bet
                        const gameInfo = games.find(game => 
                          game.betting_options[popupBookmakers.outcomeKey.split('-')[1]]?.[popupBookmakers.outcomeKey.split('-')[2]]
                        )?.game;
                        
                        if (gameInfo) {
                          addToBetslip({
                            id: bestOdds.id,
                            game_id: gameInfo.id,
                            market_type: popupBookmakers.outcomeKey.split('-')[1],
                            outcome_name: popupBookmakers.outcomeName,
                            outcome_point: 0, // Will be set when placing bet
                            bookmaker: bookmaker.bookmaker,
                            american_odds: bookmaker.american_odds,
                            decimal_odds: bookmaker.decimal_odds
                          }, {
                            home_team: gameInfo.home_team,
                            away_team: gameInfo.away_team,
                            start_time: gameInfo.start_time
                          });
                        }
                        setPopupBookmakers(null);
                      }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium text-white">{bookmaker.bookmaker}</div>
                        <Badge variant="default" className="text-sm font-bold px-2 py-1 bg-green-600 text-white">
                          {formatOdds(bookmaker.american_odds)}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-400">
                        Potential payout: ${(remainingBalance * bookmaker.decimal_odds).toFixed(2)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Bottom Betslip */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <Betslip
          bets={betslipBets}
          onRemoveBet={removeFromBetslip}
          onUpdateAmount={updateBetslipAmount}
          onPlaceBets={placeAllBets}
          remainingBalance={remainingBalance}
          placingBets={placingBets}
          error={error}
        />
      </div>
    </div>
  );
};
