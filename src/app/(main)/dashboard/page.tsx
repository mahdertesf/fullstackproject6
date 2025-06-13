// src/app/(main)/dashboard/page.tsx

'use client';

import { useAuthStore } from '@/store/authStore';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Home, User, BookOpen, BarChart3, Speaker as SpeakerIcon } from 'lucide-react'; // Renamed Speaker to SpeakerIcon
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { mockAnnouncements } from '@/lib/data';
import { useMemo } from 'react';
import { format } from 'date-fns';

// Placeholder components for role-specific dashboard content
const AdminDashboard = () => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
        <User className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">1,234</div>
        <p className="text-xs text-muted-foreground">+20.1% from last month</p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
        <BookOpen className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">56</div>
        <p className="text-xs text-muted-foreground">+5 since last semester</p>
      </CardContent>
    </Card>
     <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">System Health</CardTitle>
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-green-500">Optimal</div>
        <p className="text-xs text-muted-foreground">All systems operational</p>
      </CardContent>
    </Card>
  </div>
);

const StaffDashboard = () => (
  <div className="grid gap-6 md:grid-cols-2">
    <Card>
      <CardHeader>
        <CardTitle>Semester Operations</CardTitle>
        <CardDescription>Overview for the current semester.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Current Semester: Spring 2024</p>
        <p>Total Scheduled Courses: 120</p>
        <Link href="/staff/schedule-courses"><Button className="mt-4">Schedule New Course</Button></Link>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Announcements</CardTitle>
        <CardDescription>Manage university-wide announcements.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Published Announcements: 5</p>
        <p>Drafts: 2</p>
        <Link href="/announcements/create"><Button className="mt-4">Create Announcement</Button></Link>
      </CardContent>
    </Card>
  </div>
);

const TeacherDashboard = () => (
  <div className="grid gap-6">
    <Card>
      <CardHeader>
        <CardTitle>My Active Courses</CardTitle>
        <CardDescription>Courses you are teaching this semester.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Placeholder for course list */}
        <ul className="space-y-2">
          <li>SE301 - Introduction to Programming (Section S1)</li>
          <li>SE450 - Web Development (Section S1)</li>
        </ul>
        <Link href="/teacher/my-courses"><Button variant="link" className="p-0 mt-2">View all my courses</Button></Link>
      </CardContent>
    </Card>
     <Card>
      <CardHeader>
        <CardTitle>Upcoming Deadlines</CardTitle>
         <CardDescription>Assessments due soon for your courses.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Homework 1 (SE301) - Due in 3 days</p>
      </CardContent>
    </Card>
  </div>
);

const StudentDashboard = () => {
  const now = useMemo(() => new Date(), []);
  const recentAnnouncements = useMemo(() => {
    return mockAnnouncements
      .filter(ann => 
        ann.status === 'Published' &&
        (ann.target_audience === 'Students' || ann.target_audience === 'All Users') &&
        new Date(ann.publish_date || 0) <= now &&
        (!ann.expiry_date || new Date(ann.expiry_date) >= now)
      )
      .sort((a, b) => new Date(b.publish_date || 0).getTime() - new Date(a.publish_date || 0).getTime())
      .slice(0, 3); // Show top 3 recent
  }, [now]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>My Schedule - Spring 2024</CardTitle>
          <CardDescription>Your currently registered courses.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li>SE301 - Introduction to Programming</li>
            <li>SE450 - Web Development</li>
          </ul>
          <Link href="/student/my-schedule"><Button variant="link" className="p-0 mt-2">View full schedule</Button></Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Deadlines</CardTitle>
          <CardDescription>Assessments and tasks due soon.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Homework 1 (SE301) - Due in 3 days</p>
          <p>Project Proposal (SE450) - Due in 1 week</p>
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center"><SpeakerIcon className="mr-2 h-5 w-5 text-primary" />Recent Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAnnouncements.length > 0 ? (
            <ul className="space-y-3">
              {recentAnnouncements.map(ann => (
                <li key={ann.announcement_id} className="border-b pb-2 last:border-b-0">
                  <h4 className="font-semibold text-sm">{ann.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    Published: {format(new Date(ann.publish_date || 0), 'MMM dd, yyyy')}
                  </p>
                  <p className="text-sm mt-1 line-clamp-2">{ann.content}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No recent announcements for you.</p>
          )}
           {/* <Button variant="link" className="p-0 mt-3 text-sm">View all announcements</Button> */}
        </CardContent>
      </Card>
    </div>
  );
};


export default function DashboardPage() {
  const { user } = useAuthStore();

  if (!user) return null; // Or a loading/error state

  const welcomeMessage = `Welcome back, ${user.first_name || user.username}!`;
  let roleSpecificContent;

  if (user.isSuperAdmin) {
    roleSpecificContent = <AdminDashboard />;
  } else {
    switch (user.role) {
      case 'Staff':
        roleSpecificContent = <StaffDashboard />;
        break;
      case 'Teacher':
        roleSpecificContent = <TeacherDashboard />;
        break;
      case 'Student':
        roleSpecificContent = <StudentDashboard />;
        break;
      default:
        roleSpecificContent = <p>No specific dashboard content for your role.</p>;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description={welcomeMessage} icon={Home} />
      <div className="animate-fadeIn">
        {roleSpecificContent}
      </div>
    </div>
  );
}
