'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// 地図機能を追加するときは、ここに「地図」を足す
const items = [
  { href: '/', label: 'ホーム' },
  { href: '/categories', label: 'カテゴリ' },
];

const isActive = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

export function SiteNav({ direction }: { direction: 'row' | 'column' }) {
  const pathname = usePathname();
  return (
    <nav aria-label="メインメニュー">
      <ul className={direction === 'row' ? 'flex gap-1' : 'flex flex-col gap-1'}>
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-accent-soft hover:text-foreground'
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
