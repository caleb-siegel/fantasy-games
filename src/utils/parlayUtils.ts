/**
 * Parlay Betting Calculation Utilities
 * 
 * This module provides functions to calculate parlay odds, payouts, and profits
 * based on American odds from multiple betting options.
 */

export interface BettingOption {
  id: number;
  game_id: string;
  market_type: string;
  outcome_name: string;
  outcome_point: number | null;
  player_name?: string;
  bookmaker: string;
  american_odds: number;
  decimal_odds: number;
  is_locked?: boolean;
  gameInfo: {
    home_team: string;
    away_team: string;
    start_time: string;
  };
}

export interface ParlayLeg {
  leg_number: number;
  betting_option_id: number;
  game_id: string;
  outcome_name: string;
  outcome_point: number | null;
  player_name?: string;
  market_type: string;
  bookmaker: string;
  american_odds: number;
  decimal_odds: number;
}

export interface ParlayCalculation {
  stake: number;
  decimal_odds: number;
  return: number;
  profit: number;
  legs: ParlayLeg[];
  leg_count: number;
}

/**
 * Convert American odds to decimal odds
 */
export function americanToDecimal(americanOdds: number): number {
  if (americanOdds > 0) {
    return (americanOdds / 100) + 1;
  } else {
    return (100 / Math.abs(americanOdds)) + 1;
  }
}

/**
 * Calculate the combined decimal odds for a parlay
 */
export function parlayDecimalOdds(americanOddsList: number[]): number {
  if (americanOddsList.length < 2) {
    throw new Error('Parlay must have at least 2 legs');
  }
  
  const decimalOdds = americanOddsList.map(odds => americanToDecimal(odds));
  return decimalOdds.reduce((acc, odds) => acc * odds, 1);
}

/**
 * Calculate the total payout for a parlay bet
 */
export function parlayPayout(stake: number, americanOddsList: number[]): number {
  const odds = parlayDecimalOdds(americanOddsList);
  return Math.round(stake * odds * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate parlay profit and return information
 */
export function parlayProfit(stake: number, americanOddsList: number[]): {
  stake: number;
  decimal_odds: number;
  return: number;
  profit: number;
} {
  const decimalOdds = parlayDecimalOdds(americanOddsList);
  const totalReturn = parlayPayout(stake, americanOddsList);
  
  return {
    stake,
    decimal_odds: Math.round(decimalOdds * 10000) / 10000, // Round to 4 decimal places
    return: totalReturn,
    profit: Math.round((totalReturn - stake) * 100) / 100
  };
}

/**
 * Validate that betting options can be combined into a parlay
 */
export function validateParlayBets(bettingOptions: BettingOption[]): boolean {
  if (bettingOptions.length < 1) {
    throw new Error('Parlay must have at least 1 leg');
  }
  
  if (bettingOptions.length > 10) {
    throw new Error('Parlay cannot have more than 10 legs');
  }
  
  // Check that no options are locked
  const lockedOptions = bettingOptions.filter(option => option.is_locked);
  if (lockedOptions.length > 0) {
    throw new Error('Cannot include locked betting options in parlay');
  }
  
  return true;
}

/**
 * Calculate parlay information from betting options
 */
export function calculateParlayFromOptions(stake: number, bettingOptions: BettingOption[]): ParlayCalculation {
  validateParlayBets(bettingOptions);
  
  const americanOddsList = bettingOptions.map(option => option.american_odds);
  const parlayInfo = parlayProfit(stake, americanOddsList);
  
  // Add leg details
  const legs: ParlayLeg[] = bettingOptions.map((option, index) => ({
    leg_number: index + 1,
    betting_option_id: option.id,
    game_id: option.game_id,
    outcome_name: option.outcome_name,
    outcome_point: option.outcome_point,
    player_name: option.player_name,
    market_type: option.market_type,
    bookmaker: option.bookmaker,
    american_odds: option.american_odds,
    decimal_odds: option.decimal_odds
  }));
  
  return {
    ...parlayInfo,
    legs,
    leg_count: bettingOptions.length
  };
}

/**
 * Format American odds for display
 */
export function formatAmericanOdds(americanOdds: number): string {
  return americanOdds > 0 ? `+${americanOdds}` : americanOdds.toString();
}

/**
 * Get market display name
 */
export function getMarketDisplayName(marketType: string): string {
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
}

/**
 * Get outcome display name with point information
 */
export function getOutcomeDisplayName(option: BettingOption): string {
  if (option.market_type.startsWith('player_')) {
    const playerName = option.player_name || 'Player'; // Fallback if player_name not available
    const outcome = option.outcome_name; // "Over" or "Under"
    const line = option.outcome_point;
    const marketType = getMarketDisplayName(option.market_type);
    
    if (line !== null && line !== undefined) {
      return `${marketType} - ${playerName} ${outcome} ${line}`;
    } else {
      return `${marketType} - ${playerName} ${outcome}`;
    }
  }
  if (option.market_type === 'totals') {
    return `${option.outcome_name} ${option.outcome_point}`;
  } else if (option.market_type === 'spreads') {
    return `${option.outcome_name} ${option.outcome_point && option.outcome_point > 0 ? '+' : ''}${option.outcome_point}`;
  } else if (option.market_type === 'team_totals') {
    return `${option.outcome_name} ${option.outcome_point}`;
  }
  return option.outcome_name;
}
