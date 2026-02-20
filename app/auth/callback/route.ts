import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/login?errore=Codice+OAuth+non+presente', request.url));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL('/login?errore=Supabase+non+configurato', request.url));
  }

  // Create the redirect response first so we can set cookies directly on it.
  // Using cookies() from next/headers here would attach Set-Cookie to a separate
  // implicit response, not to the NextResponse.redirect() we return — meaning
  // the session would be lost and the user would be sent back to /login.
  const response = NextResponse.redirect(new URL('/app', request.url));

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: Record<string, unknown>) {
        response.cookies.set({ name, value: '', ...options, maxAge: 0 });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?errore=${encodeURIComponent(error.message)}`, request.url),
    );
  }

  return response;
}
