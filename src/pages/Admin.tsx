import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Navigation } from '@/components/ui/navigation';
import { Loader2, CheckCircle2, XCircle, Search, Trophy, Gamepad2, Target, Eye } from 'lucide-react';

export default function Admin() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [week, setWeek] = useState<number | undefined>(undefined);
  const [results, setResults] = useState<Record<string, any>>({});
  const [previewDialog, setPreviewDialog] = useState<{
    open: boolean;
    action: string;
    previewData: any;
    actionKey: string;
  }>({
    open: false,
    action: '',
    previewData: null,
    actionKey: ''
  });

  // Check if user is admin (caleb siegel)
  const isAdmin = user && (
    (user.username?.toLowerCase().includes('caleb') && user.username?.toLowerCase().includes('siegel')) ||
    (user.email?.toLowerCase().includes('caleb') && user.email?.toLowerCase().includes('siegel'))
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>You do not have permission to access this page.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const handlePreview = async (actionKey: string, apiCall: (dryRun: boolean) => Promise<any>) => {
    setLoading(`preview-${actionKey}`);
    
    try {
      const previewResult = await apiCall(true); // dry_run = true
      
      if (previewResult.success) {
        setPreviewDialog({
          open: true,
          action: actionKey,
          previewData: previewResult,
          actionKey: actionKey
        });
      } else {
        toast.error(previewResult.message || 'Failed to get preview');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to get preview');
    } finally {
      setLoading(null);
    }
  };

  const handleConfirm = async () => {
    const { actionKey, previewData } = previewDialog;
    setPreviewDialog({ open: false, action: '', previewData: null, actionKey: '' });
    setLoading(actionKey);
    setResults(prev => ({ ...prev, [actionKey]: null }));
    
    try {
      let result;
      switch (actionKey) {
        case 'evaluateBets':
          result = await apiService.adminEvaluateBets(false);
          break;
        case 'evaluateMatchups':
          result = await apiService.adminEvaluateMatchups(false);
          break;
        case 'findGames':
          result = await apiService.adminFindGames(week, false);
          break;
        case 'findBets':
          result = await apiService.adminFindBets(week, false);
          break;
        default:
          throw new Error('Unknown action');
      }
      
      setResults(prev => ({ ...prev, [actionKey]: result }));
      toast.success(result.message || 'Action completed successfully');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to complete action';
      setResults(prev => ({ ...prev, [actionKey]: { success: false, error: errorMessage } }));
      toast.error(errorMessage);
    } finally {
      setLoading(null);
    }
  };

  const handleEvaluateBets = () => {
    handlePreview('evaluateBets', (dryRun) => apiService.adminEvaluateBets(dryRun));
  };

  const handleEvaluateMatchups = () => {
    handlePreview('evaluateMatchups', (dryRun) => apiService.adminEvaluateMatchups(dryRun));
  };

  const handleFindGames = () => {
    handlePreview('findGames', (dryRun) => apiService.adminFindGames(week, dryRun));
  };

  const handleFindBets = () => {
    handlePreview('findBets', (dryRun) => apiService.adminFindBets(week, dryRun));
  };

  const ActionCard = ({ 
    title, 
    description, 
    icon: Icon, 
    action, 
    actionKey,
    color = "default"
  }: {
    title: string;
    description: string;
    icon: any;
    action: () => void;
    actionKey: string;
    color?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  }) => {
    const isLoading = loading === actionKey;
    const result = results[actionKey];

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            <CardTitle>{title}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={action} 
            disabled={isLoading}
            variant={color}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isLoading.startsWith('preview-') ? 'Getting Preview...' : 'Processing...'}
              </>
            ) : (
              <>
                <Icon className="mr-2 h-4 w-4" />
                {title}
              </>
            )}
          </Button>
          
          {result && (
            <div className={`p-3 rounded-md text-sm ${
              result.success 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-start gap-2">
                {result.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{result.message || (result.success ? 'Success' : 'Error')}</p>
                  {result.error && (
                    <p className="text-red-600 dark:text-red-400 mt-1">{result.error}</p>
                  )}
                  {result.success && (
                    <div className="mt-2 space-y-1 text-xs">
                      {result.bets_evaluated !== undefined && (
                        <div className="space-y-1">
                          <p>Evaluated: {result.bets_evaluated} | Won: {result.bets_won} | Lost: {result.bets_lost} | Pending: {result.bets_pending}</p>
                          {result.parlay_legs_evaluated !== undefined && (
                            <p>Parlay legs: {result.parlay_legs_evaluated} evaluated ({result.parlay_legs_won} won, {result.parlay_legs_lost} lost)</p>
                          )}
                          {result.total_payouts !== undefined && (
                            <p>Total payouts: ${result.total_payouts.toFixed(2)}</p>
                          )}
                        </div>
                      )}
                      {result.matchups_finalized !== undefined && (
                        <p>Finalized: {result.matchups_finalized} matchups | Updated: {result.standings_updated} standings</p>
                      )}
                      {result.new_games !== undefined && (
                        <p>Games: {result.games_before} → {result.games_after} ({result.new_games} new)</p>
                      )}
                      {result.new_options !== undefined && (
                        <p>
                          Options: {result.options_before} → {result.options_after} ({result.new_options} new) | 
                          Player Props: {result.player_props_before} → {result.player_props_after} ({result.new_player_props} new)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage week rollover processes separately for more flexibility
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Week Selection (Optional)</CardTitle>
            <CardDescription>
              Leave empty to use current week, or specify a week number
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="week">Week Number</Label>
                <Input
                  id="week"
                  type="number"
                  min="1"
                  max="22"
                  placeholder="Current week"
                  value={week || ''}
                  onChange={(e) => setWeek(e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <ActionCard
            title="Evaluate Bets"
            description="Evaluate all pending bets across all weeks. Updates bet statuses, outcomes, and payouts."
            icon={Target}
            action={handleEvaluateBets}
            actionKey="evaluateBets"
            color="default"
          />

          <ActionCard
            title="Evaluate Matchups"
            description="Finalize all unresolved matchups and update league standings. Processes all weeks with pending matchups."
            icon={Trophy}
            action={handleEvaluateMatchups}
            actionKey="evaluateMatchups"
            color="default"
          />

          <ActionCard
            title="Find New Games"
            description={`Find and add new games for ${week ? `Week ${week}` : 'the current week'}. Fetches games from the odds API.`}
            icon={Gamepad2}
            action={handleFindGames}
            actionKey="findGames"
            color="outline"
          />

          <ActionCard
            title="Find New Bets"
            description={`Find and add new betting options (especially player props) for ${week ? `Week ${week}` : 'the current week'}.`}
            icon={Search}
            action={handleFindBets}
            actionKey="findBets"
            color="outline"
          />
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Usage Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• <strong>Evaluate Bets:</strong> Run this after games have finished to update bet outcomes</p>
            <p>• <strong>Evaluate Matchups:</strong> Run this after evaluating bets to finalize matchups and update standings</p>
            <p>• <strong>Find New Games:</strong> Run this when a new week starts to fetch all games for that week</p>
            <p>• <strong>Find New Bets:</strong> Run this to add player props and other betting options that may not have been available initially (e.g., Monday game props)</p>
            <p>• You can run these actions independently and in any order as needed</p>
            <p>• Specify a week number above to target a specific week, or leave empty to use the current week</p>
          </CardContent>
        </Card>
      </div>

      {/* Preview/Confirmation Dialog */}
      <Dialog open={previewDialog.open} onOpenChange={(open) => !open && setPreviewDialog({ open: false, action: '', previewData: null, actionKey: '' })}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview Changes
            </DialogTitle>
            <DialogDescription>
              Review what will happen before committing changes to the database
            </DialogDescription>
          </DialogHeader>
          
          {previewDialog.previewData && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  {previewDialog.previewData.message}
                </p>
                
                <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  {previewDialog.actionKey === 'evaluateBets' && (
                    <>
                      {previewDialog.previewData.pending_bets !== undefined && (
                        <p>• Pending bets to evaluate: {previewDialog.previewData.pending_bets}</p>
                      )}
                      {previewDialog.previewData.pending_parlays !== undefined && (
                        <p>• Pending parlays to evaluate: {previewDialog.previewData.pending_parlays}</p>
                      )}
                      {previewDialog.previewData.bets_evaluated !== undefined && (
                        <div className="mt-3 pt-3 border-t border-blue-300 dark:border-blue-700">
                          <p className="font-medium mb-2">Bet Outcomes:</p>
                          <p>• Bets evaluated: {previewDialog.previewData.bets_evaluated}</p>
                          <p className="text-green-700 dark:text-green-300">• Bets that would WIN: {previewDialog.previewData.bets_won || 0}</p>
                          <p className="text-red-700 dark:text-red-300">• Bets that would LOSE: {previewDialog.previewData.bets_lost || 0}</p>
                        </div>
                      )}
                      {previewDialog.previewData.parlay_legs_evaluated !== undefined && (
                        <div className="mt-3 pt-3 border-t border-blue-300 dark:border-blue-700">
                          <p className="font-medium mb-2">Parlay Leg Outcomes:</p>
                          <p>• Parlay legs evaluated: {previewDialog.previewData.parlay_legs_evaluated}</p>
                          <p className="text-green-700 dark:text-green-300">• Parlay legs that would WIN: {previewDialog.previewData.parlay_legs_won || 0}</p>
                          <p className="text-red-700 dark:text-red-300">• Parlay legs that would LOSE: {previewDialog.previewData.parlay_legs_lost || 0}</p>
                        </div>
                      )}
                      {previewDialog.previewData.parlays_evaluated !== undefined && (
                        <div className="mt-3 pt-3 border-t border-blue-300 dark:border-blue-700">
                          <p className="font-medium mb-2">Parlay Outcomes:</p>
                          <p>• Parlays evaluated: {previewDialog.previewData.parlays_evaluated}</p>
                          {previewDialog.previewData.parlays_won !== undefined && (
                            <p className="text-green-700 dark:text-green-300">• Parlays that would WIN: {previewDialog.previewData.parlays_won}</p>
                          )}
                          {previewDialog.previewData.parlays_lost !== undefined && (
                            <p className="text-red-700 dark:text-red-300">• Parlays that would LOSE: {previewDialog.previewData.parlays_lost}</p>
                          )}
                        </div>
                      )}
                      {previewDialog.previewData.total_payouts !== undefined && (
                        <p className="mt-2 font-medium">• Total payouts: ${previewDialog.previewData.total_payouts.toFixed(2)}</p>
                      )}
                    </>
                  )}
                  
                  {previewDialog.actionKey === 'evaluateMatchups' && (
                    <>
                      {previewDialog.previewData.unresolved_matchups !== undefined && (
                        <p>• Unresolved matchups: {previewDialog.previewData.unresolved_matchups}</p>
                      )}
                      {previewDialog.previewData.weeks_affected && (
                        <p>• Weeks affected: {previewDialog.previewData.weeks_affected.join(', ')}</p>
                      )}
                      {previewDialog.previewData.matchups_by_week && (
                        <div className="mt-2">
                          <p className="font-medium">Matchups by week:</p>
                          {Object.entries(previewDialog.previewData.matchups_by_week).map(([week, count]) => (
                            <p key={week} className="ml-4">• Week {week}: {count} matchups</p>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  
                  {previewDialog.actionKey === 'findGames' && (
                    <>
                      <p>• Current games in database: {previewDialog.previewData.games_before}</p>
                      {previewDialog.previewData.games_found_in_api !== undefined && (
                        <p>• Games found in API: {previewDialog.previewData.games_found_in_api}</p>
                      )}
                      {previewDialog.previewData.new_games_estimated !== undefined && (
                        <p>• Estimated new games: {previewDialog.previewData.new_games_estimated}</p>
                      )}
                    </>
                  )}
                  
                  {previewDialog.actionKey === 'findBets' && (
                    <>
                      <p>• Current betting options: {previewDialog.previewData.options_before}</p>
                      <p>• Current player props: {previewDialog.previewData.player_props_before}</p>
                      {previewDialog.previewData.estimated_options_in_api !== undefined && (
                        <p>• Estimated options in API: {previewDialog.previewData.estimated_options_in_api}</p>
                      )}
                      {previewDialog.previewData.estimated_player_props_in_api !== undefined && (
                        <p>• Estimated player props in API: {previewDialog.previewData.estimated_player_props_in_api}</p>
                      )}
                      {previewDialog.previewData.estimated_new_options !== undefined && (
                        <p>• Estimated new options: {previewDialog.previewData.estimated_new_options}</p>
                      )}
                      {previewDialog.previewData.estimated_new_player_props !== undefined && (
                        <p>• Estimated new player props: {previewDialog.previewData.estimated_new_player_props}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> This is a preview. No changes have been made to the database yet. Click "Confirm & Execute" to proceed, or "Cancel" to abort.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setPreviewDialog({ open: false, action: '', previewData: null, actionKey: '' })}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={loading === previewDialog.actionKey}
            >
              {loading === previewDialog.actionKey ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executing...
                </>
              ) : (
                'Confirm & Execute'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

