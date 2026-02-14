import Link from 'next/link';
import { redirect } from 'next/navigation';
import { NewWorkoutClient } from '@/components/workouts/new-workout-client';
import { createClient } from '@/lib/supabase/server';

export default async function NewWorkoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main>
      <h1>Nuovo allenamento</h1>
      <NewWorkoutClient userId={user.id} />
      <p>
        <Link href="/app/workouts">Annulla</Link>
      </p>
    </main>
  );
}
