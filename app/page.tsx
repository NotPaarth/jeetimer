import { AuthProvider } from "@/components/auth-provider"
import EnhancedDashboard from "@/components/enhanced-dashboard"
import { Toaster } from "@/components/ui/toaster"

export default function Home() {
  return (
    <AuthProvider>
      <EnhancedDashboard />
      <Toaster />
    </AuthProvider>
  )
}
