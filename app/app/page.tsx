import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LogoutButton } from '@/components/logout-button';
import { SyncStatus } from '@/components/sync-status';
import { createClient } from '@/lib/supabase/server';

export default async function AppHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main>
      <h1>Area Allenamenti</h1>
      <p>Benvenuto, {user.email}</p>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <Link href="/app/settings">Impostazioni</Link>
        <Link href="/app/programs">Programmi</Link>
        <Link href="/app/import">Importa CSV</Link>
        <LogoutButton />
      </div>
      <div className="card">
        <h2>Stato sincronizzazione</h2>
        <SyncStatus userId={user.id} />
      </div>
      <div className="card">
        <h2>Bozza offline</h2>
        <p>Questa baseline supporta cache locale e coda mutazioni via IndexedDB.</p>
      </div>
    </main>
  );
}
