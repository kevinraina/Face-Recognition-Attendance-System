import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, Trash2, User, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/services/api';

interface FaceData {
  id: string;
  registered_at: string;
  confidence: string;
}

interface StudentFaces {
  student_id: number;
  student_name: string;
  total_faces: number;
  faces: FaceData[];
}

const FaceManagement = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [faceData, setFaceData] = useState<StudentFaces | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const users = await apiService.getUsers();
      const studentUsers = users.filter((u: any) => u.role === 'student');
      setStudents(studentUsers);
    } catch (error) {
      console.error('Error loading students:', error);
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive"
      });
    }
  };

  const loadFaceData = async (studentId: number) => {
    try {
      setLoading(true);
      setSelectedStudent(studentId);
      const data = await apiService.getStudentFaces(studentId);
      setFaceData(data);
    } catch (error) {
      console.error('Error loading face data:', error);
      toast({
        title: "Error",
        description: "Failed to load face data",
        variant: "destructive"
      });
      setFaceData(null);
    } finally {
      setLoading(false);
    }
  };

  const deleteFace = async (faceId: string) => {
    if (!selectedStudent || !window.confirm('Are you sure you want to delete this face photo?')) {
      return;
    }

    try {
      await apiService.deleteSpecificFace(selectedStudent, faceId);
      toast({
        title: "Success",
        description: "Face photo deleted successfully"
      });
      // Reload face data
      loadFaceData(selectedStudent);
      // Reload students to update face_registered status
      loadStudents();
    } catch (error) {
      console.error('Error deleting face:', error);
      toast({
        title: "Error",
        description: "Failed to delete face photo",
        variant: "destructive"
      });
    }
  };

  const deleteAllFaces = async () => {
    if (!selectedStudent || !window.confirm('Are you sure you want to delete ALL face photos for this student? This cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteAllFaces(selectedStudent);
      toast({
        title: "Success",
        description: "All face photos deleted successfully"
      });
      setFaceData(null);
      setSelectedStudent(null);
      // Reload students to update face_registered status
      loadStudents();
    } catch (error) {
      console.error('Error deleting faces:', error);
      toast({
        title: "Error",
        description: "Failed to delete face photos",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Camera className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Face Photo Management</h1>
            <p className="text-muted-foreground">View and manage individual face photos for each student</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Students ({students.length})</CardTitle>
              <CardDescription>Click to view their face photos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {students.map((student) => (
                  <Button
                    key={student.id}
                    variant={selectedStudent === student.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => loadFaceData(student.id)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{student.name}</div>
                      <div className="text-xs text-muted-foreground">{student.prn}</div>
                    </div>
                    {student.face_registered && (
                      <Badge variant="success" className="ml-2">
                        <Camera className="h-3 w-3" />
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Face Photos Display */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>
                    {faceData ? `${faceData.student_name}'s Face Photos` : 'Select a student'}
                  </CardTitle>
                  <CardDescription>
                    {faceData ? `${faceData.total_faces} photo(s) registered` : 'Click on a student to view their face photos'}
                  </CardDescription>
                </div>
                {faceData && faceData.total_faces > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={deleteAllFaces}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                  Loading face data...
                </div>
              ) : !faceData ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a student from the list to view their face photos</p>
                </div>
              ) : faceData.total_faces === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No face photos registered for this student yet. Use the "Add Photos" button in User Management to upload photos.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {faceData.faces.map((face, index) => (
                      <Card key={face.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <Camera className="h-5 w-5 text-primary" />
                              <span className="font-medium">Photo {index + 1}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteFace(face.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Face ID:</span>
                              <code className="text-xs">{face.id.substring(0, 8)}...</code>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Registered:</span>
                              <span className="text-xs">
                                {new Date(face.registered_at).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Status:</span>
                              <Badge variant="success">Active</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FaceManagement;

