import { useQueryClient } from '@tanstack/react-query';
import { Building2, Inbox, LayoutDashboard, LogOut, ScrollText } from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router';
import { session } from '../lib/session';
import type { Me } from '../lib/queries';
import { cx } from './ui';

interface Item { to: string; label: string; icon: ReactNode }

const items: Item[] = [
  { to: '/', label: 'Overview', icon: <LayoutDashboard className="size-5" /> },
  { to: '/dairies', label: 'Dairies', icon: <Building2 className="size-5" /> },
  { to: '/leads', label: 'Leads', icon: <Inbox className="size-5" /> },
  { to: '/audit', label: 'Activity', icon: <ScrollText className="size-5" /> },
];

export default function Layout({ me }: { me: Me }) {
  const qc = useQueryClient();
  const signOut = () => {
    session.clear();
    qc.clear();
  };
  const link = (i: Item, compact = false) => (
    <NavLink
      key={i.to}
      to={i.to}
      end={i.to === '/'}
      className={({ isActive }) =>
        cx(
          'flex items-center gap-3 rounded-xl font-medium transition-colors',
          compact ? 'flex-col gap-0.5 px-2 py-1.5 text-[11px]' : 'px-3 py-2.5',
          isActive ? 'bg-forest-700 text-white' : 'text-forest-900 hover:bg-forest-100',
        )
      }
    >
      {i.icon}
      {i.label}
    </NavLink>
  );

  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-forest-100 bg-white p-4 md:flex">
        <div className="mb-6 flex items-center gap-3 px-2">
          <img src="/favicon.svg" alt="" className="size-9" />
          <div>
            <p className="font-display text-xl leading-none">DailyDairy</p>
            <p className="text-xs text-gray-500">Super admin</p>
          </div>
        </div>
        <nav aria-label="Main" className="flex flex-col gap-1">{items.map((i) => link(i))}</nav>
        <div className="mt-auto rounded-xl bg-forest-50 p-3">
          <p className="truncate font-semibold">{me.fullName || 'Platform admin'}</p>
          <p className="text-sm text-gray-600">{me.phone}</p>
          <button onClick={signOut} className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-forest-700 hover:underline">
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-forest-100 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <img src="/favicon.svg" alt="" className="size-8" />
          <span className="font-display text-lg">DailyDairy admin</span>
        </div>
        <button onClick={signOut} aria-label="Sign out" className="rounded-lg p-2 hover:bg-forest-50"><LogOut className="size-5" /></button>
      </header>

      <main className="min-w-0 flex-1 px-4 pt-5 pb-28 md:px-8 md:pb-10">
        <Outlet />
      </main>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 border-t border-forest-100 bg-white px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom),6px)] md:hidden">
        <div className="grid grid-cols-4 gap-1">{items.map((i) => link(i, true))}</div>
      </nav>
    </div>
  );
}
