const requiredEnvVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    // eslint-disable-next-line no-console
    console.warn(`Variabile ambiente mancante: ${envVar}`);
  }
}

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
};
