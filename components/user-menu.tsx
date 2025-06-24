"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "./auth-provider"
import { LogOut, Cloud, CloudOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UserMenuProps {
  onManualSync: () => void
  lastSyncTime?: Date
}

export default function UserMenu({ onManualSync, lastSyncTime }: UserMenuProps) {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const [isSyncing, setIsSyncing] = useState(false)

  if (!user) return null

  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: "Signed out",
        description: "You've been signed out successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleManualSync = async () => {
    setIsSyncing(true)
    try {
      await onManualSync()
      toast({
        title: "Sync complete",
        description: "Your data has been synced successfully.",
      })
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Failed to sync data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={user.user_metadata?.avatar_url || "/placeholder.svg"}
              alt={user.user_metadata?.full_name}
            />
            <AvatarFallback>
              {user.user_metadata?.full_name ? getInitials(user.user_metadata.full_name) : "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.user_metadata?.full_name || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleManualSync} disabled={isSyncing}>
          {isSyncing ? <CloudOff className="mr-2 h-4 w-4 animate-spin" /> : <Cloud className="mr-2 h-4 w-4" />}
          {isSyncing ? "Syncing..." : "Sync Data"}
        </DropdownMenuItem>
        {lastSyncTime && (
          <DropdownMenuItem disabled>
            <div className="text-xs text-muted-foreground">Last sync: {lastSyncTime.toLocaleTimeString()}</div>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
