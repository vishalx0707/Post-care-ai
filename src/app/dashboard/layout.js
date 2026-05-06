'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import Sidebar from '@/components/Sidebar';
import { Wordmark } from '@/components/synex/Wordmark';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, loading, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Wordmark size="md" />
        <Skeleton width="120px" />
      </div>
    );
  }

  if (!user) return null;

  const mainOffset = sidebarCollapsed ? 'md:pl-14' : 'md:pl-56';

  return (
    <div className="min-h-screen bg-paper">
      <button
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
        className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-md bg-paper border border-rule text-ink-3 hover:text-ink transition-colors"
      >
        <Menu size={18} strokeWidth={1.5} />
      </button>

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((p) => !p)}
        companionName={profile?.aiCompanionName}
      />

      <main className={`transition-[padding] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${mainOffset}`}>
        <div className="mx-auto max-w-[1080px] px-6 md:px-10 py-12 md:py-16">
          {children}
        </div>
      </main>
    </div>
  );
}
