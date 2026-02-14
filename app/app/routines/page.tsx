import Link from 'next/link';
import { redirect } from 'next/navigation';
import { RoutinesClient } from '@/components/workouts/routines-client';
import { createClient } from '@/lib/supabase/server';

export default async function RoutinesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main>
      <h1>Routine</h1>
      <p>Crea template rapidi per avviare l&apos;allenamento in meno di 10 secondi.</p>
      <RoutinesClient userId={user.id} />
      <p>
        <Link href="/app">Torna all&apos;area app</Link>
      </p>
    </main>
  );
}
