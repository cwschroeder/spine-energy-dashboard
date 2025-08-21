'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Cpu,
  Activity,
  Settings,
  BarChart3,
  Wifi,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Geräte', href: '/devices', icon: Cpu },
  { name: 'Live-Monitoring', href: '/monitoring', icon: Activity },
  { name: 'Einstellungen', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-card">
      <div className="flex h-16 items-center px-6 border-b">
        <Wifi className="h-6 w-6 text-primary mr-2" />
        <span className="text-xl font-semibold">SPiNE Energy</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <div className="flex items-center">
          <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
          <span className="text-sm text-muted-foreground">API Verbunden</span>
        </div>
      </div>
    </div>
  );
}