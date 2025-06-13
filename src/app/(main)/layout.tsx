// src/app/(main)/layout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import AppHeader from '@/components/layout/AppHeader';
import AppSidebar, {MobileAppSidebar} from '@/components/layout/AppSidebar';
import { Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';


export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  // If user is null even if authenticated (should not happen with current mock logic), show loading.
  if (!user) {
     return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4">Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <AppHeader />
      <div className="flex flex-1">
        <div className="hidden md:block"> {/* Desktop Sidebar */}
          <AppSidebar />
        </div>
        {/* Mobile Sidebar is part of AppHeader now via Sheet */}
        <main className="flex-1 flex-col p-4 md:p-6 lg:p-8 md:ml-64"> {/* Add ml-64 for desktop sidebar */}
          {children}
        </main>
      </div>
    </div>
  );
}
