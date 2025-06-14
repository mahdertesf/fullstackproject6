// src/app/(main)/dashboard/page.tsx
'use client';

import { useAuthStore } from '@/store/authStore';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Home, User, BookOpen, BarChart3, Speaker as SpeakerIcon, Users, CalendarPlus, UserPlus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useEffect, useState, useMemo } from 'react';

// Actions
import { getAdminDashboardStats, type DashboardStats as AdminDashboardStats } from '@/actions/adminActions';
import { getStaffDashboardStats, type StaffDashboardStats } from '@/actions/staffActions';
import { getAnnouncementsForUser } from '@/actions/announcementActions';
import { getStudentRegistrations } from '@/actions/studentActions'; 
import { getScheduledCoursesByTeacher } from '@/actions/scheduledCourseActions'; 
import type { Announcement, ScheduledCourse as PrismaScheduledCourse, Course as PrismaCourse, Semester as PrismaSemester, User as PrismaUser, UserProfile } from '@prisma/client';

// Types for enriched data
type StudentScheduledCourse = PrismaScheduledCourse & { course: PrismaCourse | null; semester: PrismaSemester | null; };
type TeacherScheduledCourse = PrismaScheduledCourse & { course: PrismaCourse | null; semester: PrismaSemester | null; };


const AdminDashboardContent = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminDashboardStats().then(data => {
      setStats(data);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load admin stats:", err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!stats) return <p>Could not load dashboard statistics.</p>;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeCourses}</div>
          <p className="text-xs text-muted-foreground">Distinct courses in current/future semesters</p>
        </CardContent>
      </Card>
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Health</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">Optimal</div>
          <p className="text-xs text-muted-foreground">All systems operational (Placeholder)</p>
        </CardContent>
      </Card>
    </div>
  );
};

const StaffDashboardContent = () => {
  const [stats, setStats] = useState<StaffDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStaffDashboardStats().then(data => {
      setStats(data);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load staff stats:", err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!stats) return <p>Could not load staff dashboard statistics.</p>;
  
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Scheduled Courses</CardTitle>
          <CalendarPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.upcomingScheduledCourses}</div>
          <p className="text-xs text-muted-foreground">Courses scheduled for next month</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New Student/Teacher Accounts</CardTitle>
          <UserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.recentStudentTeacherAccounts}</div>
          <p className="text-xs text-muted-foreground">Created in the last 7 days</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Quick Links</CardTitle>
           <User className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex flex-col space-y-2">
          <Button asChild variant="outline" size="sm"><Link href="/staff/schedule-courses">Schedule Course</Link></Button>
          <Button asChild variant="outline" size="sm"><Link href="/announcements/create">Create Announcement</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
};

const TeacherDashboardContent = ({ user }: { user: UserProfile }) => {
  const [myCourses, setMyCourses] = useState<TeacherScheduledCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user.user_id) {
      getScheduledCoursesByTeacher(user.user_id).then(data => {
        setMyCourses(data as TeacherScheduledCourse[]); 
        setLoading(false);
      }).catch(err => {
         console.error("Failed to load teacher courses:", err);
         setLoading(false);
      });
    }
  }, [user.user_id]);

  if (loading) return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>My Active Courses</CardTitle>
          <CardDescription>Courses you are teaching this semester.</CardDescription>
        </CardHeader>
        <CardContent>
          {myCourses.length > 0 ? (
            <ul className="space-y-2">
              {myCourses.slice(0,3).map(sc => ( 
                <li key={sc.scheduled_course_id} className="text-sm">
                  <Link href={`/teacher/my-courses/${sc.scheduled_course_id}`} className="font-medium hover:underline">
                    {sc.course?.course_code} - {sc.course?.title}
                  </Link>
                  <span className="text-muted-foreground"> (Sec: {sc.section_number}) - {sc.semester?.name}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">No courses assigned for the current/upcoming semesters.</p>}
          <Link href="/teacher/my-courses"><Button variant="link" className="p-0 mt-2 h-auto text-sm">View all my courses</Button></Link>
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
          <CardTitle>Upcoming Deadlines</CardTitle>
           <CardDescription>Assessments due soon for your courses. (Placeholder)</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Homework 1 (Placeholder) - Due in 3 days</p>
        </CardContent>
      </Card>
    </div>
  );
};

const StudentDashboardContent = ({ user }: { user: UserProfile }) => {
  const [schedule, setSchedule] = useState<StudentScheduledCourse[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  
  const now = useMemo(() => new Date(), []);

  useEffect(() => {
    if (user.user_id) {
      getStudentRegistrations(user.user_id).then(regs => { 
        const currentRegs = regs
            .filter(r => r.scheduledCourse?.semester?.end_date && new Date(r.scheduledCourse.semester.end_date) >= now && new Date(r.scheduledCourse.semester.start_date) <= now) 
            .map(r => r.scheduledCourse)
            .filter(Boolean) as StudentScheduledCourse[];
        setSchedule(currentRegs);
        setLoadingSchedule(false);
      }).catch(err => { console.error("Failed to load student schedule:", err); setLoadingSchedule(false); });

      getAnnouncementsForUser(user as PrismaUser).then(data => { 
        setAnnouncements(data);
        setLoadingAnnouncements(false);
      }).catch(err => { console.error("Failed to load announcements:", err); setLoadingAnnouncements(false); });
    }
  }, [user, now]);

  const recentAnnouncements = useMemo(() => {
    return announcements.slice(0, 3); 
  }, [announcements]);


  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>My Schedule - Current Semester</CardTitle>
          <CardDescription>Your currently registered courses.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSchedule ? <div className="flex justify-center py-2"><Loader2 className="h-6 w-6 animate-spin" /></div> : schedule.length > 0 ? (
            <ul className="space-y-2">
              {schedule.slice(0,3).map(sc => (
                <li key={sc.scheduled_course_id} className="text-sm">
                  <Link href={`/courses/${sc.course?.course_id}`} className="font-medium hover:underline">
                    {sc.course?.course_code} - {sc.course?.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">No courses registered for the current semester.</p>}
          <Link href="/student/my-schedule"><Button variant="link" className="p-0 mt-2 h-auto text-sm">View full schedule</Button></Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Deadlines</CardTitle>
          <CardDescription>Assessments and tasks due soon. (Placeholder)</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Homework 1 (Placeholder) - Due in 3 days</p>
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center"><SpeakerIcon className="mr-2 h-5 w-5 text-primary" />Recent Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingAnnouncements ? <div className="flex justify-center py-2"><Loader2 className="h-6 w-6 animate-spin" /></div> : recentAnnouncements.length > 0 ? (
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
            <p className="text-sm text-muted-foreground">No recent announcements for you.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};


export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuthStore();

  if (authLoading || !user) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const welcomeMessage = `Welcome back, ${user.first_name || user.username}!`;
  let roleSpecificContent;

  if (user.is_super_admin) {
    roleSpecificContent = <AdminDashboardContent />;
  } else {
    switch (user.role) {
      case 'Staff':
        roleSpecificContent = <StaffDashboardContent />;
        break;
      case 'Teacher':
        roleSpecificContent = <TeacherDashboardContent user={user} />;
        break;
      case 'Student':
        roleSpecificContent = <StudentDashboardContent user={user} />;
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
