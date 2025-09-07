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
import { Loader2, Users } from "lucide-react"
import { apiService } from "@/services/api"
import { useToast } from "@/hooks/use-toast"

interface JoinLeagueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLeagueJoined: () => void
}

export function JoinLeagueDialog({ open, onOpenChange, onLeagueJoined }: JoinLeagueDialogProps) {
  const [inviteCode, setInviteCode] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleJoinLeague = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter an invite code",
        variant: "destructive",
      })
      return
    }

    if (inviteCode.trim().length !== 8) {
      toast({
        title: "Error",
        description: "Invite code must be 8 characters long",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const response = await apiService.joinLeague({ invite_code: inviteCode.trim().toUpperCase() })
      
      toast({
        title: "Success!",
        description: `Successfully joined "${response.league.name}"!`,
      })

      setInviteCode("")
      onOpenChange(false)
      onLeagueJoined()
    } catch (error) {
      console.error('Failed to join league:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join league",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setInviteCode("")
      onOpenChange(false)
    }
  }

  const formatInviteCode = (value: string) => {
    // Remove any non-alphanumeric characters and convert to uppercase
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase()
    // Limit to 8 characters
    return cleaned.slice(0, 8)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Join League</span>
          </DialogTitle>
          <DialogDescription>
            Enter the 8-character invite code to join an existing fantasy betting league.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="invite-code" className="text-right">
              Invite Code
            </Label>
            <Input
              id="invite-code"
              value={inviteCode}
              onChange={(e) => setInviteCode(formatInviteCode(e.target.value))}
              placeholder="ABCD1234"
              className="col-span-3 font-mono text-center text-lg tracking-wider"
              disabled={loading}
              maxLength={8}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading && inviteCode.length === 8) {
                  handleJoinLeague()
                }
              }}
            />
          </div>
          <div className="text-sm text-muted-foreground text-center">
            Enter the 8-character code provided by the league commissioner
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
            onClick={handleJoinLeague}
            disabled={loading || inviteCode.length !== 8}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                Join League
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
