'use client';

import PageHeader from '@/components/shared/PageHeader';
import StudyGuideGeneratorForm from '@/components/study-guide/StudyGuideGeneratorForm';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

export default function StudyGuidePage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'Student') {
      router.replace('/dashboard'); // Redirect if not a student
    }
  }, [user, router]);

  if (!user || user.role !== 'Student') {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">This feature is available for students only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="AI Study Guide Generator" 
        description="Get personalized help with your course topics using AI."
        icon={ShieldCheck}
      />
      <StudyGuideGeneratorForm />
    </div>
  );
}
