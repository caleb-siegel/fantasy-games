import { Button } from "@/components/ui/button"
import { TrendingUp, Users, Trophy, BarChart3 } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

export function Navigation() {
  const location = useLocation()
  
  const navItems = [
    { path: "/", label: "Home", icon: TrendingUp },
    { path: "/leagues", label: "My Leagues", icon: Users },
    { path: "/betting", label: "Place Bets", icon: BarChart3 },
    { path: "/standings", label: "Standings", icon: Trophy },
  ]

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold text-primary">
              FantasyBet League
            </Link>
            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link key={item.path} to={item.path}>
                    <Button 
                      variant={isActive ? "default" : "ghost"} 
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-sm text-muted-foreground">
              Week 1 • Balance: <span className="text-success font-semibold">$85.50</span>
            </div>
            <Button variant="outline" size="sm">
              Profile
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}