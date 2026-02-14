import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/lib/env';
import { createFallbackSupabaseClient } from '@/lib/supabase/fallback';

export function createClient() {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    return createFallbackSupabaseClient();
  }

  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
}
