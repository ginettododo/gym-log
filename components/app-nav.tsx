'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/app', label: 'Home', icon: '⊞', exact: true },
  { href: '/app/workouts', label: 'Allenamenti', icon: '↯', exact: false },
  { href: '/app/exercises', label: 'Esercizi', icon: '◎', exact: false },
  { href: '/app/routines', label: 'Routine', icon: '≡', exact: false },
  { href: '/app/programs', label: 'Programmi', icon: '▦', exact: false },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#1e293b',
        borderTop: '1px solid #334155',
        display: 'flex',
        zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {navItems.map((item) => {
        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href + '/') || pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.6rem 0.25rem',
              textDecoration: 'none',
              color: isActive ? '#38bdf8' : '#94a3b8',
              fontSize: '0.65rem',
              fontWeight: isActive ? 700 : 400,
              gap: '0.2rem',
              transition: 'color 0.15s',
              borderTop: isActive ? '2px solid #38bdf8' : '2px solid transparent',
            }}
          >
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
