"use client";

import type { ReactNode } from 'react';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Bell,
  Brain,
  FileText,
  Home,
  Menu,
  Search,
  ShieldCheck,
  Target,
  Trophy,
  User,
  X,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { useThemeStore } from '@/store/theme-store';

export function MainLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const theme = useThemeStore((state) => state.theme);

  const navItems = [
    { icon: Home, label: 'Home', path: '/app' },
    { icon: Target, label: 'Focus', path: '/app/focus' },
    { icon: BarChart3, label: 'Stats', path: '/app/stats' },
    { icon: Trophy, label: 'Rewards', path: '/app/rewards' },
    { icon: User, label: 'Profile', path: '/app/profile' },
  ];
  const utilityItems = [
    { icon: ShieldCheck, label: 'Blocking', path: '/app/blocking' },
    { icon: Brain, label: 'AI Coach', path: '/app/ai-coach' },
    { icon: FileText, label: 'Weekly Report', path: '/app/weekly-report' },
  ];

  const isActive = (path: string) => {
    if (path === '/app') {
      return pathname === '/app';
    }
    return pathname.startsWith(path);
  };

  const activeItem = navItems.find((item) => isActive(item.path)) ?? navItems[0];
  const commands = [
    ...navItems,
    ...utilityItems,
  ];
  const filteredCommands = commands.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()),
  );

  function openRoute(path: string) {
    router.push(path);
    setSearchOpen(false);
    setQuery('');
  }

  return (
    <div
      className="min-h-screen text-foreground transition-colors duration-300"
      style={{
        background:
          theme === 'dark'
            ? 'linear-gradient(135deg, #0B0B0F 0%, #11111d 50%, #0B0B0F 100%)'
            : 'linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 48%, #FFF7ED 100%)',
      }}
    >
      <div className="min-h-screen">
        <aside
          className={`fixed left-0 top-0 z-50 hidden h-screen shrink-0 flex-col border-r border-white/10 bg-sidebar/85 backdrop-blur-2xl transition-[width] duration-300 md:flex ${
            sidebarCollapsed ? 'w-20' : 'w-72'
          }`}
        >
          <div className="flex h-20 items-center justify-center border-b border-white/10 px-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF9F1C] to-[#FF6B1C] shadow-lg shadow-[#FF9F1C]/30">
                <Zap className="h-6 w-6 text-[#0B0B0F]" fill="#0B0B0F" />
              </div>
              <div className={`min-w-0 transition-opacity ${sidebarCollapsed ? 'hidden opacity-0' : 'block opacity-100'}`}>
                <p className="text-sm font-bold">FocusForge AI</p>
                <p className="text-xs text-gray-500">Command center</p>
              </div>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-6 px-3 py-6">
            <div className="space-y-2">
              {!sidebarCollapsed && (
                <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Workspace
                </p>
              )}
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  aria-label={item.label}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`group relative flex h-12 items-center gap-3 rounded-2xl px-3 transition-all ${
                    sidebarCollapsed ? 'justify-center' : 'justify-start'
                  } ${
                    active
                      ? 'bg-gradient-to-r from-[#FF9F1C]/25 to-[#FF6B1C]/10 text-[#FF9F1C] shadow-lg shadow-[#FF9F1C]/10'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                  {sidebarCollapsed && (
                    <span className="pointer-events-none absolute left-[calc(100%+10px)] z-50 hidden rounded-lg border border-white/10 bg-popover px-2 py-1 text-xs text-foreground shadow-xl group-hover:block">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
            </div>

            <div className="space-y-2">
              {!sidebarCollapsed && (
                <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Tools
                </p>
              )}
              {utilityItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    aria-label={item.label}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`group relative flex h-12 items-center gap-3 rounded-2xl px-3 transition-all ${
                      sidebarCollapsed ? 'justify-center' : 'justify-start'
                    } ${
                      active
                        ? 'bg-gradient-to-r from-[#FF9F1C]/25 to-[#FF6B1C]/10 text-[#FF9F1C] shadow-lg shadow-[#FF9F1C]/10'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                    {sidebarCollapsed && (
                      <span className="pointer-events-none absolute left-[calc(100%+10px)] z-50 hidden rounded-lg border border-white/10 bg-popover px-2 py-1 text-xs text-foreground shadow-xl group-hover:block">
                        {item.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        <div
          className={`flex min-w-0 flex-1 flex-col transition-[padding] duration-300 ${
            sidebarCollapsed ? 'md:pl-20' : 'md:pl-72'
          }`}
        >
          <header className="sticky top-0 z-30 hidden h-20 border-b border-white/10 bg-background/80 backdrop-blur-2xl md:block">
            <div className="mx-auto flex h-full w-full max-w-screen-xl items-center justify-between px-6 lg:px-8">
              <div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSidebarCollapsed((current) => !current)}
                    aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition-colors hover:bg-white/10 hover:text-[#FF9F1C]"
                  >
                    <Menu className="h-4 w-4" />
                  </button>
                  <h2 className="text-xl font-semibold text-white">{activeItem.label}</h2>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Search className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setNotificationsOpen((current) => !current)}
                  aria-label="Notifications"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Bell className="h-5 w-5" />
                </button>
              </div>
            </div>
            {notificationsOpen && (
              <div className="absolute right-8 top-16 z-50 w-80 rounded-2xl border border-white/10 bg-popover p-4 shadow-2xl">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Notifications</h3>
                  <button onClick={() => setNotificationsOpen(false)} aria-label="Close notifications">
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
                {[
                  'Your 7-9 PM distraction window starts soon.',
                  'You are 90 XP away from Level 13.',
                  'Weekly report is ready to review.',
                ].map((message) => (
                  <button
                    key={message}
                    onClick={() => toast.success('Notification marked as read')}
                    className="mb-2 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left text-xs text-gray-300 hover:bg-white/10"
                  >
                    {message}
                  </button>
                ))}
              </div>
            )}
          </header>

          <main className="min-w-0 flex-1">
            <div className="mx-auto w-full max-w-screen-xl px-4 py-6 pb-28 md:px-6 md:py-8 md:pb-10 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 h-20 border-t border-white/10 bg-background/90 backdrop-blur-2xl md:hidden">
        <div className="flex h-full items-center justify-around px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                aria-label={item.label}
                className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 transition-all"
              >
                <Icon
                  className={`h-6 w-6 transition-colors ${
                    active ? 'text-[#FF9F1C]' : 'text-gray-400'
                  }`}
                />
                <span
                  className={`text-[10px] transition-colors ${
                    active ? 'text-[#FF9F1C]' : 'text-gray-400'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {searchOpen && (
        <div className="fixed inset-0 z-[60] bg-black/70 p-4 backdrop-blur-sm">
          <div className="mx-auto mt-20 max-w-xl rounded-2xl border border-white/10 bg-popover p-4 shadow-2xl">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoFocus
                placeholder="Search pages and actions..."
                className="h-12 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
              />
              <button onClick={() => setSearchOpen(false)} aria-label="Close search">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {filteredCommands.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => openRoute(item.path)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white"
                  >
                    <Icon className="h-4 w-4 text-[#FF9F1C]" />
                    {item.label}
                  </button>
                );
              })}
              {filteredCommands.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-gray-500">No matching action.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
