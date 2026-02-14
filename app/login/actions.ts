'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function loginWithGoogle() {
  const supabase = await createClient();
  const requestHeaders = await headers();
  const origin =
    requestHeaders.get('origin') ??
    (() => {
      const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');

      if (!host) {
        return 'http://localhost:3000';
      }

      const protocol = requestHeaders.get('x-forwarded-proto') ?? 'https';
      return `${protocol}://${host}`;
    })();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    redirect(`/login?errore=${encodeURIComponent(error.message)}`);
  }

  if (!data.url) {
    redirect('/login?errore=URL+OAuth+non+disponibile');
  }

  redirect(data.url);
}
