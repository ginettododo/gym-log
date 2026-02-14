import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <h1>Gym Log Offline</h1>
      <p>App mobile-first per tracciare allenamenti anche senza connessione.</p>
      <div className="card">
        <p>Per iniziare effettua il login con Google.</p>
        <Link href="/login">Vai al login</Link>
      </div>
    </main>
  );
}
