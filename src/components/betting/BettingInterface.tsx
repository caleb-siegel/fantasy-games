import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { CompactBetslip } from './CompactBetslip';
import { BettingOption as ParlayBettingOption, calculateParlayFromOptions } from '@/utils/parlayUtils';
import { toast } from 'sonner';
import { getDetailedGameDateTime } from '@/utils/dateUtils';

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
          id: number;
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
  leagueId: number;
}

export const BettingInterface: React.FC<BettingInterfaceProps> = ({ matchupId, week, leagueId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState<GameWithOptions[]>([]);
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [remainingBalance, setRemainingBalance] = useState<number>(100);
  const [totalBetAmount, setTotalBetAmount] = useState<number>(0);
  const [existingParlayBets, setExistingParlayBets] = useState<any[]>([]);
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
  const [parlayBets, setParlayBets] = useState<ParlayBettingOption[]>([]);
  const [placingParlay, setPlacingParlay] = useState(false);

  const betslipTotalAmount = betslipBets.reduce((sum, bet) => sum + bet.amount, 0);
  
  // Helper function to check if a game is locked (has started)
  const isGameLocked = (startTime: string) => {
    const gameStartTime = new Date(startTime);
    const now = new Date();
    return now >= gameStartTime;
  };
  
  // Calculate parlay stake for betslip display
  const parlayCalculation = parlayBets.length >= 2 ? calculateParlayFromOptions(10, parlayBets) : null;
  const parlayStakeAmount = parlayCalculation ? parlayCalculation.stake : 0;
  const totalBetslipAmount = betslipTotalAmount + parlayStakeAmount;
  
  // Calculate total potential payout including both regular bets and parlay bets
  const totalPotentialPayout = userBets.reduce((sum, bet) => sum + bet.potential_payout, 0) + 
    existingParlayBets.reduce((sum, parlay) => sum + parlay.potential_payout, 0);

  useEffect(() => {
    loadBettingData();
  }, [week]);

  const loadBettingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const optionsResponse = await apiService.getWeeklyBettingOptions(week);
      setGames(optionsResponse.games);

      const betsResponse = await apiService.getUserBets(week);
      setUserBets(betsResponse.bets);
      setRemainingBalance(betsResponse.remaining_balance);
      setTotalBetAmount(betsResponse.total_bet_amount);
      setExistingParlayBets(betsResponse.parlay_bets || []);

    } catch (error) {
      console.error('Failed to load betting data:', error);
      setError('Failed to load betting options');
    } finally {
      setLoading(false);
    }
  };

  const addToBetslip = (bettingOption: BettingOption, gameInfo: { home_team: string; away_team: string; start_time: string }) => {
    const existingBetIndex = betslipBets.findIndex(
      bet => bet.bettingOption.id === bettingOption.id
    );

    if (existingBetIndex >= 0) {
      const existingBet = betslipBets[existingBetIndex];
      
      // Check if it's the exact same bet (same bookmaker and odds)
      if (existingBet.bettingOption.bookmaker === bettingOption.bookmaker && 
          existingBet.bettingOption.american_odds === bettingOption.american_odds) {
        toast.error('This bet is already in your betslip');
        return;
      }
      
      const isBetterOdds = (newOdds: number, existingOdds: number) => {
        const newDecimal = newOdds > 0 ? (newOdds / 100) + 1 : (100 / Math.abs(newOdds)) + 1;
        const existingDecimal = existingOdds > 0 ? (existingOdds / 100) + 1 : (100 / Math.abs(existingOdds)) + 1;
        return newDecimal > existingDecimal;
      };

      if (isBetterOdds(bettingOption.american_odds, existingBet.bettingOption.american_odds)) {
        const updatedBets = [...betslipBets];
        updatedBets[existingBetIndex] = {
          ...existingBet,
          bettingOption: bettingOption,
          amount: Math.min(existingBet.amount, remainingBalance)
        };
        setBetslipBets(updatedBets);
        toast.success(`Updated bet with better odds: ${bettingOption.bookmaker} ${formatOdds(bettingOption.american_odds)}`);
      } else {
        toast.error(`Cannot add bet: ${bettingOption.bookmaker} odds (${formatOdds(bettingOption.american_odds)}) are worse than existing ${existingBet.bettingOption.bookmaker} odds (${formatOdds(existingBet.bettingOption.american_odds)})`);
      }
    } else {
      const amount = Math.min(remainingBalance, 10); // Default to $10 or remaining balance
      if (amount < 0) return;

      setBetslipBets([...betslipBets, {
        bettingOption,
        amount,
        gameInfo
      }]);
    }
  };

  const removeFromBetslip = (index: number) => {
    setBetslipBets(betslipBets.filter((_, i) => i !== index));
  };

  const updateBetslipAmount = (index: number, amount: number) => {
    const validAmount = isNaN(amount) ? 0 : amount;
    if (validAmount < 0 || validAmount > remainingBalance) return;

    const updatedBets = [...betslipBets];
    updatedBets[index].amount = validAmount;
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

  const navigateToBettingReview = () => {
    // Store bets and parlay bets in sessionStorage to pass to the review page
    sessionStorage.setItem('betslipBets', JSON.stringify(betslipBets));
    sessionStorage.setItem('parlayBets', JSON.stringify(parlayBets));
    
    navigate(`/leagues/${leagueId}/betting-review`);
  };

  const handleBetsPlaced = () => {
    // Clear betslip after bets are placed
    setBetslipBets([]);
    loadBettingData();
  };

  const addToParlay = (bettingOption: BettingOption, gameInfo: { home_team: string; away_team: string; start_time: string }) => {
    const parlayOption: ParlayBettingOption = {
      id: bettingOption.id,
      game_id: bettingOption.game_id,
      market_type: bettingOption.market_type,
      outcome_name: bettingOption.outcome_name,
      outcome_point: bettingOption.outcome_point,
      bookmaker: bettingOption.bookmaker,
      american_odds: bettingOption.american_odds,
      decimal_odds: bettingOption.decimal_odds,
      is_locked: bettingOption.is_locked,
      gameInfo: gameInfo
    } as ParlayBettingOption;

    // Check if already in parlay
    if (parlayBets.some(bet => bet.id === bettingOption.id)) {
      toast.error('This bet is already in your parlay');
      return;
    }

    setParlayBets(prev => {
      const newParlayBets = [...prev, parlayOption];
      return newParlayBets;
    });
    toast.success('Added to parlay');
  };

  const removeFromParlay = (bettingOptionId: number) => {
    setParlayBets(parlayBets.filter(bet => bet.id !== bettingOptionId));
  };

  const placeParlay = async (stake: number) => {
    if (parlayBets.length < 2) return;

    try {
      setPlacingParlay(true);
      setError(null);

      const bettingOptionIds = parlayBets.map(bet => bet.id);
      
      await apiService.placeParlayBet({
        matchupId: matchupId,
        bettingOptionIds: bettingOptionIds,
        amount: stake,
        week: week
      });

      toast.success(`Successfully placed ${parlayBets.length}-leg parlay!`);
      setParlayBets([]);
      await loadBettingData();
    } catch (error) {
      console.error('Failed to place parlay:', error);
      setError('Failed to place parlay bet');
    } finally {
      setPlacingParlay(false);
    }
  };

  const handlePlaceBet = async () => {
    if (!selectedBettingOption || !betAmount) return;

    const amount = parseFloat(betAmount);
    if (amount <= 0 || amount > remainingBalance) {
      setError('Invalid bet amount');
      return;
    }

    try {
      setPlacingBet(true);
      setError(null);

      await apiService.placeBet({
        matchupId: matchupId,
        bettingOptionId: selectedBettingOption.id,
        amount: amount,
        week: week
      });

      setBetAmount('');
      setSelectedBettingOption(null);
      await loadBettingData();
    } catch (error) {
      console.error('Failed to place bet:', error);
      setError('Failed to place bet');
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
    if (marketType === 'spreads' && outcome.outcome_point) {
      return `${outcome.outcome_name} ${outcome.outcome_point}`;
    } else if (marketType === 'totals' && outcome.outcome_point) {
      return `${outcome.outcome_name} ${outcome.outcome_point > 0 ? '+' : ''}${outcome.outcome_point}`;
    }
    return outcome.outcome_name;
  };

  const findBestOdds = (bookmakers: Array<{id: number, bookmaker: string, american_odds: number, decimal_odds: number}>) => {
    if (!bookmakers.length) return null;
    
    const sorted = bookmakers.sort((a, b) => {
      // Convert to decimal odds for proper comparison
      const aDecimal = a.american_odds > 0 ? (a.american_odds / 100) + 1 : (100 / Math.abs(a.american_odds)) + 1;
      const bDecimal = b.american_odds > 0 ? (b.american_odds / 100) + 1 : (100 / Math.abs(b.american_odds)) + 1;
      
      // Sort by decimal odds descending (highest first)
      return bDecimal - aDecimal;
    });
    
    return sorted[0]; // Return the best odds
  };

  const renderGames = () => (
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
                  {getDetailedGameDateTime(gameWithOptions.game.start_time, user?.timezone || 'America/New_York')}
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
                        <div className="space-y-2">
                          {Object.entries(outcomes).map(([outcomeKey, outcome]) => {
                            // Filter for away team or under outcomes
                            const isRelevantOutcome = marketType === 'totals' 
                              ? outcome.outcome_name.toLowerCase().includes('under')
                              : marketType === 'h2h' 
                                ? outcome.outcome_name === gameWithOptions.game.away_team
                                : marketType === 'spreads'
                                  ? outcome.outcome_name === gameWithOptions.game.away_team
                                  : false;

                            if (!isRelevantOutcome) return null;

                            return (
                              <div key={outcomeKey} className="flex justify-between items-center p-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors">
                                <div className="flex-1">
                                  <div className="font-medium text-white text-sm">
                                    {getOutcomeDisplayName(outcome, marketType)}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {outcome.bookmakers.length > 0 && (
                                    <>
                                      <div className="flex flex-row gap-1">
                                        {isGameLocked(gameWithOptions.game.start_time) ? (
                                          <Button
                                            size="sm"
                                            disabled
                                            className="bg-gray-500 text-gray-300 font-bold px-3 py-1 text-sm cursor-not-allowed"
                                          >
                                            LOCKED
                                          </Button>
                                        ) : (
                                          <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1 text-sm"
                                            onClick={() => {
                                              const bestOdds = findBestOdds(outcome.bookmakers);
                                              if (bestOdds) {
                                                addToBetslip({
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
                                                });
                                              }
                                            }}
                                          >
                                            {formatOdds(findBestOdds(outcome.bookmakers)?.american_odds || 0)}
                                          </Button>
                                        )}
                                        {isGameLocked(gameWithOptions.game.start_time) ? (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            disabled
                                            className="bg-gray-500 text-gray-300 border-gray-500 px-2 py-1 text-xs cursor-not-allowed"
                                          >
                                            LOCKED
                                          </Button>
                                        ) : (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 px-2 py-1 text-xs"
                                            onClick={() => {
                                              const bestOdds = findBestOdds(outcome.bookmakers);
                                              if (bestOdds) {
                                                addToParlay({
                                                  id: bestOdds.id,
                                                  game_id: gameWithOptions.game.id,
                                                  market_type: marketType,
                                                  outcome_name: outcome.outcome_name,
                                                  outcome_point: outcome.outcome_point,
                                                  bookmaker: bestOdds.bookmaker,
                                                  american_odds: bestOdds.american_odds,
                                                  decimal_odds: bestOdds.decimal_odds,
                                                  is_locked: false
                                                }, {
                                                  home_team: gameWithOptions.game.home_team,
                                                  away_team: gameWithOptions.game.away_team,
                                                  start_time: gameWithOptions.game.start_time
                                                });
                                              }
                                            }}
                                          >
                                            Parlay
                                          </Button>
                                        )}
                                      </div>
                                      {outcome.bookmakers.length > 1 && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="border-gray-500 text-gray-300 hover:bg-gray-600 px-2 py-1 text-xs"
                                          onClick={() => setPopupBookmakers({
                                            outcomeKey,
                                            bookmakers: outcome.bookmakers,
                                            outcomeName: getOutcomeDisplayName(outcome, marketType)
                                          })}
                                        >
                                          +{outcome.bookmakers.length - 1}
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </div>
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
                        <div className="space-y-2">
                          {Object.entries(outcomes).map(([outcomeKey, outcome]) => {
                            // Filter for home team or over outcomes
                            const isRelevantOutcome = marketType === 'totals' 
                              ? outcome.outcome_name.toLowerCase().includes('over')
                              : marketType === 'h2h' 
                                ? outcome.outcome_name === gameWithOptions.game.home_team
                                : marketType === 'spreads'
                                  ? outcome.outcome_name === gameWithOptions.game.home_team
                                  : false;

                            if (!isRelevantOutcome) return null;

                            return (
                              <div key={outcomeKey} className="flex justify-between items-center p-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors">
                                <div className="flex-1">
                                  <div className="font-medium text-white text-sm">
                                    {getOutcomeDisplayName(outcome, marketType)}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {outcome.bookmakers.length > 0 && (
                                    <>
                                      <div className="flex flex-row gap-1">
                                        {isGameLocked(gameWithOptions.game.start_time) ? (
                                          <Button
                                            size="sm"
                                            disabled
                                            className="bg-gray-500 text-gray-300 font-bold px-3 py-1 text-sm cursor-not-allowed"
                                          >
                                            LOCKED
                                          </Button>
                                        ) : (
                                          <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1 text-sm"
                                            onClick={() => {
                                              const bestOdds = findBestOdds(outcome.bookmakers);
                                              if (bestOdds) {
                                                addToBetslip({
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
                                                });
                                              }
                                            }}
                                          >
                                            {formatOdds(findBestOdds(outcome.bookmakers)?.american_odds || 0)}
                                          </Button>
                                        )}
                                        {isGameLocked(gameWithOptions.game.start_time) ? (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            disabled
                                            className="bg-gray-500 text-gray-300 border-gray-500 px-2 py-1 text-xs cursor-not-allowed"
                                          >
                                            LOCKED
                                          </Button>
                                        ) : (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 px-2 py-1 text-xs"
                                            onClick={() => {
                                              const bestOdds = findBestOdds(outcome.bookmakers);
                                              if (bestOdds) {
                                                addToParlay({
                                                  id: bestOdds.id,
                                                  game_id: gameWithOptions.game.id,
                                                  market_type: marketType,
                                                  outcome_name: outcome.outcome_name,
                                                  outcome_point: outcome.outcome_point,
                                                  bookmaker: bestOdds.bookmaker,
                                                  american_odds: bestOdds.american_odds,
                                                  decimal_odds: bestOdds.decimal_odds,
                                                  is_locked: false
                                                }, {
                                                  home_team: gameWithOptions.game.home_team,
                                                  away_team: gameWithOptions.game.away_team,
                                                  start_time: gameWithOptions.game.start_time
                                                });
                                              }
                                            }}
                                          >
                                            Parlay
                                          </Button>
                                        )}
                                      </div>
                                      {outcome.bookmakers.length > 1 && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="border-gray-500 text-gray-300 hover:bg-gray-600 px-2 py-1 text-xs"
                                          onClick={() => setPopupBookmakers({
                                            outcomeKey,
                                            bookmakers: outcome.bookmakers,
                                            outcomeName: getOutcomeDisplayName(outcome, marketType)
                                          })}
                                        >
                                          +{outcome.bookmakers.length - 1}
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </div>
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
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading betting options...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Desktop Layout: Side-by-side with betslip */}
      <div className="hidden lg:flex lg:gap-6">
        {/* Left side: Games and betting options */}
        <div className="flex-1 space-y-6">
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
                  <div className="text-2xl font-bold text-blue-400">${totalBetslipAmount.toFixed(2)}</div>
                  <div className="text-sm text-gray-400">Betslip</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-500">${totalPotentialPayout.toFixed(2)}</div>
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
          {renderGames()}
        </div>

        {/* Right side: Desktop betslip */}
        <div className="w-80 flex-shrink-0">
          <div className="sticky top-24 space-y-4">
            <CompactBetslip
              bets={betslipBets}
              parlayBets={parlayBets}
              onRemoveBet={removeFromBetslip}
              onRemoveParlayLeg={removeFromParlay}
              onPlaceParlay={placeParlay}
              onContinueToReview={navigateToBettingReview}
              remainingBalance={remainingBalance}
              week={week}
              placingParlay={placingParlay}
            />
          </div>
        </div>
      </div>

      {/* Mobile Layout: Stacked with bottom betslip */}
      <div className="lg:hidden space-y-6 pb-32">
        {/* Balance Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Weekly Betting Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2 sm:gap-3 lg:gap-4 text-center">
              <div className="px-1">
                <div className="text-sm sm:text-lg lg:text-xl xl:text-2xl font-bold text-green-600 truncate">${remainingBalance.toFixed(2)}</div>
                <div className="text-xs text-gray-400 truncate">Remaining</div>
              </div>
              <div className="px-1">
                <div className="text-sm sm:text-lg lg:text-xl xl:text-2xl font-bold text-green-400 truncate">${totalBetAmount.toFixed(2)}</div>
                <div className="text-xs text-gray-400 truncate">Placed</div>
              </div>
              <div className="px-1">
                <div className="text-sm sm:text-lg lg:text-xl xl:text-2xl font-bold text-blue-400 truncate">${totalBetslipAmount.toFixed(2)}</div>
                <div className="text-xs text-gray-400 truncate">Betslip</div>
              </div>
              <div className="px-1">
                <div className="text-sm sm:text-lg lg:text-xl xl:text-2xl font-bold text-green-500 truncate">${totalPotentialPayout.toFixed(2)}</div>
                <div className="text-xs text-gray-400 truncate">Potential Payout</div>
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

        {/* Games content for mobile */}
        {renderGames()}
      </div>

      {/* Mobile Bottom Betslip */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <CompactBetslip
          bets={betslipBets}
          parlayBets={parlayBets}
          onRemoveBet={removeFromBetslip}
          onRemoveParlayLeg={removeFromParlay}
          onPlaceParlay={placeParlay}
          onContinueToReview={navigateToBettingReview}
          remainingBalance={remainingBalance}
          week={week}
          placingParlay={placingParlay}
        />
      </div>

      {/* Bookmaker Selection Popup */}
      {popupBookmakers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">{popupBookmakers.outcomeName}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPopupBookmakers(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              {popupBookmakers.bookmakers
                .sort((a, b) => {
                  // Convert to decimal odds for proper comparison
                  const aDecimal = a.american_odds > 0 ? (a.american_odds / 100) + 1 : (100 / Math.abs(a.american_odds)) + 1;
                  const bDecimal = b.american_odds > 0 ? (b.american_odds / 100) + 1 : (100 / Math.abs(b.american_odds)) + 1;
                  
                  // Sort by decimal odds descending (highest first)
                  return bDecimal - aDecimal;
                })
                .map((bookmaker, index) => (
                  <div
                    key={bookmaker.id}
                    className="p-3 border border-gray-600 rounded-lg hover:border-green-500 cursor-pointer transition-colors"
                    onClick={() => {
                      const gameInfo = games.find(game =>
                        game.betting_options[popupBookmakers.outcomeKey.split('_')[0]]?.[popupBookmakers.outcomeKey]
                      );
                      if (gameInfo) {
                        addToBetslip({
                          id: bookmaker.id,
                          game_id: gameInfo.game.id,
                          market_type: popupBookmakers.outcomeKey.split('_')[0],
                          outcome_name: popupBookmakers.outcomeName,
                          outcome_point: null,
                          bookmaker: bookmaker.bookmaker,
                          american_odds: bookmaker.american_odds,
                          decimal_odds: bookmaker.decimal_odds
                        }, {
                          home_team: gameInfo.game.home_team,
                          away_team: gameInfo.game.away_team,
                          start_time: gameInfo.game.start_time
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
      )}
    </div>
  );
};
