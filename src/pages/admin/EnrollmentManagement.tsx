import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Trash2, BookOpen, Users, Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';
import { Badge } from '@/components/ui/badge';

interface Student {
  id: number;
  name: string;
  email: string;
  prn: string;
}

interface Subject {
  id: number;
  name: string;
  code: string;
  teacher?: {
    name: string;
  };
}

interface Enrollment {
  student_id: number;
  subject_id: number;
  student_name: string;
  subject_name: string;
  subject_code: string;
  enrollment_date: string;
}

const EnrollmentManagement: React.FC = () => {
  const { toast } = useToast();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load students
      const usersData = await apiService.getUsers();
      const studentsData = usersData.filter((u: any) => u.role === 'student');
      setStudents(studentsData);

      // Load subjects
      const subjectsData = await apiService.getSubjects();
      setSubjects(subjectsData);

      // Load all enrollments (we'll need to fetch enrolled students for each subject)
      const allEnrollments: Enrollment[] = [];
      for (const subject of subjectsData) {
        try {
          const enrolledStudents = await apiService.getEnrolledStudents(subject.id);
          for (const student of enrolledStudents) {
            allEnrollments.push({
              student_id: student.id,
              subject_id: subject.id,
              student_name: student.name,
              subject_name: subject.name,
              subject_code: subject.code,
              enrollment_date: student.enrollment_date || new Date().toISOString()
            });
          }
        } catch (error) {
          console.error(`Error loading enrollments for subject ${subject.id}:`, error);
        }
      }
      setEnrollments(allEnrollments);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load enrollment data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!selectedStudent || !selectedSubject) {
      toast({
        title: "Missing Information",
        description: "Please select both a student and a subject.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsEnrolling(true);
      
      await apiService.enrollStudent(parseInt(selectedSubject), {
        student_id: parseInt(selectedStudent),
        subject_id: parseInt(selectedSubject)
      });

      toast({
        title: "Success",
        description: "Student enrolled successfully!"
      });

      // Reset selections and reload data
      setSelectedStudent('');
      setSelectedSubject('');
      await loadData();

    } catch (error: any) {
      console.error('Error enrolling student:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to enroll student. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleUnenroll = async (studentId: number, subjectId: number) => {
    if (!window.confirm('Are you sure you want to unenroll this student? This will also remove their attendance records for this subject.')) {
      return;
    }

    try {
      // Note: We need to add an unenroll endpoint to the backend
      // For now, we'll show an error
      toast({
        title: "Not Implemented",
        description: "Unenroll functionality will be added soon. For now, please manage enrollments through the database.",
        variant: "destructive"
      });
    } catch (error) {
      console.error('Error unenrolling student:', error);
      toast({
        title: "Error",
        description: "Failed to unenroll student. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Get student's enrolled subjects
  const getStudentEnrollments = (studentId: number) => {
    return enrollments.filter(e => e.student_id === studentId);
  };

  // Get subject's enrolled students
  const getSubjectEnrollments = (subjectId: number) => {
    return enrollments.filter(e => e.subject_id === subjectId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading enrollments...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-foreground mb-6">Enrollment Management</h1>

        {/* Enroll Student Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Enroll Student in Subject
            </CardTitle>
            <CardDescription>
              Select a student and subject to create a new enrollment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Student</label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.name} ({student.prn})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name} ({subject.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={handleEnroll}
                  disabled={!selectedStudent || !selectedSubject || isEnrolling}
                  className="w-full"
                >
                  {isEnrolling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enrolling...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Enroll
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enrollments Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Student */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Students & Their Subjects
              </CardTitle>
              <CardDescription>
                View which subjects each student is enrolled in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {students.map((student) => {
                  const studentEnrollments = getStudentEnrollments(student.id);
                  return (
                    <div key={student.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{student.name}</h3>
                          <p className="text-sm text-muted-foreground">{student.prn}</p>
                        </div>
                        <Badge variant="secondary">
                          {studentEnrollments.length} {studentEnrollments.length === 1 ? 'subject' : 'subjects'}
                        </Badge>
                      </div>
                      {studentEnrollments.length > 0 ? (
                        <div className="mt-2 space-y-1">
                          {studentEnrollments.map((enrollment) => (
                            <div 
                              key={`${enrollment.student_id}-${enrollment.subject_id}`}
                              className="flex items-center justify-between text-sm bg-muted/50 rounded p-2"
                            >
                              <span>{enrollment.subject_name} ({enrollment.subject_code})</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-2">Not enrolled in any subjects</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* By Subject */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Subjects & Their Students
              </CardTitle>
              <CardDescription>
                View which students are enrolled in each subject
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {subjects.map((subject) => {
                  const subjectEnrollments = getSubjectEnrollments(subject.id);
                  return (
                    <div key={subject.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{subject.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {subject.code} • {subject.teacher?.name || 'No teacher assigned'}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {subjectEnrollments.length} {subjectEnrollments.length === 1 ? 'student' : 'students'}
                        </Badge>
                      </div>
                      {subjectEnrollments.length > 0 ? (
                        <div className="mt-2 space-y-1">
                          {subjectEnrollments.map((enrollment) => (
                            <div 
                              key={`${enrollment.student_id}-${enrollment.subject_id}`}
                              className="flex items-center justify-between text-sm bg-muted/50 rounded p-2"
                            >
                              <span>{enrollment.student_name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-2">No students enrolled</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Enrollments Table */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>All Enrollments ({enrollments.length})</CardTitle>
            <CardDescription>
              Complete list of all student-subject enrollments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Subject Code</TableHead>
                    <TableHead>Enrollment Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No enrollments yet. Start by enrolling students in subjects above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    enrollments.map((enrollment, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{enrollment.student_name}</TableCell>
                        <TableCell>{enrollment.subject_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{enrollment.subject_code}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(enrollment.enrollment_date).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnrollmentManagement;

