import React, { useEffect, useState } from 'react';
import { BarChart3, Users, BookOpen, Calendar, TrendingUp, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import apiService from '@/services/api';

const Analytics: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalSubjects: 0,
    totalSessions: 0,
    averageAttendance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [users, subjects, sessions] = await Promise.all([
        apiService.getUsers(),
        apiService.getSubjects(),
        apiService.getAttendanceSessions()
      ]);

      const students = users.filter(u => u.role === 'student');
      const teachers = users.filter(u => u.role === 'teacher');

      // Calculate average attendance from completed sessions
      const completedSessions = sessions.filter(s => s.status === 'completed');
      const avgAttendance = completedSessions.length > 0
        ? completedSessions.reduce((acc, session) => {
            const rate = session.total_students > 0 
              ? (session.present_students / session.total_students) * 100 
              : 0;
            return acc + rate;
          }, 0) / completedSessions.length
        : 0;

      setStats({
        totalUsers: users.length,
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalSubjects: subjects.length,
        totalSessions: sessions.length,
        averageAttendance: Math.round(avgAttendance)
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">System Analytics</h1>
            <p className="text-muted-foreground">Comprehensive attendance statistics and insights</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Total Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalStudents} students, {stats.totalTeachers} teachers
              </p>
            </CardContent>
          </Card>

          {/* Total Subjects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubjects}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all departments
              </p>
            </CardContent>
          </Card>

          {/* Total Sessions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSessions}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total classes recorded
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Average Attendance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Average Attendance Rate
              </CardTitle>
              <CardDescription>Overall attendance across all sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      className="text-muted"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${(stats.averageAttendance / 100) * 502.4} 502.4`}
                      className="text-primary transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold">{stats.averageAttendance}%</div>
                      <div className="text-sm text-muted-foreground">Attendance</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real System Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                System Overview
              </CardTitle>
              <CardDescription>Current system statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Students Registered</span>
                <span className="text-sm font-bold">{stats.totalStudents}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Teachers</span>
                <span className="text-sm font-bold">{stats.totalTeachers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Subjects</span>
                <span className="text-sm font-bold">{stats.totalSubjects}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Attendance Sessions</span>
                <span className="text-sm font-bold">{stats.totalSessions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average Attendance</span>
                <span className="text-sm font-bold text-green-600">{stats.averageAttendance}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Statistics</CardTitle>
            <CardDescription>System overview at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{stats.totalStudents}</div>
                <div className="text-sm text-muted-foreground mt-1">Students</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-green-600">{stats.totalTeachers}</div>
                <div className="text-sm text-muted-foreground mt-1">Teachers</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{stats.totalSubjects}</div>
                <div className="text-sm text-muted-foreground mt-1">Subjects</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-orange-600">{stats.totalSessions}</div>
                <div className="text-sm text-muted-foreground mt-1">Sessions</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;

