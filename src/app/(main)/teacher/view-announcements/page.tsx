// src/app/(main)/teacher/view-announcements/page.tsx
'use client';

import { useEffect, useState, useMemo, startTransition } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import type { Announcement as PrismaAnnouncement, User as PrismaUser } from '@prisma/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, Megaphone, CalendarDays, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { getAnnouncementsForUser } from '@/actions/announcementActions';

export default function TeacherViewAnnouncementsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [teacherAnnouncements, setTeacherAnnouncements] = useState<PrismaAnnouncement[]>([]);

  useEffect(() => {
    if (user && user.role === 'Teacher') {
      const fetchAnnouncements = async () => {
        setIsLoading(true);
        try {
          const data = await getAnnouncementsForUser(user as PrismaUser); // Cast to PrismaUser
          setTeacherAnnouncements(data);
        } catch (error) {
          console.error("Failed to fetch announcements:", error);
        } finally {
          setIsLoading(false);
        }
      };
      startTransition(() => { fetchAnnouncements(); });
    } else if (!user) {
      router.replace('/login');
    } else if (user?.role !== 'Teacher') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-8 w-8 animate-spin"/><span className="ml-2">Loading Announcements...</span></div>;
  }

  if (!user || user.role !== 'Teacher') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" /><h2 className="text-2xl font-bold mb-2">Access Denied</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Announcements for Teachers" description="Stay updated with important information and notices." icon={Megaphone}/>
      {teacherAnnouncements.length > 0 ? (
        <div className="space-y-4">
          {teacherAnnouncements.map(ann => (
            <Card key={ann.announcement_id} className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-headline">{ann.title}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  Published on: {format(new Date(ann.publish_date || 0), 'MMM dd, yyyy, hh:mm a')}
                  {/* Assuming author relation is included in Prisma query if needed */}
                  {/* {ann.author?.first_name && ann.author?.last_name && ` by ${ann.author.first_name} ${ann.author.last_name}`} */}
                </CardDescription>
              </CardHeader>
              <CardContent><ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">{ann.content}</ReactMarkdown></CardContent>
            </Card>
          ))}
        </div>
      ) : (<Card><CardContent className="py-10 text-center"><Megaphone className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><p className="text-lg text-muted-foreground">No announcements for you at the moment.</p></CardContent></Card>)}
    </div>
  );
}
