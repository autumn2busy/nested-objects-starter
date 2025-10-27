import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function createClient() {
  const cookieStore = cookies();
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseAnon = process.env.SUPABASE_ANON_KEY!;

  return createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      }
    }
  });
}
