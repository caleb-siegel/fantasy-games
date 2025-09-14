// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

// API service for Fantasy Betting League
class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.token = localStorage.getItem('auth_token');
  }

  // Set authentication token
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // Get headers for API requests
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Generic API request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Authentication endpoints
  async register(data: { username: string; email: string; password: string }) {
    const response = await this.request<{
      message: string;
      access_token: string;
      user: any;
    }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    this.setToken(response.access_token);
    return response;
  }

  async login(data: { email: string; password: string }) {
    const response = await this.request<{
      message: string;
      access_token: string;
      user: any;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    this.setToken(response.access_token);
    return response;
  }

  async getCurrentUser() {
    return this.request<{ user: any }>('/api/auth/me');
  }

  // League endpoints
  async createLeague(data: { name: string }) {
    return this.request<{
      message: string;
      league: any;
    }>('/api/leagues', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async joinLeague(data: { invite_code: string }) {
    return this.request<{
      message: string;
      league: any;
    }>('/api/leagues/join', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getLeague(leagueId: number) {
    const result = await this.request<{ league: any }>(`/api/leagues/${leagueId}`);
    return result;
  }

  async getLeagueStandings(leagueId: number) {
    return this.request<{ standings: any[] }>(`/api/leagues/${leagueId}/standings`);
  }

  async generateSchedule(leagueId: number, weeks: number = 10) {
    return this.request<{
      message: string;
      matchups: number;
    }>(`/api/leagues/${leagueId}/schedule`, {
      method: 'POST',
      body: JSON.stringify({ weeks }),
    });
  }

  // Betting endpoints
  async getWeeklyBettingOptions(week: number) {
    return this.request<{
      week: number;
      games: Array<{
        game: any;
        betting_options: any;
      }>;
    }>(`/api/bets/options/week/${week}`);
  }

  async placeBet(data: {
    matchupId: number;
    bettingOptionId: number;
    amount: number;
    week: number;
  }) {
    return this.request<{
      message: string;
      bet: any;
    }>('/api/bets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async placeBatchBets(data: {
    bets: Array<{
      matchup_id: number;
      betting_option_id: number;
      amount: number;
    }>;
    week: number;
  }) {
    return this.request<{
      message: string;
      bets: any[];
      total_amount: number;
    }>('/api/bets/batch', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserLeagues() {
    return this.request<{
      leagues: any[];
    }>('/api/leagues/user');
  }

  async updateProfile(data: { username?: string; email?: string }) {
    return this.request<{
      message: string;
      user: any;
    }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getUserMatchup(leagueId: number, week: number) {
    return this.request<{
      matchup: {
        id: number;
        league_id: number;
        week: number;
        user1_id: number;
        user2_id: number;
        user1_username: string;
        user2_username: string;
        winner_id: number | null;
        created_at: string;
      };
    }>(`/api/bets/matchup/${leagueId}/${week}`);
  }

  async confirmLeagueSetup(leagueId: number) {
    return this.request<{
      message: string;
      regular_season_matchups: number;
      playoff_matchups: number;
      total_matchups: number;
    }>(`/api/leagues/${leagueId}/confirm-setup`, {
      method: 'POST',
    });
  }

  async getUserBetsForMatchup(matchupId: number, userId: number) {
    return this.request<{
      bets: Array<{
        id: number;
        user_id: number;
        matchup_id: number;
        betting_option_id: number;
        amount: number;
        potential_payout: number;
        status: string;
        created_at: string;
        betting_option: {
          id: number;
          game_id: string;
          market_type: string;
          outcome_name: string;
          outcome_point: number | null;
          bookmaker: string;
          american_odds: number;
          decimal_odds: number;
          created_at: string;
          game: {
            id: string;
            home_team: string;
            away_team: string;
            start_time: string;
            week: number;
            result: string | null;
            created_at: string;
          };
        };
      }>;
      matchup_id: number;
      user_id: number;
      week: number;
    }>(`/api/bets/matchup/${matchupId}/user/${userId}`);
  }

  async getUserBets(week: number) {
    return this.request<{
      bets: any[];
      parlay_bets: any[];
      total_bet_amount: number;
      total_regular_bet_amount: number;
      total_parlay_bet_amount: number;
      remaining_balance: number;
      week: number;
    }>(`/api/bets/user/${week}`);
  }

  async getMatchupBets(matchupId: number) {
    return this.request<{
      matchup: any;
      user1_bets: any;
      user2_bets: any;
    }>(`/api/bets/matchup/${matchupId}`);
  }

  // Results endpoints
  async updateResults(week?: number) {
    return this.request<{
      message: string;
      updated_games: number;
      processed_bets: number;
    }>('/api/results/update', {
      method: 'POST',
      body: JSON.stringify({ week }),
    });
  }

  async getWeeklyResults(week: number) {
    return this.request<{
      week: number;
      results: any[];
    }>(`/api/results/week/${week}`);
  }

  async forceUpdateOdds(week?: number) {
    return this.request<{
      message: string;
    }>('/api/bets/admin/force-update', {
      method: 'POST',
      body: JSON.stringify({ week }),
    });
  }

  async generatePlayoffs(leagueId: number) {
    return this.request(`/api/leagues/${leagueId}/playoffs`, {
      method: 'POST',
    });
  }

  async getWeekMatchups(leagueId: number, week: number) {
    return this.request(`/api/leagues/${leagueId}/matchups/${week}`);
  }

  // Enhanced Results and Bet Evaluation
  async updateGameResults(games: Array<{id: string, result: string}>) {
    return this.request('/api/results/update', {
      method: 'POST',
      body: JSON.stringify({ games }),
    });
  }

  async evaluateAllPendingBets() {
    return this.request('/api/results/evaluate-bets', {
      method: 'POST',
    });
  }

  async getMatchupDetails(matchupId: number) {
    return this.request(`/api/results/matchup/${matchupId}/details`);
  }

  // Player Profile API
  async getPlayerProfile(leagueId: number, userId: number) {
    const result = await this.request(`/api/leagues/${leagueId}/players/${userId}`);
    return result;
  }

  async getPlayerStats(leagueId: number, userId: number) {
    return this.request(`/api/leagues/${leagueId}/players/${userId}/stats`);
  }

  async getPlayerBets(leagueId: number, userId: number, week?: number) {
    const params = week ? `?week=${week}` : '';
    return this.request(`/api/leagues/${leagueId}/players/${userId}/bets${params}`);
  }

  // Enhanced Standings API
  async getComprehensiveStandings(leagueId: number) {
    return this.request(`/api/leagues/${leagueId}/standings/comprehensive`);
  }

  async getStandingsHistory(leagueId: number) {
    return this.request(`/api/leagues/${leagueId}/standings/history`);
  }

  // Calendar and Schedule API
  async getLeagueCalendar(leagueId: number) {
    return this.request(`/api/leagues/${leagueId}/calendar`);
  }

  async getAllMatchups(leagueId: number) {
    return this.request(`/api/leagues/${leagueId}/matchups/all`);
  }

  // Bet Management Enhancements
  async getBetHistory(leagueId: number, userId?: number, week?: number) {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId.toString());
    if (week) params.append('week', week.toString());
    
    const queryString = params.toString();
    return this.request(`/api/bets/history${queryString ? `?${queryString}` : ''}`);
  }

  async getBetAnalytics(leagueId: number, userId?: number) {
    const params = userId ? `?user_id=${userId}` : '';
    return this.request(`/api/bets/analytics${params}`);
  }

  // League Settings and Management
  async updateLeagueSettings(leagueId: number, settings: any) {
    return this.request(`/api/leagues/${leagueId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getLeagueSettings(leagueId: number) {
    return this.request(`/api/leagues/${leagueId}/settings`);
  }

  // Export and Reporting
  async exportStandings(leagueId: number, format: 'csv' | 'json' = 'csv') {
    return this.request(`/api/leagues/${leagueId}/export/standings?format=${format}`);
  }

  async exportMatchups(leagueId: number, format: 'csv' | 'json' = 'csv') {
    return this.request(`/api/leagues/${leagueId}/export/matchups?format=${format}`);
  }

  async exportPlayerStats(leagueId: number, userId: number, format: 'csv' | 'json' = 'csv') {
    return this.request(`/api/leagues/${leagueId}/export/player/${userId}?format=${format}`);
  }

  // Parlay betting methods
  async placeParlayBet(data: {
    matchupId: number;
    bettingOptionIds: number[];
    amount: number;
    week: number;
  }) {
    return this.request('/api/bets/parlay', {
      method: 'POST',
      body: JSON.stringify({
        matchup_id: data.matchupId,
        betting_option_ids: data.bettingOptionIds,
        amount: data.amount,
        week: data.week
      }),
    });
  }

  async getUserParlayBets(week: number) {
    return this.request(`/api/bets/parlay/week/${week}`);
  }

  async getParlayBetDetails(parlayId: number) {
    return this.request(`/api/bets/parlay/${parlayId}`);
  }

  // Bet validation and statistics endpoints
  async getUserBettingStats(userId?: number) {
    const endpoint = userId ? `/api/validation/user-stats/${userId}` : '/api/validation/user-stats';
    return this.request(endpoint);
  }

  async getBetHistoryPaginated(userId?: number, page: number = 1, perPage: number = 20) {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId.toString());
    params.append('page', page.toString());
    params.append('per_page', perPage.toString());
    
    return this.request(`/api/validation/bet-history/${userId || 'current'}?${params.toString()}`);
  }

  async getPendingBets() {
    return this.request('/api/validation/pending-bets');
  }

  async getGameResults(gameId: string) {
    return this.request(`/api/validation/game-results/${gameId}`);
  }

  async getRecentGames() {
    return this.request('/api/validation/recent-games');
  }

  async getSystemStatus() {
    return this.request('/api/validation/system-status');
  }

  async runBetValidation() {
    return this.request('/api/validation/run-validation', {
      method: 'POST',
    });
  }

}

// Create and export a singleton instance
export const apiService = new ApiService();
export default apiService;
