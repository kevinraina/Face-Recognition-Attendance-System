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

interface UnidentifiedPerson {
  face_index: number;
  confidence?: number;
  reason: string;
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
  const [selectedImages, setSelectedImages] = useState<File[]>([]);  // Changed to array
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);  // Changed to array
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedStudents, setDetectedStudents] = useState<Student[]>([]);
  const [unidentifiedPersons, setUnidentifiedPersons] = useState<UnidentifiedPerson[]>([]);
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
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Convert FileList to array and handle multiple files
    const fileArray = Array.from(files);
    console.log(`Selected ${fileArray.length} file(s)`);
    
    setSelectedImages(fileArray);
    
    // Create previews for all images
    const previewPromises = fileArray.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      });
    });
    
    Promise.all(previewPromises).then(previews => {
      setImagePreviews(previews);
    });
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
        // Clear any previous images
        setImagePreviews([]);
        setSelectedImages([]);
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
            const dataUrl = canvas.toDataURL('image/jpeg');
            
            // Add to existing images
            setSelectedImages(prev => [...prev, file]);
            setImagePreviews(prev => [...prev, dataUrl]);
            stopWebcam();
            
            toast({
              title: "Photo Captured",
              description: "Photo captured successfully. You can capture more or click 'Process Attendance'."
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
    if (!selectedSubject || selectedImages.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select a subject and upload/capture at least one image",
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
        notes: `Attendance taken via ${selectedImages.length} photo(s)`
      });

      // Step 2: Upload multiple images and process
      const formData = new FormData();
      selectedImages.forEach((image) => {
        formData.append('images', image);
      });
      
      const response = await fetch(`http://localhost:8000/api/attendance/sessions/${session.id}/upload-multiple-images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to process images');
      }

      const result = await response.json();
      
      // Step 3: Format detected students - ONLY PRESENT STUDENTS
      const formattedStudents: Student[] = result.detected_students
        .filter((student: any) => student.detected)  // Only present
        .map((student: any) => ({
          id: student.student_id.toString(),
          name: student.name,
          email: student.email,
          prn: student.prn || undefined,
          isPresent: true,  // All are present
          confidence: student.confidence || undefined,
          faceIndex: student.face_index !== undefined ? student.face_index : undefined
        }));

      // Step 4: Format unidentified persons
      const formattedUnidentified: UnidentifiedPerson[] = result.unidentified_persons || [];

      setDetectedStudents(formattedStudents);
      setUnidentifiedPersons(formattedUnidentified);
      setShowResults(true);

      const unidentifiedMsg = formattedUnidentified.length > 0 
        ? ` ${formattedUnidentified.length} unidentified person(s) detected.`
        : '';
      
      toast({
        title: "Processing Complete!",
        description: `Processed ${result.total_images_processed} image(s). Found ${result.total_detected} present students out of ${result.total_enrolled} enrolled.${unidentifiedMsg}`,
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
    const presentCount = detectedStudents.length;  // All displayed are present

    toast({
      title: "Attendance Saved",
      description: `Successfully saved attendance for ${presentCount} present students!`,
    });

    // Reset form
    setSelectedSubject('');
    setSelectedImages([]);
    setImagePreviews([]);
    setDetectedStudents([]);
    setUnidentifiedPersons([]);
    setShowResults(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setSelectedSubject('');
    setSelectedImages([]);
    setImagePreviews([]);
    setDetectedStudents([]);
    setUnidentifiedPersons([]);
    setShowResults(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
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
              <label className="text-sm font-medium">
                Upload Photos or Use Webcam
              </label>
              
              <div className="flex gap-3 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                  disabled={isWebcamActive}
                >
                  <Upload className="h-4 w-4" />
                  Upload Images
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
                      Stop Webcam
                    </Button>
                  </>
                )}

                {(selectedSubject || selectedImages.length > 0) && !isWebcamActive && (
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                )}

                {selectedImages.length > 0 && (
                  <Badge variant="secondary" className="text-sm py-2 px-3">
                    {selectedImages.length} photo{selectedImages.length !== 1 ? 's' : ''} selected
                  </Badge>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
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
                  <p className="text-sm text-muted-foreground mt-2">
                    Capture multiple photos from different angles for better coverage
                  </p>
                </div>
              )}

              {/* Image Previews Grid */}
              {imagePreviews.length > 0 && !isWebcamActive && (
                <div className="mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Class photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          Photo {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Process Button */}
            <Button
              onClick={processAttendance}
              disabled={!selectedSubject || selectedImages.length === 0 || isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? 'Processing...' : `Process Attendance (${selectedImages.length} photo${selectedImages.length !== 1 ? 's' : ''})`}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section - Beautiful Detection UI - PRESENT STUDENTS & UNIDENTIFIED */}
        {showResults && (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-green-500/10 via-green-400/5 to-background border-green-500/20">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-3">
                      <CheckCircle2 className="h-10 w-10 text-green-500" />
                    </div>
                    <div className="text-4xl font-bold text-green-500 mb-1">
                      {detectedStudents.length}
                    </div>
                    <div className="text-base font-medium text-foreground">Students Present</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Successfully identified
                    </div>
                  </div>
                </CardContent>
              </Card>

              {unidentifiedPersons.length > 0 && (
                <Card className="bg-gradient-to-br from-yellow-500/10 via-yellow-400/5 to-background border-yellow-500/20">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/10 mb-3">
                        <AlertCircle className="h-10 w-10 text-yellow-500" />
                      </div>
                      <div className="text-4xl font-bold text-yellow-500 mb-1">
                        {unidentifiedPersons.length}
                      </div>
                      <div className="text-base font-medium text-foreground">Unidentified</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Could not identify
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Detected Students */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-green-500" />
                  Present Students - AI Verified
                </CardTitle>
                <CardDescription>
                  These students were successfully identified in the uploaded photos. All confidence scores above threshold.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {detectedStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">No students detected</p>
                    <p className="text-sm text-muted-foreground mt-2">Try uploading more photos or from different angles</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {detectedStudents
                        .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
                        .map((student) => (
                        <div
                          key={student.id}
                          className="relative p-4 rounded-xl border-2 bg-green-50 dark:bg-green-950/20 border-green-500 shadow-green-500/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                        >
                          {/* Status Badge */}
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-green-500 hover:bg-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Present
                            </Badge>
                          </div>

                          <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <Avatar className="h-16 w-16 border-2 border-green-500">
                              <AvatarFallback className="text-lg font-bold bg-green-500 text-white">
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
                              {student.confidence !== undefined && (
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
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button onClick={saveAttendance} className="w-full" size="lg">
                      <Save className="h-4 w-4 mr-2" />
                      Save Attendance ({detectedStudents.length} Present Students)
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Unidentified Persons Section */}
            {unidentifiedPersons.length > 0 && (
              <Card className="border-yellow-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    Unidentified Persons
                  </CardTitle>
                  <CardDescription>
                    {unidentifiedPersons.length} face(s) detected that could not be matched to enrolled students
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {unidentifiedPersons.map((person, index) => (
                      <div
                        key={index}
                        className="relative p-4 rounded-xl border-2 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500/50 transition-all duration-300 hover:scale-[1.02]"
                      >
                        {/* Warning Badge */}
                        <div className="absolute top-2 right-2">
                          <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:text-yellow-400">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Unknown
                          </Badge>
                        </div>

                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <Avatar className="h-16 w-16 border-2 border-yellow-500">
                            <AvatarFallback className="text-lg font-bold bg-yellow-500 text-white">
                              ?
                            </AvatarFallback>
                          </Avatar>

                          {/* Person Info */}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-lg text-foreground">
                              Unidentified Person {index + 1}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Face #{person.face_index}
                            </div>
                            <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                              {person.reason}
                            </div>
                            
                            {/* Confidence Score if available */}
                            {person.confidence !== undefined && (
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-500"
                                    style={{ width: `${person.confidence * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                                  {Math.round(person.confidence * 100)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> These faces were detected but could not be identified. 
                      Possible reasons: not enrolled in this subject, no face photos registered, or low image quality.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TakeAttendance;