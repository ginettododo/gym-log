import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          // Update request cookies so route handlers see the refreshed session.
          request.cookies.set(name, value);
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set(name, '');
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options, maxAge: 0 });
        },
      },
    });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (request.nextUrl.pathname.startsWith('/app') && !session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (request.nextUrl.pathname === '/login' && session) {
      return NextResponse.redirect(new URL('/app', request.url));
    }
  } catch (error) {
    console.error('Middleware auth check failed', error);

    if (request.nextUrl.pathname.startsWith('/app')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/app/:path*', '/login'],
};
