// src/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        // Determine dashboard route based on role
        // For simplicity, we'll use a generic /dashboard which can then show role-specific content
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-foreground">Loading CoTBE Portal...</p>
      </div>
    );
  }

  // This content will be briefly visible before redirection or if loading state is somehow bypassed.
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <h1 className="text-4xl font-bold text-primary font-headline mb-4">CoTBE Portal</h1>
      <p className="text-xl text-foreground">Redirecting...</p>
    </div>
  );
}
