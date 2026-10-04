import Link from 'next/link';

export function Chip({ href, children }: { href?: string; children: React.ReactNode }) {
  const className =
    'inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted';
  return href ? (
    <Link href={href} className={`${className} transition-colors hover:border-accent hover:text-accent`}>
      {children}
    </Link>
  ) : (
    <span className={className}>{children}</span>
  );
}
