import Link from 'next/link';
import { loginWithGoogle } from './actions';

export default function LoginPage({ searchParams }: { searchParams: { errore?: string } }) {
  return (
    <main>
      <h1>Accesso</h1>
      <p>Accedi con Google per sincronizzare backup e sessioni.</p>
      <form action={loginWithGoogle}>
        <button type="submit">Continua con Google</button>
      </form>
      {searchParams.errore ? <p>Errore: {searchParams.errore}</p> : null}
      <p>
        <Link href="/">Torna alla home</Link>
      </p>
    </main>
  );
}
