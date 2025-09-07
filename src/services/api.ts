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
    return this.request<{ league: any }>(`/api/leagues/${leagueId}`);
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
  async getWeeklyOdds(week: number) {
    return this.request<{ odds: any[] }>(`/api/bets/odds/week/${week}`);
  }

  async placeBet(data: {
    matchup_id: number;
    game_id: string;
    team: string;
    amount: number;
  }) {
    return this.request<{
      message: string;
      bet: any;
    }>('/api/bets', {
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

  async getUserBets(week: number) {
    return this.request<{
      bets: any[];
      total_bet_amount: number;
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
}

// Create and export a singleton instance
export const apiService = new ApiService();
export default apiService;
