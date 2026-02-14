import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BackupNowButton } from '@/components/backup-now-button';
import { createClient } from '@/lib/supabase/server';

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main>
      <h1>Impostazioni</h1>
      <p>Da qui puoi salvare un backup JSON dello stato locale.</p>
      <div className="card">
        <BackupNowButton userId={user.id} />
      </div>
      <p>
        <Link href="/app/settings/sync">Apri pannello sincronizzazione</Link>
      </p>
      <p>
        <Link href="/app">Torna all&apos;area app</Link>
      </p>
    </main>
  );
}
