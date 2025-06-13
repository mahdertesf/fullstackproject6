'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { getFilteredNavLinks, type NavLink } from './NavLinks';
import Image from 'next/image';
import { Separator } from '../ui/separator';

interface AppSidebarProps {
  className?: string;
}

export default function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  if (!user) return null;

  const filteredLinks = getFilteredNavLinks(user.role, user.isSuperAdmin);

  return (
    <aside className={cn("hidden md:flex flex-col h-full w-64 border-r bg-sidebar text-sidebar-foreground fixed left-0 top-0 pt-16", className)}>
      <ScrollArea className="flex-1 px-4 py-4">
        <nav className="grid items-start gap-1 text-sm font-medium">
          {filteredLinks.map((link) => (
            <Button
              key={link.href}
              asChild
              variant={pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href)) ? 'secondary' : 'ghost'}
              className="w-full justify-start text-base h-11"
            >
              <Link href={link.href} className="flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary">
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            </Button>
          ))}
        </nav>
      </ScrollArea>
      <Separator />
       <div className="p-4 mt-auto border-t">
        <p className="text-xs text-sidebar-foreground/70">
          &copy; {new Date().getFullYear()} CoTBE Portal
        </p>
      </div>
    </aside>
  );
}

// This is the mobile version of the sidebar used inside a Sheet
export function MobileAppSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  if (!user) return null;

  const filteredLinks = getFilteredNavLinks(user.role, user.isSuperAdmin);
  
  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="https://placehold.co/40x40.png?text=CP" alt="CoTBE Portal Logo" width={32} height={32} data-ai-hint="university logo"/>
            <span className="text-lg font-semibold font-headline">CoTBE Portal</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-4 py-4">
        <nav className="grid items-start gap-1 text-sm font-medium">
          {filteredLinks.map((link) => (
            <Button
              key={link.href}
              asChild
              variant={pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href)) ? 'secondary' : 'ghost'}
              className="w-full justify-start text-base h-11"
            >
              <Link href={link.href} className="flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary">
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            </Button>
          ))}
        </nav>
      </ScrollArea>
       <div className="p-4 mt-auto border-t">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} CoTBE Portal
        </p>
      </div>
    </div>
  );
}
