
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/supabase-js";

export function createClient() {
  const cookieStore = cookies();
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseAnon = process.env.SUPABASE_ANON_KEY!;

  // Using a simple client; for RLS auth via JWT, you'd set auth headers from Outseta if desired.
  return createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      }
    }
  });
}
