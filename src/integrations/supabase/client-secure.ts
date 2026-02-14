// import { supabase } from "@/integrations/supabase/client-secure";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = "https://zkufdbuzqdxtiudhaagg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprdWZkYnV6cWR4dGl1ZGhhYWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMjgwMTIsImV4cCI6MjA2NTcwNDAxMn0.cPQWE80pVDh0-Mn1nqa_UsqFMuSbizPgS2naVNyUHY8";

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: true,
      persistSession: true,
      storage: window.localStorage,
      autoRefreshToken: true,
      storageKey: "sb-zkufdbuzqdxtiudhaagg-auth-token",
    },
  },
);

