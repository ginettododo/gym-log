import { AppNav } from '@/components/app-nav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div style={{ paddingBottom: '4.5rem' }}>{children}</div>
      <AppNav />
    </>
  );
}
