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

  const emailShort = user.email?.split('@')[0] ?? 'utente';

  return (
    <main>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Ciao, {emailShort} 👋</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>{user.email}</p>
        </div>
        <LogoutButton />
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: '1rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Sincronizzazione
        </h2>
        <SyncStatus userId={user.id} />
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: '1rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Accesso rapido
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          {[
            { href: '/app/workouts/new', label: '+ Nuovo allenamento', primary: true },
            { href: '/app/workouts', label: 'Storico', primary: false },
            { href: '/app/programs', label: 'Programmi', primary: false },
            { href: '/app/import', label: 'Importa CSV', primary: false },
          ].map(({ href, label, primary }) => (
            <Link
              key={href}
              href={href}
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '0.65rem 0.5rem',
                background: primary ? '#0ea5e9' : '#0f172a',
                color: primary ? '#0f172a' : '#e2e8f0',
                fontWeight: primary ? 700 : 400,
                borderRadius: '8px',
                border: primary ? 'none' : '1px solid #334155',
                textDecoration: 'none',
                fontSize: '0.875rem',
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="card">
        <Link href="/app/settings" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none', color: '#e2e8f0' }}>
          <span>⚙️ Impostazioni e backup</span>
          <span style={{ color: '#64748b' }}>›</span>
        </Link>
      </div>
    </main>
  );
}
