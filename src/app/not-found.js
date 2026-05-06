import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <h1 style={{ fontSize: 'var(--text-5xl)', marginBottom: '0.5rem' }}>404</h1>
      <p style={{
        fontFamily: 'var(--font-serif)',
        fontSize: 'var(--text-xl)',
        color: 'var(--color-ink-secondary)',
        marginBottom: '2rem',
      }}>
        This page could not be found.
      </p>
      <Link href="/" className="btn-primary">
        Go Home
      </Link>
    </main>
  );
}
