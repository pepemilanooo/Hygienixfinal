'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, MapPin, ClipboardList, Calendar,
  Package, BarChart3, Settings, UserCog, Bug, LogOut, HardHat,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { cn, getInitials } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMIN', 'MANAGER'] },
  { href: '/clients', icon: Users, label: 'Clienti', roles: ['ADMIN', 'MANAGER'] },
  { href: '/sites', icon: MapPin, label: 'Sedi', roles: ['ADMIN', 'MANAGER'] },
  { href: '/interventions', icon: ClipboardList, label: 'Interventi', roles: ['ADMIN', 'MANAGER'] },
  { href: '/calendar', icon: Calendar, label: 'Calendario', roles: ['ADMIN', 'MANAGER'] },
  { href: '/products', icon: Package, label: 'Prodotti', roles: ['ADMIN', 'MANAGER'] },
  { href: '/analytics', icon: BarChart3, label: 'Analytics', roles: ['ADMIN', 'MANAGER'] },
];

const ADMIN_ITEMS = [
  { href: '/users', icon: UserCog, label: 'Utenti', roles: ['ADMIN'] },
  { href: '/settings', icon: Settings, label: 'Impostazioni', roles: ['ADMIN'] },
];

const TECH_ITEMS = [
  { href: '/my-calendar', icon: Calendar, label: 'Mio Calendario', roles: ['TECHNICIAN'] },
  { href: '/my-interventions', icon: ClipboardList, label: 'Miei Interventi', roles: ['TECHNICIAN'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();

  const visibleNav = [...NAV_ITEMS, ...TECH_ITEMS, ...ADMIN_ITEMS].filter(item =>
    item.roles.includes(user?.role || '')
  );

  const mainItems = visibleNav.filter(i => !ADMIN_ITEMS.find(a => a.href === i.href));
  const adminItems = visibleNav.filter(i => ADMIN_ITEMS.find(a => a.href === i.href));

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full flex-shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-700 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
            <Bug className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg leading-none">Hygienix</p>
            <p className="text-xs text-gray-400 leading-tight">Pest Control</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <div className="space-y-0.5">
          {mainItems.map((item) => (
            <Link key={item.href} href={item.href} className={cn('sidebar-link', isActive(item.href) && 'active')}>
              <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
              {item.label}
            </Link>
          ))}
        </div>

        {adminItems.length > 0 && (
          <>
            <div className="mt-6 mb-2 px-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Amministrazione</p>
            </div>
            <div className="space-y-0.5">
              {adminItems.map((item) => (
                <Link key={item.href} href={item.href} className={cn('sidebar-link', isActive(item.href) && 'active')}>
                  <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
                  {item.label}
                </Link>
              ))}
            </div>
          </>
        )}
      </nav>

      {/* User info + logout */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-default">
          <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary-700">
              {user ? getInitials(user.firstName, user.lastName) : '??'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gray-400 truncate capitalize">{user?.role?.toLowerCase()}</p>
          </div>
          <button
            onClick={clearAuth}
            title="Logout"
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
