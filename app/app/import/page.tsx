import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ImportWizard } from '@/components/import-wizard';
import { createClient } from '@/lib/supabase/server';

export default async function ImportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main>
      <h1>Importazione CSV</h1>
      <p>Importa blocchi programma e tabelle progressione anche in modalità offline.</p>
      <ImportWizard userId={user.id} />
      <p>
        <Link href="/app">Torna all&apos;area app</Link>
      </p>
    </main>
  );
}
