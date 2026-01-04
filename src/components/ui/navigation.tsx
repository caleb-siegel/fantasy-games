import { Button } from "@/components/ui/button"
import { TrendingUp, Users, Trophy, BarChart3, LogOut, ChevronRight, Home, Settings, User, Target, Calendar, MoreHorizontal, Shield } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useLeagueMembership } from "@/hooks/useLeagueMembership"
import { useLeagueContext } from "@/hooks/useLeagueContext"
import { useEffect, useState } from "react"
import React from "react"

export function Navigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()
  const { hasLeagues } = useLeagueMembership()
  const [isBreadcrumbsExpanded, setIsBreadcrumbsExpanded] = useState(false)
  
  // Safely get league context - it might not be available on all pages
  let currentLeague = null;
  let currentUser = null;
  
  try {
    const leagueContext = useLeagueContext();
    currentLeague = leagueContext.currentLeague;
    currentUser = leagueContext.currentUser;
  } catch (error) {
    // LeagueContext not available on this page (e.g., /leagues page)
  }
  
  // Navigation items - only show core navigation, league-specific actions are within league pages
  const navItems = [
    { path: "/", label: "Home", icon: TrendingUp },
    { path: "/leagues", label: "My Leagues", icon: Users },
  ]

  // Generate breadcrumbs based on current route
  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const breadcrumbs = []

    // Always start with Home
    breadcrumbs.push({
      label: "Home",
      path: "/",
      icon: Home
    })

    // Add Leagues if we're in league context
    if (pathSegments[0] === 'leagues') {
      breadcrumbs.push({
        label: "Leagues",
        path: "/leagues",
        icon: Users
      })

      // Add current league if we have league context
      if (currentLeague && pathSegments[1]) {
        breadcrumbs.push({
          label: currentLeague.name,
          path: `/leagues/${currentLeague.id}`,
          icon: Trophy
        })
      } else if (pathSegments[1]) {
        // Fallback: show league ID if we don't have league data yet
        breadcrumbs.push({
          label: `League ${pathSegments[1]}`,
          path: `/leagues/${pathSegments[1]}`,
          icon: Trophy
        })
      }

      // Add sub-pages based on route (runs regardless of league data availability)
      if (pathSegments[2] === 'settings') {
        breadcrumbs.push({
          label: "Settings",
          path: `/leagues/${currentLeague?.id || pathSegments[1]}/settings`,
          icon: Settings
        })
      } else if (pathSegments[2] === 'matchup') {
        breadcrumbs.push({
          label: "Matchup",
          path: `/leagues/${currentLeague?.id || pathSegments[1]}/matchup`,
          icon: Calendar
        })
      } else if (pathSegments[2] === 'betting-review') {
        breadcrumbs.push({
          label: "Betting Review",
          path: `/leagues/${currentLeague?.id || pathSegments[1]}/betting-review`,
          icon: Target
        })
      } else if (pathSegments[2] === 'players' && pathSegments[3]) {
        if (currentUser) {
          breadcrumbs.push({
            label: `${currentUser.username}'s Profile`,
            path: location.pathname,
            icon: User
          })
        } else {
          breadcrumbs.push({
            label: `User ${pathSegments[3]}'s Profile`,
            path: location.pathname,
            icon: User
          })
        }
      }
    } else if (pathSegments[0] === 'profile') {
      breadcrumbs.push({
        label: "Profile",
        path: "/profile",
        icon: User
      })
    } else if (pathSegments[0] === 'admin') {
      breadcrumbs.push({
        label: "Admin",
        path: "/admin",
        icon: Shield
      })
    }

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  // Check if user is admin (caleb siegel)
  const isAdmin = user && (
    (user.username?.toLowerCase().includes('caleb') && user.username?.toLowerCase().includes('siegel')) ||
    (user.email?.toLowerCase().includes('caleb') && user.email?.toLowerCase().includes('siegel'))
  )

  return (
    <>
      {/* Main Navigation */}
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
                  {isAdmin && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate('/admin')}
                    >
                      <Shield className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">Admin</span>
                    </Button>
                  )}
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

      {/* Sticky Breadcrumbs */}
      {breadcrumbs.length > 1 && (
        <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-16 z-30">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 py-2 text-sm">
              {/* Mobile: Show first + last breadcrumb with expand button */}
              <div className="flex items-center gap-2 md:hidden">
                {/* First breadcrumb */}
                <Link
                  to={breadcrumbs[0].path}
                  className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setIsBreadcrumbsExpanded(!isBreadcrumbsExpanded)}
                >
                  {React.createElement(breadcrumbs[0].icon, { className: "h-4 w-4" })}
                  <span className="hidden sm:inline">{breadcrumbs[0].label}</span>
                </Link>
                
                {/* Expand button if there are middle breadcrumbs */}
                {breadcrumbs.length > 2 && (
                  <>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-muted-foreground hover:text-primary"
                      onClick={() => setIsBreadcrumbsExpanded(!isBreadcrumbsExpanded)}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </>
                )}
                
                {/* Last breadcrumb */}
                <Link
                  to={breadcrumbs[breadcrumbs.length - 1].path}
                  className="flex items-center gap-1 text-primary font-medium"
                  onClick={() => setIsBreadcrumbsExpanded(!isBreadcrumbsExpanded)}
                >
                  {React.createElement(breadcrumbs[breadcrumbs.length - 1].icon, { className: "h-4 w-4" })}
                  <span>{breadcrumbs[breadcrumbs.length - 1].label}</span>
                </Link>
              </div>

              {/* Desktop: Show all breadcrumbs */}
              <div className="hidden md:flex items-center gap-2">
                {breadcrumbs.map((breadcrumb, index) => {
                  const Icon = breadcrumb.icon
                  const isLast = index === breadcrumbs.length - 1
                  
                  return (
                    <div key={breadcrumb.path} className="flex items-center gap-2">
                      {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      <Link
                        to={breadcrumb.path}
                        className={`flex items-center gap-1 transition-colors ${
                          isLast 
                            ? 'text-primary font-medium' 
                            : 'text-muted-foreground hover:text-primary'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{breadcrumb.label}</span>
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Mobile: Expanded breadcrumbs dropdown */}
            {isBreadcrumbsExpanded && (
              <div className="md:hidden border-t border-border bg-card/80 backdrop-blur-sm">
                <div className="py-2 space-y-1">
                  {breadcrumbs.map((breadcrumb, index) => {
                    const isLast = index === breadcrumbs.length - 1
                    return (
                      <Link
                        key={breadcrumb.path}
                        to={breadcrumb.path}
                        className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                          isLast 
                            ? 'text-primary font-medium hover:bg-accent/50' 
                            : 'text-muted-foreground hover:text-primary hover:bg-accent/50'
                        }`}
                        onClick={() => setIsBreadcrumbsExpanded(false)}
                      >
                        {React.createElement(breadcrumb.icon, { className: "h-4 w-4" })}
                        <span>{breadcrumb.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}