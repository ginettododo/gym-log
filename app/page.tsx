import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '360px', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏋️</div>
        <h1 style={{ margin: '0 0 0.5rem', fontSize: '2rem' }}>Gym Log</h1>
        <p style={{ color: '#94a3b8', margin: '0 0 2rem' }}>
          Traccia i tuoi allenamenti, anche senza connessione.
        </p>
        <div className="card" style={{ textAlign: 'left' }}>
          <ul style={{ padding: 0, margin: '0 0 1.5rem', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { icon: '📴', text: 'Funziona offline — nessun dato perso' },
              { icon: '🔄', text: 'Sincronizzazione automatica quando torni online' },
              { icon: '📊', text: 'Programmi di progressione e volume settimanale' },
              { icon: '⏱️', text: 'Timer recupero integrato' },
            ].map(({ icon, text }) => (
              <li key={text} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '0.9rem' }}>
                <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                <span style={{ color: '#cbd5e1' }}>{text}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/login"
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '0.75rem',
              background: '#0ea5e9',
              color: '#0f172a',
              fontWeight: 700,
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '1rem',
            }}
          >
            Inizia ora
          </Link>
        </div>
      </div>
    </main>
  );
}
