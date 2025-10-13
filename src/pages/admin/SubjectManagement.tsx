import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Search, BookOpen } from 'lucide-react';
import { apiService } from '@/services/api';

interface Subject {
  id: string;
  name: string;
  description: string;
  teacherId: string;
  teacherName: string;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
}

interface SubjectFormData {
  name: string;
  description: string;
  teacherId: string;
}

const SubjectManagement: React.FC = () => {
  const { toast } = useToast();
  
  // Real data from API
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load real data from API - moved outside useEffect so it can be called from handlers
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load teachers
      const fetchedTeachers = await apiService.getTeachers();
      const formattedTeachers: Teacher[] = fetchedTeachers.map(teacher => ({
        id: teacher.id.toString(),
        name: teacher.name,
        email: teacher.email
      }));
      setTeachers(formattedTeachers);

      // Load subjects
      const fetchedSubjects = await apiService.getSubjects();
      const formattedSubjects: Subject[] = fetchedSubjects.map(subject => ({
        id: subject.id.toString(),
        name: subject.name,
        description: subject.description || '',
        teacherId: subject.teacher_id?.toString() || '',
        teacherName: subject.teacher?.name || 'Unassigned'
      }));
      setSubjects(formattedSubjects);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load subjects and teachers. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Mock data removed - now using real API data above
  const oldMockSubjects: Subject[] = [
    {
      id: '1',
      name: 'Mathematics',
      description: 'Advanced mathematics including calculus and algebra',
      teacherId: '2',
      teacherName: 'John Teacher'
    },
    {
      id: '2',
      name: 'Physics',
      description: 'Classical and modern physics principles',
      teacherId: '4',
      teacherName: 'Mike Johnson'
    },
    {
      id: '3',
      name: 'Computer Science',
      description: 'Programming fundamentals and data structures',
      teacherId: '6',
      teacherName: 'Sarah Thompson'
    },
    {
      id: '4',
      name: 'Chemistry',
      description: 'Organic and inorganic chemistry',
      teacherId: '7',
      teacherName: 'David Brown'
    },
  ];
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState<SubjectFormData>({
    name: '',
    description: '',
    teacherId: ''
  });

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedTeacher = teachers.find(t => t.id === formData.teacherId);
    if (!selectedTeacher) {
      toast({
        title: "Error",
        description: "Please select a teacher",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingSubject) {
        // Update existing subject via API
        await apiService.updateSubject(parseInt(editingSubject.id), {
          name: formData.name,
          description: formData.description,
          teacher_id: parseInt(formData.teacherId)
        });
        
        toast({
          title: "Success",
          description: "Subject updated successfully"
        });
      } else {
        // Create new subject via API
        await apiService.createSubject({
          name: formData.name,
          code: `SUB${Date.now()}`, // Auto-generate code
          description: formData.description,
          teacher_id: parseInt(formData.teacherId)
        });
        
        toast({
          title: "Success",
          description: "Subject created successfully"
        });
      }

      // Reload subjects from API
      await loadData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving subject:', error);
      toast({
        title: "Error",
        description: "Failed to save subject",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      description: subject.description,
      teacherId: subject.teacherId
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (subjectId: string) => {
    if (!window.confirm('Are you sure you want to delete this subject? This will remove all enrollments and attendance records for this subject.')) {
      return;
    }

    try {
      await apiService.deleteSubject(parseInt(subjectId));
      
      toast({
        title: "Success",
        description: "Subject deleted successfully"
      });
      
      // Reload subjects from API
      await loadData();
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete subject",
        variant: "destructive"
      });
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSubject(null);
    setFormData({
      name: '',
      description: '',
      teacherId: ''
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Subject Management</h1>
            <p className="text-muted-foreground">Manage subjects and assign teachers</p>
          </div>
        </div>

        {/* Actions Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search subjects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add New Subject
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingSubject ? 'Edit Subject' : 'Add New Subject'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingSubject ? 'Update subject information' : 'Create a new subject'}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Subject Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g., Mathematics"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Brief description of the subject"
                        rows={3}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="teacher">Assigned Teacher</Label>
                      <Select value={formData.teacherId} onValueChange={(value) => setFormData({...formData, teacherId: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.name} ({teacher.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1">
                        {editingSubject ? 'Update Subject' : 'Create Subject'}
                      </Button>
                      <Button type="button" variant="outline" onClick={handleCloseDialog}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Subjects Table */}
        <Card>
          <CardHeader>
            <CardTitle>Subjects ({filteredSubjects.length})</CardTitle>
            <CardDescription>
              Manage all subjects and their assigned teachers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Assigned Teacher</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={subject.description}>
                        {subject.description}
                      </div>
                    </TableCell>
                    <TableCell>{subject.teacherName}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(subject)}
                          className="flex items-center gap-1"
                        >
                          <Edit2 className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(subject.id)}
                          className="flex items-center gap-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubjectManagement;