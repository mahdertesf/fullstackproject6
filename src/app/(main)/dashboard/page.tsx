'use client';

import { useAuthStore } from '@/store/authStore';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Home, User, BookOpen, BarChart3 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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

const StudentDashboard = () => (
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
        <CardTitle>Recent Announcements</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Midterm Registration Deadline Approaching - Mar 15, 2024</p>
      </CardContent>
    </Card>
  </div>
);


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
