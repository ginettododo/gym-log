import Link from 'next/link';
import { loginWithGoogle } from './actions';

export default function LoginPage({ searchParams }: { searchParams: { errore?: string } }) {
  return (
    <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏋️</div>
          <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.75rem' }}>Gym Log</h1>
          <p style={{ color: '#94a3b8', margin: 0 }}>Traccia i tuoi allenamenti, anche offline.</p>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: '#94a3b8', marginTop: 0 }}>
            Accedi con Google per sincronizzare i tuoi dati su tutti i dispositivi.
          </p>
          <form action={loginWithGoogle}>
            <button
              type="submit"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                fontSize: '1rem',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.616Z" fill="#0f172a"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#0f172a"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#0f172a"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#0f172a"/>
              </svg>
              Continua con Google
            </button>
          </form>

          {searchParams.errore ? (
            <p
              style={{
                marginBottom: 0,
                marginTop: '1rem',
                color: '#ef4444',
                background: 'rgba(239,68,68,0.1)',
                padding: '0.6rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
              }}
            >
              {searchParams.errore}
            </p>
          ) : null}
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem' }}>
          <Link href="/" style={{ color: '#64748b' }}>
            ← Torna alla home
          </Link>
        </p>
      </div>
    </main>
  );
}
