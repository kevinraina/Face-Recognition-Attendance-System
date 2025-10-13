import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/admin/UserManagement";
import SubjectManagement from "./pages/admin/SubjectManagement";
import Analytics from "./pages/admin/Analytics";
import ScheduleManagement from "./pages/admin/ScheduleManagement";
import FaceManagement from "./pages/admin/FaceManagement";
import EnrollmentManagement from "./pages/admin/EnrollmentManagement";
import TakeAttendance from "./pages/teacher/TakeAttendance";
import ViewAttendance from "./pages/teacher/ViewAttendance";
import MySubjects from "./pages/teacher/MySubjects";
import StudentAttendance from "./pages/student/StudentAttendance";
import StudentSchedule from "./pages/student/Schedule";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Main App Routes Component
const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <>
      {isAuthenticated && <Navigation />}
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Routes */}
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/subjects" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SubjectManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/analytics" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Analytics />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/schedules" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ScheduleManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/faces" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <FaceManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/enrollments" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <EnrollmentManagement />
            </ProtectedRoute>
          } 
        />
        
        {/* Teacher Routes */}
        <Route 
          path="/teacher/attendance/take" 
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TakeAttendance />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher/attendance/view" 
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <ViewAttendance />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher/subjects" 
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <MySubjects />
            </ProtectedRoute>
          } 
        />
        
        {/* Student Routes */}
        <Route 
          path="/student/attendance" 
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentAttendance />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/schedule" 
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentSchedule />
            </ProtectedRoute>
          } 
        />
        
        {/* Default and catch-all routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
