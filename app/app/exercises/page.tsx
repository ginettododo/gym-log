import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ExercisesClient } from '@/components/workouts/exercises-client';
import { createClient } from '@/lib/supabase/server';

export default async function ExercisesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main>
      <h1>Esercizi</h1>
      <p>Gestisci i tuoi esercizi personalizzati.</p>
      <ExercisesClient userId={user.id} />
      <p>
        <Link href="/app">Torna all&apos;area app</Link>
      </p>
    </main>
  );
}
