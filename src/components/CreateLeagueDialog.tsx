import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus } from "lucide-react"
import { apiService } from "@/services/api"
import { useToast } from "@/hooks/use-toast"

interface CreateLeagueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLeagueCreated: () => void
}

export function CreateLeagueDialog({ open, onOpenChange, onLeagueCreated }: CreateLeagueDialogProps) {
  const [leagueName, setLeagueName] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleCreateLeague = async () => {
    if (!leagueName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a league name",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const response = await apiService.createLeague({ name: leagueName.trim() })
      
      toast({
        title: "Success!",
        description: `League "${response.league.name}" created successfully!`,
      })

      setLeagueName("")
      onOpenChange(false)
      onLeagueCreated()
    } catch (error) {
      console.error('Failed to create league:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create league",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setLeagueName("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Create New League</span>
          </DialogTitle>
          <DialogDescription>
            Create a new fantasy betting league and invite friends to join using the generated invite code.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="league-name" className="text-right">
              League Name
            </Label>
            <Input
              id="league-name"
              value={leagueName}
              onChange={(e) => setLeagueName(e.target.value)}
              placeholder="Enter league name"
              className="col-span-3"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) {
                  handleCreateLeague()
                }
              }}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateLeague}
            disabled={loading || !leagueName.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create League
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
