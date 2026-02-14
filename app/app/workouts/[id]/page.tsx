import Link from 'next/link';
import { redirect } from 'next/navigation';
import { WorkoutLiveClient } from '@/components/workouts/workout-live-client';
import { createClient } from '@/lib/supabase/server';

export default async function WorkoutSessionPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main>
      <h1>Log allenamento</h1>
      <WorkoutLiveClient userId={user.id} sessionId={params.id} />
      <p>
        <Link href="/app/workouts">Torna agli allenamenti</Link>
      </p>
    </main>
  );
}
