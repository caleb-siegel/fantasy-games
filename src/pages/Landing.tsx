import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, Trophy, DollarSign, Star, Shield, Zap, Link as LinkIcon } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import heroImage from "@/assets/hero-betting.jpg"

export default function Landing() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const features = [
    {
      icon: DollarSign,
      title: "Weekly $100 Budget",
      description: "Every user starts fresh each week with $100 virtual money - no carryover, completely fair"
    },
    {
      icon: TrendingUp,
      title: "Real NFL Betting",
      description: "Bet on actual NFL games with real odds - moneylines, spreads, totals, and parlays"
    },
    {
      icon: Users,
      title: "Head-to-Head Matchups",
      description: "Compete directly against league members each week - highest balance wins"
    },
    {
      icon: Trophy,
      title: "Season Championships",
      description: "Regular season standings lead to playoffs and crowning a league champion"
    }
  ]

  const benefits = [
    {
      icon: Star,
      title: "No Draft Stress",
      description: "Skip the draft anxiety - focus on what you love: analyzing games and making picks"
    },
    {
      icon: Shield,
      title: "100% Skill Based",
      description: "Your betting strategy determines success, not random player injuries or coaching decisions"
    },
    {
      icon: Zap,
      title: "Weekly Fresh Start",
      description: "Bad week? No problem! Everyone gets the same budget next week"
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Sign In Banner for Unauthenticated Users */}
      {!isAuthenticated && (
        <div className="bg-primary text-primary-foreground py-3">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm">
              Ready to start betting? 
              <Button 
                variant="secondary" 
                size="sm" 
                className="ml-2"
                onClick={() => navigate('/auth')}
              >
                Sign In or Create Account
              </Button>
            </p>
          </div>
        </div>
      )}
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/80" />
        
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20" variant="outline">
              The Future of Fantasy Football
            </Badge>
            
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Fantasy Football
              <span className="block text-primary">Meets Sports Betting</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Skip the draft. Start with $100 each week. Bet on real NFL games. 
              Compete head-to-head. Crown a champion.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <>
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90 text-lg px-8"
                    onClick={() => navigate('/leagues')}
                  >
                    Go to My Leagues
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="text-lg px-8"
                    onClick={() => navigate('/betting')}
                  >
                    Place Bets
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90 text-lg px-8"
                    onClick={() => navigate('/auth')}
                  >
                    Sign Up Now
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="text-lg px-8"
                    onClick={() => navigate('/auth')}
                  >
                    Sign In
                  </Button>
                </>
              )}
            </div>

            <div className="flex items-center justify-center space-x-8 mt-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>8-12 Players</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4" />
                <span>$100/Week</span>
              </div>
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4" />
                <span>17 Week Season</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-card/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to revolutionize your fantasy football experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-success rounded-full flex items-center justify-center text-2xl font-bold text-primary-foreground mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4">Get Your Weekly Budget</h3>
              <p className="text-muted-foreground">
                Every Monday, all players receive $100 in virtual money. No carryover, everyone starts equal.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-success rounded-full flex items-center justify-center text-2xl font-bold text-primary-foreground mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4">Bet on NFL Games</h3>
              <p className="text-muted-foreground">
                Place bets on real NFL games throughout the week. Moneylines, spreads, totals, and parlays available.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-success rounded-full flex items-center justify-center text-2xl font-bold text-primary-foreground mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4">Win Your Matchup</h3>
              <p className="text-muted-foreground">
                Compete head-to-head each week. Player with the highest balance after all games wins the matchup.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Game-Changing Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need for the most exciting fantasy football experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-card to-card/50">
                  <CardHeader>
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-success/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-card/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Why Choose Fantasy Betting League?</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-success/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto text-center bg-gradient-to-br from-primary/5 to-success/5 border-primary/20">
            <CardHeader className="pb-6">
              <CardTitle className="text-3xl lg:text-4xl font-bold mb-4">
                Ready to Revolutionize Your Fantasy Experience?
              </CardTitle>
              <CardDescription className="text-lg">
                Join thousands of players who've already made the switch to skill-based fantasy football
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isAuthenticated ? (
                  <>
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90 text-lg px-8"
                      onClick={() => navigate('/leagues')}
                    >
                      View My Leagues
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="text-lg px-8"
                      onClick={() => navigate('/betting')}
                    >
                      Start Betting
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90 text-lg px-8"
                      onClick={() => navigate('/auth')}
                    >
                      Get Started - Sign Up
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="text-lg px-8"
                      onClick={() => navigate('/auth')}
                    >
                      Sign In
                    </Button>
                  </>
                )}
              </div>
              
              <div className="mt-8 pt-8 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Free to create • No real money involved • NFL season starts soon
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}