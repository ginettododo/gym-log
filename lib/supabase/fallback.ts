import type { SupabaseClient } from '@supabase/supabase-js';

type SupabaseErrorResponse = {
  data: null;
  error: {
    message: string;
  };
};

const missingConfigMessage =
  'Supabase non configurato. Imposta NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.';

const buildErrorResponse = (): SupabaseErrorResponse => ({
  data: null,
  error: {
    message: missingConfigMessage,
  },
});

function createFallbackQueryBuilder() {
  const response = buildErrorResponse();

  const builder: Record<string, unknown> = {
    then(onFulfilled?: (value: SupabaseErrorResponse) => unknown, onRejected?: (reason: unknown) => unknown) {
      return Promise.resolve(response).then(onFulfilled, onRejected);
    },
  };

  for (const methodName of ['select', 'insert', 'upsert', 'delete', 'eq', 'order', 'limit', 'single']) {
    builder[methodName] = () => builder;
  }

  return builder;
}

export function createFallbackSupabaseClient(): SupabaseClient {
  return {
    auth: {
      async getUser() {
        return { data: { user: null }, error: null };
      },
      async getSession() {
        return { data: { session: null }, error: null };
      },
      async signInWithOAuth() {
        return { data: { provider: 'google', url: null }, error: { message: missingConfigMessage } };
      },
      async exchangeCodeForSession() {
        return { data: { session: null, user: null }, error: { message: missingConfigMessage } };
      },
      async signOut() {
        return { error: null };
      },
    },
    from() {
      return createFallbackQueryBuilder();
    },
  } as unknown as SupabaseClient;
}
