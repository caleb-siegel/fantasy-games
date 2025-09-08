import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Betting from "./pages/Betting";
import Leagues from "./pages/Leagues";
import LeagueSettings from "./pages/LeagueSettings";
import WeeklyMatchup from "./pages/WeeklyMatchup";
import Standings from "./pages/Standings";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import AuthForm from "./components/AuthForm";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<AuthForm />} />
            <Route path="/betting" element={<ProtectedRoute><Betting /></ProtectedRoute>} />
            <Route path="/leagues" element={<ProtectedRoute><Leagues /></ProtectedRoute>} />
            <Route path="/leagues/:leagueId/settings" element={<ProtectedRoute><LeagueSettings /></ProtectedRoute>} />
            <Route path="/leagues/:leagueId/matchup" element={<ProtectedRoute><WeeklyMatchup /></ProtectedRoute>} />
            <Route path="/standings" element={<ProtectedRoute><Standings /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
