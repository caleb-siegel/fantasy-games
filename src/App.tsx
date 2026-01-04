import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { LeagueMembershipProvider } from "@/hooks/useLeagueMembership";
import { LeagueContextProvider } from "@/hooks/useLeagueContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthLoader } from "@/components/AuthLoader";
import Landing from "./pages/Landing";
import Betting from "./pages/Betting";
import BettingReview from "./pages/BettingReview";
import Leagues from "./pages/Leagues";
import LeaguePage from "./pages/LeaguePage";
import LeagueSettings from "./pages/LeagueSettings";
import WeeklyMatchup from "./pages/WeeklyMatchup";
import Standings from "./pages/Standings";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import AuthForm from "./components/AuthForm";
import { PlayerProfile } from "./components/profiles/PlayerProfile";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { loading } = useAuth();

  if (loading) {
    return <AuthLoader message="Checking authentication..." />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<AuthForm />} />
        {/* Redirect standalone betting/standings to leagues page */}
        <Route path="/betting" element={<Navigate to="/leagues" replace />} />
        <Route path="/standings" element={<Navigate to="/leagues" replace />} />
        <Route path="/leagues" element={<ProtectedRoute requireLeague={false}><Leagues /></ProtectedRoute>} />
        <Route path="/leagues/:leagueId" element={
          <LeagueContextProvider>
            <ProtectedRoute requireLeague={true}><LeaguePage /></ProtectedRoute>
          </LeagueContextProvider>
        } />
        <Route path="/leagues/:leagueId/settings" element={
          <LeagueContextProvider>
            <ProtectedRoute requireLeague={true}><LeagueSettings /></ProtectedRoute>
          </LeagueContextProvider>
        } />
        <Route path="/leagues/:leagueId/matchup" element={
          <LeagueContextProvider>
            <ProtectedRoute requireLeague={true}><WeeklyMatchup /></ProtectedRoute>
          </LeagueContextProvider>
        } />
        <Route path="/leagues/:leagueId/betting-review" element={
          <LeagueContextProvider>
            <ProtectedRoute requireLeague={true}><BettingReview /></ProtectedRoute>
          </LeagueContextProvider>
        } />
        <Route path="/leagues/:leagueId/players/:userId" element={
          <LeagueContextProvider>
            <ProtectedRoute requireLeague={true}><PlayerProfile /></ProtectedRoute>
          </LeagueContextProvider>
        } />
        <Route path="/profile" element={<ProtectedRoute requireLeague={false}><Profile /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute requireLeague={false}><Admin /></ProtectedRoute>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LeagueMembershipProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </TooltipProvider>
      </LeagueMembershipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
