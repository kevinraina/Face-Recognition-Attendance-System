import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, Users, Save, RotateCcw, CheckCircle2, XCircle, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';

interface Student {
  id: string;
  name: string;
  email: string;
  prn?: string;
  isPresent: boolean;
  confidence?: number;
  faceIndex?: number;
}

interface Subject {
  id: string;
  name: string;
}

const TakeAttendance: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedStudents, setDetectedStudents] = useState<Student[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Load real subjects from API
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        setIsLoading(true);
        const fetchedSubjects = await apiService.getSubjects({ teacher_id: user?.id });
        const formattedSubjects: Subject[] = fetchedSubjects.map(subject => ({
          id: subject.id.toString(),
          name: subject.name
        }));
        setSubjects(formattedSubjects);
      } catch (error) {
        console.error('Error loading subjects:', error);
        toast({
          title: "Error",
          description: "Failed to load subjects. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadSubjects();
    }
  }, [user, toast]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Accept ANY file - user knows what they're doing
    console.log(`Selected file: ${file.name} (type: ${file.type || 'none'}, size: ${file.size} bytes)`);
    
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsWebcamActive(true);
        // Clear any previous image
        setImagePreview(null);
        setSelectedImage(null);
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
      toast({
        title: "Webcam Error",
        description: "Could not access webcam. Please check permissions and try again.",
        variant: "destructive"
      });
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsWebcamActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0);
        
        // Convert canvas to blob and then to file
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `webcam-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setSelectedImage(file);
            setImagePreview(canvas.toDataURL('image/jpeg'));
            stopWebcam();
            
            toast({
              title: "Photo Captured",
              description: "Photo captured successfully. Click 'Process Attendance' to continue."
            });
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  // Cleanup webcam on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  const processAttendance = async () => {
    if (!selectedSubject || !selectedImage) {
      toast({
        title: "Missing Information",
        description: "Please select a subject and upload/capture an image",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Create attendance session
      const session = await apiService.createAttendanceSession({
        subject_id: parseInt(selectedSubject),
        session_date: new Date().toISOString(),
        class_type: 'lecture',
        notes: 'Attendance taken via photo recognition'
      });

      // Step 2: Upload image and process
      const result = await apiService.uploadAttendanceImage(session.id, selectedImage);
      
      // Step 3: Format detected students
      const formattedStudents: Student[] = result.detected_students.map(student => ({
        id: student.student_id.toString(),
        name: student.name,
        email: student.email,
        prn: student.prn || undefined,
        isPresent: student.detected,
        confidence: student.confidence || undefined,
        faceIndex: student.face_index !== undefined ? student.face_index : undefined
      }));

      setDetectedStudents(formattedStudents);
      setShowResults(true);

      toast({
        title: "Processing Complete",
        description: `Detected ${result.total_detected} students present`,
      });
    } catch (error) {
      console.error('Error processing attendance:', error);
      toast({
        title: "Error",
        description: "Failed to process attendance. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleStudentPresence = (studentId: string) => {
    setDetectedStudents(students =>
      students.map(student =>
        student.id === studentId
          ? { ...student, isPresent: !student.isPresent }
          : student
      )
    );
  };

  const saveAttendance = () => {
    const presentCount = detectedStudents.filter(s => s.isPresent).length;
    const totalCount = detectedStudents.length;

    toast({
      title: "Attendance Saved",
      description: `Saved attendance for ${totalCount} students (${presentCount} present, ${totalCount - presentCount} absent)`,
    });

    // Reset form
    setSelectedSubject('');
    setSelectedImage(null);
    setImagePreview(null);
    setDetectedStudents([]);
    setShowResults(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setSelectedSubject('');
    setSelectedImage(null);
    setImagePreview(null);
    setDetectedStudents([]);
    setShowResults(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Camera className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Take Attendance</h1>
            <p className="text-muted-foreground">Capture attendance using photo recognition</p>
          </div>
        </div>

        {/* Setup Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Attendance Setup</CardTitle>
            <CardDescription>
              Select subject and upload a class photo to automatically detect students
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Subject Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Image Upload Section */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Upload Photo or Use Webcam</label>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                  disabled={isWebcamActive}
                >
                  <Upload className="h-4 w-4" />
                  Upload Image
                </Button>
                
                {!isWebcamActive ? (
                  <Button
                    variant="outline"
                    onClick={startWebcam}
                    className="flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    Use Webcam
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="default"
                      onClick={capturePhoto}
                      className="flex items-center gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      Capture Photo
                    </Button>
                    <Button
                      variant="outline"
                      onClick={stopWebcam}
                      className="flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel
                    </Button>
                  </>
                )}

                {(selectedSubject || selectedImage) && !isWebcamActive && (
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                onChange={handleImageUpload}
                className="hidden"
              />

              {/* Webcam Video */}
              {isWebcamActive && (
                <div className="mt-4 relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg border"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              )}

              {/* Image Preview */}
              {imagePreview && !isWebcamActive && (
                <div className="mt-4">
                  <img
                    src={imagePreview}
                    alt="Uploaded class photo"
                    className="max-w-full h-auto max-h-64 rounded-lg border"
                  />
                </div>
              )}
            </div>

            {/* Process Button */}
            <Button
              onClick={processAttendance}
              disabled={!selectedSubject || !selectedImage || isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? 'Processing...' : 'Process Attendance'}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section - Beautiful Detection UI */}
        {showResults && (
          <div className="space-y-6">
            {/* Stats Overview */}
            <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-3">
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                    </div>
                    <div className="text-3xl font-bold text-green-500">
                      {detectedStudents.filter(s => s.isPresent).length}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Present</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-3">
                      <XCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <div className="text-3xl font-bold text-red-500">
                      {detectedStudents.filter(s => !s.isPresent).length}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Absent</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-3">
                      <Users className="h-8 w-8 text-blue-500" />
                    </div>
                    <div className="text-3xl font-bold text-blue-500">
                      {Math.round((detectedStudents.filter(s => s.isPresent).length / detectedStudents.length) * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Attendance Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detected Students */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Detected Students
                </CardTitle>
                <CardDescription>
                  AI-powered face recognition results. Click to adjust if needed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {detectedStudents
                    .sort((a, b) => (b.isPresent ? 1 : 0) - (a.isPresent ? 1 : 0))
                    .map((student) => (
                    <div
                      key={student.id}
                      onClick={() => toggleStudentPresence(student.id)}
                      className={`
                        relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer
                        hover:scale-[1.02] hover:shadow-lg
                        ${student.isPresent 
                          ? 'bg-green-50 dark:bg-green-950/20 border-green-500 shadow-green-500/20' 
                          : 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-900'
                        }
                      `}
                    >
                      {/* Status Badge */}
                      <div className="absolute top-2 right-2">
                        {student.isPresent ? (
                          <Badge className="bg-green-500 hover:bg-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Present
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Absent
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <Avatar className={`h-16 w-16 border-2 ${
                          student.isPresent ? 'border-green-500' : 'border-red-300 dark:border-red-900'
                        }`}>
                          <AvatarFallback className={`text-lg font-bold ${
                            student.isPresent 
                              ? 'bg-green-500 text-white' 
                              : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          }`}>
                            {student.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Student Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-lg text-foreground truncate">
                            {student.name}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {student.email}
                          </div>
                          {student.prn && (
                            <div className="text-xs font-mono text-muted-foreground mt-1">
                              PRN: {student.prn}
                            </div>
                          )}
                          
                          {/* Confidence Score */}
                          {student.confidence !== undefined && student.isPresent && (
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                                  style={{ width: `${student.confidence * 100}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                {Math.round(student.confidence * 100)}%
                              </span>
                            </div>
                          )}
                          
                          {!student.isPresent && student.confidence === undefined && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-red-600 dark:text-red-400">
                              <AlertCircle className="h-3 w-3" />
                              Not detected in photo
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button onClick={saveAttendance} className="w-full" size="lg">
                  <Save className="h-4 w-4 mr-2" />
                  Save Attendance ({detectedStudents.filter(s => s.isPresent).length} Present, {detectedStudents.filter(s => !s.isPresent).length} Absent)
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default TakeAttendance;