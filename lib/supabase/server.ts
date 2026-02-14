import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import { createFallbackSupabaseClient } from '@/lib/supabase/fallback';

export async function createClient() {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    return createFallbackSupabaseClient();
  }

  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        cookieStore.set(name, value, options);
      },
      remove(name: string, options: Record<string, unknown>) {
        cookieStore.set(name, '', { ...options, maxAge: 0 });
      },
    },
  });
}
