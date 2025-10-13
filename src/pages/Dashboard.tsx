import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Users, BookOpen, Camera, Eye, ClipboardList, BarChart3, UserCheck, Calendar } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const getWelcomeMessage = () => {
    switch (user.role) {
      case 'admin':
        return {
          title: "Manage your system",
          description: "Oversee users, subjects, and system-wide attendance analytics"
        };
      case 'teacher':
        return {
          title: "Ready to take attendance?",
          description: "Capture attendance photos and manage your class records"
        };
      case 'student':
        return {
          title: "Your attendance at a glance",
          description: "Track your attendance across all enrolled subjects"
        };
      default:
        return {
          title: "Welcome to the system",
          description: "Access your dashboard features"
        };
    }
  };

  const getQuickActions = () => {
    switch (user.role) {
      case 'admin':
        return [
          {
            title: 'Manage Users',
            description: 'Add, edit, and manage system users',
            icon: Users,
            href: '/admin/users',
            color: 'text-blue-600'
          },
          {
            title: 'Manage Subjects',
            description: 'Configure subjects and assign teachers',
            icon: BookOpen,
            href: '/admin/subjects',
            color: 'text-green-600'
          },
          {
            title: 'System Analytics',
            description: 'View attendance statistics and reports',
            icon: BarChart3,
            href: '/admin/analytics',
            color: 'text-purple-600'
          },
          {
            title: 'Schedule Management',
            description: 'Manage class schedules and timetables',
            icon: Calendar,
            href: '/admin/schedules',
            color: 'text-indigo-600'
          }
        ];
      case 'teacher':
        return [
          {
            title: 'Take Attendance',
            description: 'Capture attendance using photos',
            icon: Camera,
            href: '/teacher/attendance/take',
            color: 'text-blue-600'
          },
          {
            title: 'View Attendance',
            description: 'Review past attendance records',
            icon: Eye,
            href: '/teacher/attendance/view',
            color: 'text-green-600'
          },
          {
            title: 'My Subjects',
            description: 'Manage your assigned subjects',
            icon: BookOpen,
            href: '#',
            color: 'text-orange-600'
          }
        ];
      case 'student':
        return [
          {
            title: 'My Attendance',
            description: 'View your attendance records',
            icon: ClipboardList,
            href: '/student/attendance',
            color: 'text-blue-600'
          },
          {
            title: 'Attendance Summary',
            description: 'Check your attendance percentage',
            icon: UserCheck,
            href: '/student/attendance',
            color: 'text-green-600'
          },
          {
            title: 'Class Schedule',
            description: 'View your weekly timetable',
            icon: Calendar,
            href: '/student/schedule',
            color: 'text-purple-600'
          }
        ];
      default:
        return [];
    }
  };

  const welcomeMsg = getWelcomeMessage();
  const quickActions = getQuickActions();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Hello, {user.name}!
          </h1>
          <p className="text-xl text-muted-foreground mb-1">
            {welcomeMsg.title}
          </p>
          <p className="text-muted-foreground">
            {welcomeMsg.description}
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${action.color}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{action.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {action.description}
                  </CardDescription>
                  <Link to={action.href}>
                    <Button variant="outline" size="sm" className="w-full">
                      Access
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today's Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {user.role === 'student' ? 'Present' : 'Active'}
              </div>
              <p className="text-xs text-muted-foreground">
                {user.role === 'student' ? 'Attendance marked' : 'System operational'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {user.role === 'admin' ? 'Total Users' : user.role === 'teacher' ? 'My Classes' : 'Enrolled Subjects'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {user.role === 'admin' ? '156' : user.role === 'teacher' ? '5' : '8'}
              </div>
              <p className="text-xs text-muted-foreground">
                Active this semester
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {user.role === 'student' ? 'Attendance Rate' : 'System Health'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {user.role === 'student' ? '92%' : '100%'}
              </div>
              <p className="text-xs text-muted-foreground">
                {user.role === 'student' ? 'This semester' : 'All systems operational'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;