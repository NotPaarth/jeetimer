// Compatibility shim ---------------------------------------------------
// Some components still import "@/lib/supabase-client".
// Re-export the real client so those imports keep working.

export { supabase } from "./supabase"
