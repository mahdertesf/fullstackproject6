
'use client';

import { useEffect, useState, useMemo } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { mockAnnouncements } from '@/lib/data';
import type { Announcement } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, Megaphone, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';

export default function TeacherViewAnnouncementsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [teacherAnnouncements, setTeacherAnnouncements] = useState<Announcement[]>([]);

  const now = useMemo(() => new Date(), []);

  useEffect(() => {
    if (user && user.role === 'Teacher') {
      const relevantAnnouncements = mockAnnouncements
        .filter(ann => 
          (ann.target_audience === 'Teachers' || ann.target_audience === 'All Users') &&
          ann.status === 'Published' &&
          new Date(ann.publish_date || 0) <= now &&
          (!ann.expiry_date || new Date(ann.expiry_date) >= now)
        )
        .sort((a, b) => new Date(b.publish_date || 0).getTime() - new Date(a.publish_date || 0).getTime());
      
      setTeacherAnnouncements(relevantAnnouncements);
      setIsLoading(false);
    } else if (!user) {
      router.replace('/login');
    } else if (user.role !== 'Teacher') {
      router.replace('/dashboard');
    }
  }, [user, router, now]);

  if (isLoading) {
    return <PageHeader title="Loading Announcements..." icon={Megaphone} />;
  }

  if (!user || user.role !== 'Teacher') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">This page is for teachers only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Announcements for Teachers"
        description="Stay updated with important information and notices."
        icon={Megaphone}
      />
      {teacherAnnouncements.length > 0 ? (
        <div className="space-y-4">
          {teacherAnnouncements.map(ann => (
            <Card key={ann.announcement_id} className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-headline">{ann.title}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  Published on: {format(new Date(ann.publish_date || 0), 'MMM dd, yyyy, hh:mm a')}
                  {ann.author?.first_name && ann.author?.last_name && ` by ${ann.author.first_name} ${ann.author.last_name}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
                  {ann.content}
                </ReactMarkdown>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <Megaphone className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">No announcements for you at the moment.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

