'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: '📊' },
  { href: '/events', label: 'Events', icon: '⚡' },
  { href: '/decisions', label: 'Decisions', icon: '⚖️' },
  { href: '/rules', label: 'Rules', icon: '📋' },
  { href: '/incidents', label: 'Incidents', icon: '🚨' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col bg-brand-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-brand-700 px-6 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white font-bold text-sm">
          CN
        </div>
        <div>
          <p className="text-sm font-bold tracking-wide">CRYTONET</p>
          <p className="text-xs text-brand-300">Security Platform</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-700 text-white'
                  : 'text-brand-200 hover:bg-brand-800 hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User menu */}
      <div className="border-t border-brand-700 p-4">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold">
            AD
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">admin@demo.com</p>
            <p className="text-xs text-brand-300">Admin · Demo Corp</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
