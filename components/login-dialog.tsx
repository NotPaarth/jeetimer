"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAuth } from "./auth-provider"
import { Chrome } from "lucide-react"

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const { signInWithGoogle } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error("Sign in failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign in to Study Timer</DialogTitle>
          <DialogDescription>Sign in with Google to sync your study data across all your devices.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium">Benefits of signing in:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Sync data across all devices</li>
              <li>• Never lose your study progress</li>
              <li>• Access your data anywhere</li>
              <li>• Automatic cloud backup</li>
            </ul>
          </div>

          <Button onClick={handleGoogleSignIn} disabled={isLoading} className="w-full" size="lg">
            <Chrome className="mr-2 h-4 w-4" />
            {isLoading ? "Signing in..." : "Continue with Google"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
