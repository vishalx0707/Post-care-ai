'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Pill,
  FileText,
  MessageCircle,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Wordmark } from '@/components/synex/Wordmark';
import { getCompanionMenuLabel } from './sidebar-nav';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', Icon: LayoutDashboard },
  { label: 'Medication Log', href: '/dashboard/medications', Icon: Pill },
  { label: 'Reports', href: '/dashboard/reports', Icon: FileText },
  { label: 'AI Companion', href: '/dashboard/companion', Icon: MessageCircle },
  { label: 'Settings', href: '/dashboard/settings', Icon: Settings },
];

function NavList({ pathname, navItems, collapsed, onClick }) {
  const isActive = (href) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <nav className="flex flex-col gap-0.5 px-2">
      {navItems.map(({ label, href, Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onClick}
            title={collapsed ? label : undefined}
            className={cn(
              'relative flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors duration-200',
              active ? 'text-ink' : 'text-ink-3 hover:text-ink hover:bg-paper-2',
            )}
          >
            {active && (
              <motion.span
                layoutId="nav-active"
                transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-5 bg-accent"
              />
            )}
            <Icon size={18} strokeWidth={1.5} className="shrink-0" aria-hidden="true" />
            {!collapsed && (
              <span className="text-[14px] font-medium tracking-tight truncate">{label}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse, companionName }) {
  const pathname = usePathname();
  const companionLabel = getCompanionMenuLabel(companionName);
  const navItems = NAV_ITEMS.map((item) =>
    item.href === '/dashboard/companion' ? { ...item, label: companionLabel } : item,
  );

  const SidebarBody = ({ inSheet = false }) => (
    <div className="h-full flex flex-col bg-paper">
      <div className={cn('flex items-center px-4 pt-5 pb-6', collapsed && !inSheet ? 'justify-center' : 'justify-between')}>
        {(!collapsed || inSheet) && <Wordmark size="sm" />}
        {!inSheet && (
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="text-ink-3 hover:text-ink p-1 -m-1 rounded-md transition-colors"
          >
            {collapsed ? <PanelLeftOpen size={16} strokeWidth={1.5} /> : <PanelLeftClose size={16} strokeWidth={1.5} />}
          </button>
        )}
      </div>
      <NavList pathname={pathname} navItems={navItems} collapsed={collapsed && !inSheet} onClick={inSheet ? onClose : undefined} />
    </div>
  );

  return (
    <>
      {/* Mobile sheet */}
      <Sheet open={isOpen} onOpenChange={(o) => !o && onClose?.()}>
        <SheetContent side="left" className="md:hidden p-0 w-64">
          <SidebarBody inSheet />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col fixed top-0 left-0 h-screen border-r border-rule transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] z-30',
          collapsed ? 'w-14' : 'w-56',
        )}
      >
        <SidebarBody />
      </aside>
    </>
  );
}
