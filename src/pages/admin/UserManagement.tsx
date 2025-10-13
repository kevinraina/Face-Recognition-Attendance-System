import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Search, Users, Camera, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { User, UserRole } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';

interface UserFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  prn?: string;
}

const UserManagement: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFaceFor, setUploadingFaceFor] = useState<number | null>(null);
  const faceInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    prn: ''
  });

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const fetchedUsers = await apiService.getUsers({ search: searchTerm });
      setUsers(fetchedUsers);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterFace = async (userId: number, file: File) => {
    try {
      setUploadingFaceFor(userId);
      
      // Create FormData
      const formData = new FormData();
      formData.append('img', file);
      
      // Call API
      const response = await fetch(`http://localhost:8000/api/students/${userId}/register-face`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to register face');
      }
      
      toast({
        title: "Success",
        description: "Face registered successfully! Student can now be detected in group photos.",
      });
      
      // Reload users to update face_registered status
      loadUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register face",
        variant: "destructive"
      });
    } finally {
      setUploadingFaceFor(null);
    }
  };

  const triggerFaceUpload = (userId: number) => {
    setUploadingFaceFor(userId);
    if (faceInputRef.current) {
      faceInputRef.current.click();
    }
  };

  const handleFaceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !uploadingFaceFor) return;

    // Accept ALL files - no validation! User knows what they're uploading.
    const imageFiles = Array.from(files);
    
    console.log(`Selected ${imageFiles.length} file(s):`, imageFiles.map(f => `${f.name} (type: ${f.type || 'none'})`));

    // Upload all images
    let successCount = 0;
    for (let i = 0; i < imageFiles.length; i++) {
      try {
        await handleRegisterFace(uploadingFaceFor, imageFiles[i]);
        successCount++;
        
        // Small delay between uploads
        if (i < imageFiles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Error uploading photo ${i + 1}:`, error);
      }
    }

    const photoText = successCount === 1 ? "photo" : "photos";
    toast({
      title: "Upload Complete",
      description: `Successfully uploaded ${successCount} ${photoText}${imageFiles.length > successCount ? ` (${imageFiles.length - successCount} failed)` : ''}`,
    });

    // Reset input
    if (faceInputRef.current) {
      faceInputRef.current.value = '';
    }
  };

  // Reload users when search term changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadUsers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      if (editingUser) {
        // Update existing user
        const updatedUser = await apiService.updateUser(editingUser.id, {
          name: formData.name,
          email: formData.email,
          role: formData.role
        });
        
        toast({
          title: "Success",
          description: "User updated successfully"
        });
      } else {
        // Add new user
        await apiService.createUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          prn: formData.role === 'student' ? formData.prn : undefined
        });
        
        toast({
          title: "Success",
          description: "User created successfully"
        });
      }

      handleCloseDialog();
      loadUsers(); // Refresh the user list
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      confirmPassword: '',
      role: user.role,
      prn: user.prn || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (userId: number) => {
    try {
      setIsLoading(true);
      await apiService.deleteUser(userId);
      toast({
        title: "Success",
        description: "User deleted successfully"
      });
      loadUsers(); // Refresh the user list
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'student',
      prn: ''
    });
  };

  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'teacher':
        return 'bg-blue-100 text-blue-800';
      case 'student':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Hidden file input for face registration - Supports UNLIMITED multiple uploads */}
        <input
          ref={faceInputRef}
          type="file"
          accept="*/*"
          multiple
          onChange={handleFaceFileChange}
          className="hidden"
        />
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground">Manage system users and their roles</p>
          </div>
        </div>

        {/* Actions Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add New User
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingUser ? 'Edit User' : 'Add New User'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingUser ? 'Update user information' : 'Create a new user account'}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                      />
                    </div>
                    
                    {formData.role === 'student' && (
                      <div className="space-y-2">
                        <Label htmlFor="prn">PRN / Student ID</Label>
                        <Input
                          id="prn"
                          value={formData.prn || ''}
                          onChange={(e) => setFormData({...formData, prn: e.target.value})}
                          placeholder="e.g., PRN001"
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required={!editingUser}
                        placeholder={editingUser ? "Leave blank to keep current" : ""}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        required={!editingUser}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={formData.role} onValueChange={(value: UserRole) => setFormData({...formData, role: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1" disabled={isLoading}>
                        {isLoading ? 'Processing...' : (editingUser ? 'Update User' : 'Create User')}
                      </Button>
                      <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isLoading}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
            <CardDescription>
              Manage all system users and their permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Face Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.role === 'student' && (
                        user.face_registered ? (
                          <Badge className="bg-green-500 hover:bg-green-600">
                            <Check className="h-3 w-3 mr-1" />
                            Registered
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Not Registered
                          </Badge>
                        )
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {user.role === 'student' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => triggerFaceUpload(user.id)}
                            disabled={uploadingFaceFor === user.id}
                            className="flex items-center gap-1"
                          >
                            <Camera className="h-3 w-3" />
                            {uploadingFaceFor === user.id ? 'Uploading...' : 'Add Photos'}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(user)}
                          className="flex items-center gap-1"
                        >
                          <Edit2 className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(user.id)}
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

export default UserManagement;