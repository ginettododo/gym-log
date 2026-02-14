import Link from 'next/link';
import { redirect } from 'next/navigation';
import { WorkoutsHomeClient } from '@/components/workouts/workouts-home-client';
import { createClient } from '@/lib/supabase/server';

export default async function WorkoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main>
      <h1>Allenamenti</h1>
      <p>Avvia un allenamento in pochi secondi e continua anche offline.</p>
      <WorkoutsHomeClient userId={user.id} />
      <p>
        <Link href="/app">Torna all&apos;area app</Link>
      </p>
    </main>
  );
}
