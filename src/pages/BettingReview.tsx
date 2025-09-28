import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, DollarSign, TrendingUp, Clock, AlertTriangle, X, Calculator, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentWeek } from '@/hooks/useWeekManagement';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { calculateParlayFromOptions } from '@/utils/parlayUtils';

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
  player_name?: string; // For player props
  home_team: string;
  away_team: string;
  start_time: string;
}

interface BetslipBet {
  bettingOption: BettingOption;
  amount: number;
}

interface ParlayBettingOption {
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
  player_name?: string; // For player props
  home_team: string;
  away_team: string;
  start_time: string;
  gameInfo: {
    home_team: string;
    away_team: string;
    start_time: string;
  };
}

interface BettingReviewProps {
  matchupId?: number;
  week?: number;
  onBetsPlaced?: () => void;
}

export const BettingReview: React.FC<BettingReviewProps> = ({
  matchupId: propMatchupId,
  week: propWeek,
  onBetsPlaced
}) => {
  const navigate = useNavigate();
  const { leagueId } = useParams<{ leagueId: string }>();
  const { user } = useAuth();
  const { currentWeek } = useCurrentWeek();
  const [betslipBets, setBetslipBets] = useState<BetslipBet[]>([]);
  const [parlayBets, setParlayBets] = useState<ParlayBettingOption[]>([]);
  const [parlayStake, setParlayStake] = useState<number>(0);
  const [showParlayDetails, setShowParlayDetails] = useState<boolean>(false);
  const [placingBets, setPlacingBets] = useState(false);
  const [placingParlay, setPlacingParlay] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [userBets, setUserBets] = useState<any[]>([]);
  const [remainingBalance, setRemainingBalance] = useState<number>(100);
  const [matchupId, setMatchupId] = useState<number>(propMatchupId || 0);
  const [week, setWeek] = useState<number>(propWeek || currentWeek);

  // Calculate parlay information
  const parlayCalculation = parlayBets.length >= 1 ? calculateParlayFromOptions(parlayStake, parlayBets) : null;
  
  const totalBetAmount = betslipBets.reduce((sum, bet) => sum + bet.amount, 0) + parlayStake;
  const totalPotentialPayout = betslipBets.reduce((sum, bet) => sum + (bet.amount * bet.bettingOption.decimal_odds), 0) + (parlayCalculation?.return || 0);
  const totalProfit = totalPotentialPayout - totalBetAmount;
  const budgetUsed = totalBetAmount;
  const budgetPercentage = (budgetUsed / 100) * 100;

  useEffect(() => {
    // Load bets and parlay bets from sessionStorage
    const storedBets = sessionStorage.getItem('betslipBets');
    const storedParlayBets = sessionStorage.getItem('parlayBets');
    const storedWeek = sessionStorage.getItem('bettingWeek');
    
    // Set week from sessionStorage if available
    if (storedWeek) {
      const weekValue = parseInt(storedWeek);
      setWeek(weekValue);
    } else {
      console.log(`🔍 No week found in sessionStorage, using current week: ${currentWeek || propWeek}`);
      setWeek(currentWeek || propWeek);
    }
    
    if (storedBets) {
      try {
        const parsedBets = JSON.parse(storedBets);
        setBetslipBets(parsedBets);
      } catch (error) {
        console.error('❌ Failed to parse stored bets:', error);
        navigate(-1); // Go back if there's an error
      }
    }
    
    if (storedParlayBets) {
      try {
        const parsedParlayBets = JSON.parse(storedParlayBets);
        setParlayBets(parsedParlayBets);
      } catch (error) {
        console.error('❌ Failed to parse stored parlay bets:', error);
      }
    }
    
    // If no bets at all, go back
    if (!storedBets && !storedParlayBets) {
      console.log('❌ No bets found, navigating back');
      navigate(-1);
    }

    // loadUserBets and loadMatchupData will be called when week changes
  }, []);

  // Update week when currentWeek changes (if no sessionStorage week)
  useEffect(() => {
    const storedWeek = sessionStorage.getItem('bettingWeek');
    if (!storedWeek && currentWeek && currentWeek !== week) {
      console.log(`🔄 Updating week from ${week} to current week: ${currentWeek}`);
      setWeek(currentWeek);
    }
  }, [currentWeek, week]);

  // Load matchup data when week changes
  useEffect(() => {
    loadMatchupData();
  }, [week]);

  // Load user bets when week changes
  useEffect(() => {
    if (week) {
      loadUserBets();
    }
  }, [week]);

  // Set initial parlay stake after userBets are loaded
  useEffect(() => {
    if (parlayBets.length >= 2 && parlayStake === 0) {
      setParlayStake(Math.min(remainingBalance, 10)); // Default to $10 or remaining balance
    }
  }, [remainingBalance, parlayBets.length, parlayStake]);

  const loadMatchupData = async () => {
    if (!leagueId) return;
    
    try {
      const matchupResponse = await apiService.getUserMatchup(parseInt(leagueId), week);
      if (matchupResponse.matchup) {
        setMatchupId(matchupResponse.matchup.id);
      }
    } catch (error) {
      console.error('Failed to load matchup:', error);
    }
  };

  const loadUserBets = async () => {
    try {
      const betsResponse = await apiService.getUserBets(week);
      
      setUserBets(betsResponse.bets);
      setRemainingBalance(betsResponse.remaining_balance);
    } catch (error) {
      console.error('Failed to load user bets:', error);
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
      case 'team_totals': return 'Team Total';
      case 'player_pass_tds': return 'Pass TDs';
      case 'player_pass_yds': return 'Pass Yards';
      case 'player_rush_yds': return 'Rush Yards';
      case 'player_receptions': return 'Receptions';
      case 'player_pass_completions': return 'Completions';
      case 'player_rush_att': return 'Rush Attempts';
      case 'player_pass_att': return 'Pass Attempts';
      case 'player_receiving_yds': return 'Receiving Yards';
      case 'player_receiving_tds': return 'Receiving TDs';
      case 'player_rushing_tds': return 'Rushing TDs';
      default: 
        // Convert snake_case to Title Case
        return marketType.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
  };

  const getOutcomeDisplayName = (bet: BetslipBet) => {
    const { bettingOption } = bet;
    
    // Handle player prop bets
    if (bettingOption.market_type.startsWith('player_')) {
      // For player props, we need to get the player name from the betting option
      // The outcome_name should contain "Over" or "Under" and outcome_point is the line
      const playerName = bettingOption.player_name || 'Player'; // Fallback if player_name not available
      const outcome = bettingOption.outcome_name; // "Over" or "Under"
      const line = bettingOption.outcome_point;
      const marketType = getMarketDisplayName(bettingOption.market_type);
      
      if (line !== null && line !== undefined) {
        return `${marketType} - ${playerName} ${outcome} ${line}`;
      } else {
        return `${marketType} - ${playerName} ${outcome}`;
      }
    }
    
    // Handle other bet types
    if (bettingOption.market_type === 'totals') {
      return `${bettingOption.outcome_name} ${bettingOption.outcome_point}`;
    } else if (bettingOption.market_type === 'spreads') {
      return `${bettingOption.outcome_name} ${bettingOption.outcome_point > 0 ? '+' : ''}${bettingOption.outcome_point}`;
    } else if (bettingOption.market_type === 'team_totals') {
      return `${bettingOption.outcome_name} ${bettingOption.outcome_point}`;
    }
    return bettingOption.outcome_name;
  };

  const getParlayLegDisplayName = (leg: ParlayBettingOption) => {
    // Handle player prop bets
    if (leg.market_type.startsWith('player_')) {
      const playerName = leg.player_name || 'Player'; // Fallback if player_name not available
      const outcome = leg.outcome_name; // "Over" or "Under"
      const line = leg.outcome_point;
      const marketType = getMarketDisplayName(leg.market_type);
      
      if (line !== null && line !== undefined) {
        return `${marketType} - ${playerName} ${outcome} ${line}`;
      } else {
        return `${marketType} - ${playerName} ${outcome}`;
      }
    }
    
    // Handle other bet types
    if (leg.market_type === 'totals') {
      return `${leg.outcome_name} ${leg.outcome_point}`;
    } else if (leg.market_type === 'spreads') {
      return `${leg.outcome_name} ${leg.outcome_point && leg.outcome_point > 0 ? '+' : ''}${leg.outcome_point}`;
    } else if (leg.market_type === 'team_totals') {
      return `${leg.outcome_name} ${leg.outcome_point}`;
    }
    return leg.outcome_name;
  };

  const formatAmericanOdds = (americanOdds: number) => {
    return americanOdds > 0 ? `+${americanOdds}` : americanOdds.toString();
  };

  const updateBetAmount = (index: number, amount: number) => {
    const validAmount = isNaN(amount) ? 0 : amount;
    if (validAmount < 0 || validAmount > remainingBalance) return;

    const updatedBets = [...betslipBets];
    updatedBets[index].amount = validAmount;
    setBetslipBets(updatedBets);
  };

  const removeBet = (index: number) => {
    setBetslipBets(betslipBets.filter((_, i) => i !== index));
  };

  const handleParlayStakeChange = (value: string) => {
    const stake = parseFloat(value) || 0;
    if (stake >= 0 && stake <= remainingBalance) {
      setParlayStake(stake);
    }
  };

  const formatGameTime = (startTime: string) => {
    // Ensure the date string is treated as UTC
    const date = new Date(startTime.includes('Z') || startTime.includes('+') || startTime.includes('-', 10) 
      ? startTime 
      : startTime + 'Z');
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

  const handlePlaceBets = () => {
    setShowConfirmation(true);
  };

  const confirmPlaceBets = async () => {
    if (betslipBets.length === 0 && parlayBets.length === 0) return;

    try {
      setPlacingBets(true);
      setPlacingParlay(true);
      setError(null);

      // Place regular bets
      if (betslipBets.length > 0) {
        const batchBets = betslipBets.map(betslipBet => ({
          matchup_id: matchupId,
          betting_option_id: betslipBet.bettingOption.id,
          amount: betslipBet.amount
        }));

        await apiService.placeBatchBets({ bets: batchBets, week });
      }

      // Place parlay bet
      if (parlayBets.length >= 1 && parlayStake > 0) {
        await apiService.placeParlayBet({
          matchupId: matchupId,
          amount: parlayStake,
          bettingOptionIds: parlayBets.map(leg => leg.id)
        });
      }

      const totalBetsPlaced = betslipBets.length + (parlayBets.length >= 1 ? 1 : 0);
      toast.success(`Successfully placed ${totalBetsPlaced} bet${totalBetsPlaced !== 1 ? 's' : ''}!`);
      setShowConfirmation(false);
      
      // Clear sessionStorage
      sessionStorage.removeItem('betslipBets');
      sessionStorage.removeItem('parlayBets');
      
      // Call callback if provided
      if (onBetsPlaced) {
        onBetsPlaced();
      }
      
      navigate(-1); // Go back to betting interface
    } catch (error) {
      console.error('Failed to place bets:', error);
      setError('Failed to place bets');
    } finally {
      setPlacingBets(false);
      setPlacingParlay(false);
    }
  };

  const hasLockedBets = betslipBets.some(bet => bet.bettingOption.is_locked);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Please log in to place bets</h2>
              <p className="text-muted-foreground">You need to be logged in to place bets.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Review Your Bets</h1>
            <p className="text-muted-foreground">Week {week} • Finalize your betting selections</p>
          </div>
        </div>

        {/* Budget Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Weekly Budget Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-gray-300">
                <span>Week {week} Budget</span>
                <span>${budgetUsed.toFixed(2)} / $100</span>
              </div>
              <Progress value={budgetPercentage} className="h-3" />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">${remainingBalance.toFixed(2)}</div>
                  <div className="text-sm text-gray-400">Remaining</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">${totalBetAmount.toFixed(2)}</div>
                  <div className="text-sm text-gray-400">Betslip Total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-500">${totalPotentialPayout.toFixed(2)}</div>
                  <div className="text-sm text-gray-400">Potential Payout</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bets Review */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side - Individual bets */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Bets ({betslipBets.length + (parlayBets.length >= 1 ? 1 : 0)})</h2>
            
            {/* Parlay Bet */}
            {parlayBets.length >= 1 && (
              <Card className="bg-blue-900 border-blue-700">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-blue-200 flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Parlay ({parlayBets.length} legs)
                      </CardTitle>
                      <div className="text-sm text-blue-300 mt-1">
                        {parlayCalculation && (
                          <>
                            Odds: {parlayCalculation.decimal_odds.toFixed(2)} • 
                            Stake: ${parlayStake.toFixed(2)} • 
                            Return: ${parlayCalculation.return.toFixed(2)}
                          </>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowParlayDetails(!showParlayDetails)}
                      className="text-blue-300 hover:text-blue-100 p-1"
                    >
                      {showParlayDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                
                {showParlayDetails && (
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Parlay Legs */}
                      <div className="space-y-2">
                        {parlayBets.map((leg, index) => (
                          <div key={leg.id} className="text-sm bg-blue-800 p-2 rounded">
                            <div className="font-medium text-blue-200">
                              Leg {index + 1}: {leg.away_team} @ {leg.home_team}
                            </div>
                            <div className="text-blue-300">
                              {getParlayLegDisplayName(leg)} • {formatAmericanOdds(leg.american_odds)} • {leg.bookmaker}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Parlay Stake Input */}
                      <div className="flex items-center gap-2">
                        <span className="text-blue-300 text-sm">Parlay Stake:</span>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-blue-300" />
                          <Input
                            type="number"
                            value={parlayStake}
                            onChange={(e) => handleParlayStakeChange(e.target.value)}
                            className="w-24 h-8 text-sm bg-blue-800 border-blue-600 text-blue-100"
                            min="0"
                            max={remainingBalance}
                            step="0.01"
                          />
                        </div>
                      </div>
                      
                      {/* Parlay Payout Info */}
                      {parlayCalculation && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-blue-300">Potential Payout:</span>
                            <span className="text-blue-100 font-semibold">
                              ${parlayCalculation.return.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-blue-300">Potential Profit:</span>
                            <span className="text-green-400 font-semibold">
                              +${parlayCalculation.profit.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
            
            {/* Regular Bets */}
            {betslipBets.map((bet, index) => (
              <Card key={index} className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-white">
                        {bet.bettingOption.away_team} @ {bet.bettingOption.home_team}
                      </CardTitle>
                      <div className="text-sm text-gray-400 mt-1">
                        {getOutcomeDisplayName(bet)} • {getMarketDisplayName(bet.bettingOption.market_type)}
                      </div>
                      <div className="text-sm text-gray-400">
                        {bet.bettingOption.bookmaker} • {formatOdds(bet.bettingOption.american_odds)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatGameTime(bet.bettingOption.start_time)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBet(index)}
                      className="text-gray-400 hover:text-white p-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">Bet Amount:</span>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <Input
                          type="number"
                          value={bet.amount}
                          onChange={(e) => updateBetAmount(index, parseFloat(e.target.value) || 0)}
                          className="w-24 h-8 text-sm bg-gray-700 border-gray-600 text-white"
                          min="0"
                          max={remainingBalance + bet.amount}
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Potential Payout:</span>
                      <span className="text-white font-semibold">
                        ${(bet.amount * bet.bettingOption.decimal_odds).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Potential Profit:</span>
                      <span className="text-green-400 font-semibold">
                        +${((bet.amount * bet.bettingOption.decimal_odds) - bet.amount).toFixed(2)}
                      </span>
                    </div>
                    {bet.bettingOption.is_locked && (
                      <div className="flex items-center gap-1 text-yellow-400 text-sm">
                        <Clock className="h-3 w-3" />
                        <span>This bet is locked and cannot be placed</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Right side - Summary */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Bet Summary</h2>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
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
                <Button
                  onClick={handlePlaceBets}
                  disabled={placingBets || placingParlay || hasLockedBets || totalBetAmount === 0}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                >
                  {placingBets || placingParlay ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Placing Bets...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Place {betslipBets.length + (parlayBets.length >= 1 ? 1 : 0)} Bet{(betslipBets.length + (parlayBets.length >= 1 ? 1 : 0)) !== 1 ? 's' : ''} (${totalBetAmount.toFixed(2)})
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
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
              
              {/* Parlay Bet Summary */}
              {parlayBets.length >= 1 && parlayStake > 0 && (
                <div className="text-sm bg-blue-100 p-2 rounded">
                  <div className="font-medium text-blue-800">
                    Parlay ({parlayBets.length} legs) • ${parlayStake}
                  </div>
                  <div className="text-blue-600">
                    {parlayCalculation && `Odds: ${parlayCalculation.decimal_odds.toFixed(2)} • Return: $${parlayCalculation.return.toFixed(2)}`}
                  </div>
                </div>
              )}
              
              {/* Regular Bets Summary */}
              {betslipBets.map((bet, index) => (
                <div key={index} className="text-sm bg-gray-200 p-3 rounded border">
                  <div className="font-semibold text-gray-800">
                    {bet.bettingOption.away_team} @ {bet.bettingOption.home_team}
                  </div>
                  <div className="text-gray-700 mt-1">
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
              <TrendingUp className="h-4 w-4 mr-2" />
              Place Bets
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default function BettingReviewPage() {
  return <BettingReview />;
}
