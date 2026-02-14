import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ProgramBlocksClient } from '@/components/program-blocks-client';
import { createClient } from '@/lib/supabase/server';

export default async function ProgramsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main>
      <h1>Programmi</h1>
      <p>Gestisci blocchi e progressioni del tuo piano.</p>
      <ProgramBlocksClient userId={user.id} />
      <p>
        <Link href="/app">Torna all&apos;area app</Link>
      </p>
    </main>
  );
}
