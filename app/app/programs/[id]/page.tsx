import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ProgressionTable } from '@/components/progression-table';
import { createClient } from '@/lib/supabase/server';

export default async function ProgramDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main>
      <h1>Dettaglio Programma</h1>
      <ProgressionTable userId={user.id} programBlockId={params.id} />
      <p>
        <Link href="/app/programs">Torna ai programmi</Link>
      </p>
    </main>
  );
}
