import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, TrendingUp, TrendingDown, Minus, User } from 'lucide-react';
import { apiService } from '@/services/api';
import { useNavigate } from 'react-router-dom';

interface ComprehensiveStanding {
  id: number;
  league_id: number;
  user_id: number;
  username: string;
  wins: number;
  losses: number;
  points_for: number;
  points_against: number;
  joined_at: string;
  rank: number;
  win_percentage: number;
  // Additional calculated fields
  avg_money_per_week: number;
  money_earned_total: number;
  money_against: number;
  current_streak: number;
  longest_win_streak: number;
  longest_loss_streak: number;
  bets_won: number;
  bets_lost: number;
  bets_pending: number;
  total_bets_placed: number;
  win_streak_type: 'win' | 'loss' | 'none';
}

interface ComprehensiveStandingsProps {
  leagueId: number;
}

export function ComprehensiveStandings({ leagueId }: ComprehensiveStandingsProps) {
  const navigate = useNavigate();
  const [standings, setStandings] = useState<ComprehensiveStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadStandings();
  }, [leagueId]);

  const loadStandings = async () => {
    try {
      setLoading(true);
      // Use the comprehensive standings API
      const response: any = await apiService.getComprehensiveStandings(leagueId);
      setStandings(response.standings);
    } catch (error) {
      console.error('Failed to load standings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const sortedStandings = [...standings].sort((a, b) => {
    let aValue = a[sortBy as keyof ComprehensiveStanding];
    let bValue = b[sortBy as keyof ComprehensiveStanding];
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = (bValue as string).toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const exportToCSV = () => {
    const headers = [
      'Rank', 'Player', 'Record', 'Win %', 'Money Earned', 'Avg/Week', 
      'Points Against', 'Current Streak', 'Longest Win Streak', 'Bets Won', 'Bets Lost'
    ];
    
    const csvData = sortedStandings.map(standing => [
      standing.rank,
      standing.username,
      `${standing.wins}-${standing.losses}`,
      `${standing.win_percentage.toFixed(1)}%`,
      `$${standing.money_earned_total.toFixed(2)}`,
      `$${standing.avg_money_per_week.toFixed(2)}`,
      `$${standing.points_against.toFixed(2)}`,
      `${standing.current_streak} ${standing.win_streak_type}`,
      standing.longest_win_streak,
      standing.bets_won,
      standing.bets_lost
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `league-${leagueId}-standings.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStreakIcon = (streakType: string) => {
    switch (streakType) {
      case 'win':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'loss':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500">1st</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400">2nd</Badge>;
    if (rank === 3) return <Badge className="bg-orange-600">3rd</Badge>;
    return <Badge variant="outline">{rank}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  if (standings.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No standings data available for this league.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <CardTitle>League Standings</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rank">Rank</SelectItem>
                <SelectItem value="wins">Wins</SelectItem>
                <SelectItem value="money_earned_total">Money Earned</SelectItem>
                <SelectItem value="avg_money_per_week">Avg per Week</SelectItem>
                <SelectItem value="win_percentage">Win Percentage</SelectItem>
                <SelectItem value="current_streak">Current Streak</SelectItem>
                <SelectItem value="bets_won">Bets Won</SelectItem>
                <SelectItem value="points_against">Money Against</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 sticky left-0 bg-background z-10"
                  onClick={() => handleSort('rank')}
                >
                  Rank
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 sticky left-12 bg-background z-10"
                  onClick={() => handleSort('username')}
                >
                  Player
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('wins')}
                >
                  <span className="hidden sm:inline">Record</span>
                  <span className="sm:hidden">W-L</span>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('win_percentage')}
                >
                  <span className="hidden md:inline">Win %</span>
                  <span className="md:hidden">%</span>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('money_earned_total')}
                >
                  <span className="hidden lg:inline">Money Earned</span>
                  <span className="lg:hidden">Earned</span>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 hidden lg:table-cell"
                  onClick={() => handleSort('avg_money_per_week')}
                >
                  Avg/Week
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 hidden xl:table-cell"
                  onClick={() => handleSort('points_against')}
                >
                  Against
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('current_streak')}
                >
                  <span className="hidden sm:inline">Streak</span>
                  <span className="sm:hidden">Str</span>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 hidden md:table-cell"
                  onClick={() => handleSort('bets_won')}
                >
                  Won
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 hidden md:table-cell"
                  onClick={() => handleSort('bets_lost')}
                >
                  Lost
                </TableHead>
                <TableHead className="sticky right-0 bg-background z-10">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStandings.map((standing) => (
                <TableRow key={standing.id}>
                  <TableCell className="sticky left-0 bg-background z-10">
                    {getRankBadge(standing.rank)}
                  </TableCell>
                  <TableCell className="sticky left-12 bg-background z-10">
                    <div className="flex items-center gap-2 lg:gap-3">
                      <Avatar className="h-6 w-6 lg:h-8 lg:w-8">
                        <AvatarFallback className="text-xs lg:text-sm">
                          {standing.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm lg:text-base truncate max-w-20 lg:max-w-none">
                        {standing.username}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-sm lg:text-base">
                      {standing.wins}-{standing.losses}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm lg:text-base">
                      {standing.win_percentage.toFixed(1)}%
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-green-600 text-sm lg:text-base">
                      ${standing.money_earned_total.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="text-sm">
                      ${standing.avg_money_per_week.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <div className="text-sm text-red-600">
                      ${standing.points_against.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 lg:gap-2">
                      {getStreakIcon(standing.win_streak_type)}
                      <span className="font-medium text-sm lg:text-base">
                        {standing.current_streak}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="text-green-600 font-medium text-sm lg:text-base">
                      {standing.bets_won}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="text-red-600 font-medium text-sm lg:text-base">
                      {standing.bets_lost}
                    </div>
                  </TableCell>
                  <TableCell className="sticky right-0 bg-background z-10">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/leagues/${leagueId}/players/${standing.user_id}`)}
                      className="text-xs lg:text-sm px-2 lg:px-3"
                    >
                      <User className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                      <span className="hidden sm:inline">Profile</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
