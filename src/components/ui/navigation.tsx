import { Button } from "@/components/ui/button"
import { TrendingUp, Users, Trophy, BarChart3, LogOut } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useLeagueMembership } from "@/hooks/useLeagueMembership"

export function Navigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()
  const { hasLeagues } = useLeagueMembership()
  
  // Navigation items - only show core navigation, league-specific actions are within league pages
  const navItems = [
    { path: "/", label: "Home", icon: TrendingUp },
    { path: "/leagues", label: "My Leagues", icon: Users },
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
            {isAuthenticated ? (
              <>
                <div className="hidden sm:block text-sm text-muted-foreground">
                  Welcome, <span className="text-primary font-semibold">{user?.username}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
                  Profile
                </Button>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}