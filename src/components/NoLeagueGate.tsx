import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Trophy, TrendingUp, Calendar, Settings } from "lucide-react";
import { CreateLeagueDialog } from "@/components/CreateLeagueDialog";
import { JoinLeagueDialog } from "@/components/JoinLeagueDialog";
import { useState } from "react";
import { useLeagueMembership } from "@/hooks/useLeagueMembership";

export function NoLeagueGate() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const { refreshLeagues } = useLeagueMembership();

  const handleLeagueCreated = () => {
    setCreateDialogOpen(false);
    refreshLeagues();
  };

  const handleLeagueJoined = () => {
    setJoinDialogOpen(false);
    refreshLeagues();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
            <Trophy className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Welcome to Fantasy Betting!</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            You're all set up! Now join or create a league to start placing bets and competing with friends.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {/* Create League Card */}
          <Card className="hover:shadow-lg transition-all duration-300 border-2 border-primary/20">
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Plus className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Create Your League</CardTitle>
              <CardDescription className="text-lg">
                Start your own fantasy betting league and invite friends to join
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Set up your league name and settings</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Generate invite code for members</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Manage league settings and matchups</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Track standings and results</span>
                </div>
              </div>
              
              <div className="bg-primary/5 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    <Settings className="w-3 h-3 mr-1" />
                    Commissioner
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  As commissioner, you'll have full control over league settings and can manage the season schedule.
                </p>
              </div>
              
              <Button 
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                size="lg"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="w-5 h-5 mr-2" />
                Create League
              </Button>
            </CardContent>
          </Card>

          {/* Join League Card */}
          <Card className="hover:shadow-lg transition-all duration-300 border-2 border-success/20">
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-4">
                <Users className="w-8 h-8 text-success" />
              </div>
              <CardTitle className="text-2xl">Join a League</CardTitle>
              <CardDescription className="text-lg">
                Enter an invite code to join a league created by someone else
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span>Enter 8-character invite code</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span>Join instantly if code is valid</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span>Start betting immediately</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span>Compete with league members</span>
                </div>
              </div>
              
              <div className="bg-success/5 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    Member
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  As a member, you can place bets, view standings, and compete in weekly matchups.
                </p>
              </div>
              
              <Button 
                variant="outline"
                className="w-full border-success text-success hover:bg-success hover:text-white"
                size="lg"
                onClick={() => setJoinDialogOpen(true)}
              >
                <Users className="w-5 h-5 mr-2" />
                Join League
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* How It Works Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">How Fantasy Betting Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardHeader>
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-2">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Weekly Matchups</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Each week you're matched against another league member in head-to-head competition.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <div className="inline-flex items-center justify-center w-12 h-12 bg-success/10 rounded-full mb-2">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <CardTitle className="text-lg">$100 Weekly Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Every week you get $100 to place moneyline bets on real NFL games. Use it wisely!
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <div className="inline-flex items-center justify-center w-12 h-12 bg-warning/10 rounded-full mb-2">
                  <Trophy className="w-6 h-6 text-warning" />
                </div>
                <CardTitle className="text-lg">Win Your Matchup</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  The player with more money after the week's bets wins the matchup and improves their record.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Dialogs */}
      <CreateLeagueDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onLeagueCreated={handleLeagueCreated}
      />
      <JoinLeagueDialog
        open={joinDialogOpen}
        onOpenChange={setJoinDialogOpen}
        onLeagueJoined={handleLeagueJoined}
      />
    </div>
  );
}
