import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SyncStatusPanel } from '@/components/sync-status-panel';
import { createClient } from '@/lib/supabase/server';

export default async function SyncSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main>
      <h1>Pannello sincronizzazione</h1>
      <SyncStatusPanel userId={user.id} />
      <p>
        <Link href="/app/settings">Torna alle impostazioni</Link>
      </p>
    </main>
  );
}
