import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { BookOpen, Users, Calendar, GraduationCap, Loader2 } from 'lucide-react';

interface Subject {
  id: number;
  name: string;
  code: string;
  description: string;
  teacher_id: number;
  enrolledCount?: number;
}

const MySubjects: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSubjects();
  }, [user]);

  const loadSubjects = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const data = await apiService.getSubjects({ teacher_id: user.id });
      
      // Load enrolled student count for each subject
      const subjectsWithCounts = await Promise.all(
        data.map(async (subject) => {
          try {
            const enrolledStudents = await apiService.getEnrolledStudents(subject.id);
            return {
              ...subject,
              enrolledCount: enrolledStudents.length
            };
          } catch (error) {
            console.error(`Error loading enrollments for subject ${subject.id}:`, error);
            return {
              ...subject,
              enrolledCount: 0
            };
          }
        })
      );
      
      setSubjects(subjectsWithCounts);
    } catch (error) {
      console.error('Error loading subjects:', error);
      toast({
        title: "Error",
        description: "Failed to load subjects",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading your subjects...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">My Subjects</h1>
          </div>
          <p className="text-muted-foreground">
            View all subjects assigned to you
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Subjects
                </CardTitle>
                <BookOpen className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{subjects.length}</div>
              <p className="text-xs text-muted-foreground">Active this semester</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Departments
                </CardTitle>
                <Calendar className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">CS</div>
              <p className="text-xs text-muted-foreground">Computer Science</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Students
                </CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {subjects.reduce((sum, subject) => sum + (subject.enrolledCount || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">Across all subjects</p>
            </CardContent>
          </Card>
        </div>

        {/* Subjects List */}
        {subjects.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No Subjects Assigned
                </h3>
                <p className="text-muted-foreground">
                  You don't have any subjects assigned yet. Contact the admin to get subjects assigned.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <Card key={subject.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{subject.name}</CardTitle>
                    </div>
                    <BookOpen className="h-5 w-5 text-primary flex-shrink-0 ml-2" />
                  </div>
                  <CardDescription className="line-clamp-2">
                    {subject.description || 'No description provided'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Students:
                      </span>
                      <span className="font-medium text-foreground">
                        {subject.enrolledCount !== undefined ? subject.enrolledCount : <Loader2 className="h-4 w-4 animate-spin" />}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="default" className="bg-green-600">Active</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MySubjects;

