import React, { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, BookOpen, User, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';

interface Schedule {
  id: number;
  subject_id: number;
  subject_name: string;
  teacher_id: number;
  teacher_name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room: string;
  class_type: string;
}

const Schedule: React.FC = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    loadSchedule();
  }, [user]);

  const loadSchedule = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await apiService.getSchedules({ student_id: user.id });
      setSchedules(data);
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group schedules by day
  const groupedSchedules = schedules.reduce((acc, schedule) => {
    if (!acc[schedule.day_of_week]) {
      acc[schedule.day_of_week] = [];
    }
    acc[schedule.day_of_week].push(schedule);
    return acc;
  }, {} as Record<string, Schedule[]>);

  const getClassTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'lecture':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'lab':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'tutorial':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Class Schedule</h1>
            <p className="text-muted-foreground">Your weekly timetable for enrolled subjects</p>
          </div>
        </div>

        {schedules.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Schedule Available</AlertTitle>
            <AlertDescription>
              You don't have any classes scheduled yet. Please contact your administrator to set up your timetable.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {daysOfWeek.map((day) => (
              <Card key={day}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {day}
                    </div>
                    <Badge variant="outline">
                      {groupedSchedules[day]?.length || 0} class(es)
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {groupedSchedules[day] && groupedSchedules[day].length > 0 ? (
                    <div className="space-y-3">
                      {groupedSchedules[day]
                        .sort((a, b) => a.start_time.localeCompare(b.start_time))
                        .map((schedule) => (
                          <div
                            key={schedule.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <BookOpen className="h-4 w-4 text-primary" />
                                <h3 className="font-semibold text-foreground">
                                  {schedule.subject_name}
                                </h3>
                                <Badge className={getClassTypeColor(schedule.class_type)}>
                                  {schedule.class_type}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{schedule.start_time} - {schedule.end_time}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span>{schedule.teacher_name}</span>
                                </div>
                                {schedule.room && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{schedule.room}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No classes scheduled for {day}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Card */}
        {schedules.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Week Overview</CardTitle>
              <CardDescription>Your weekly class summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{schedules.length}</div>
                  <div className="text-sm text-muted-foreground">Total Classes</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {new Set(schedules.map(s => s.subject_id)).size}
                  </div>
                  <div className="text-sm text-muted-foreground">Subjects</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {new Set(schedules.map(s => s.day_of_week)).size}
                  </div>
                  <div className="text-sm text-muted-foreground">Days/Week</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Schedule;

