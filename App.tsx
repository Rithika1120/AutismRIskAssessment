import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientAssessment from "./pages/patient/PatientAssessment";
import TherapistDashboard from "./pages/therapist/TherapistDashboard";
import PatientsList from "./pages/therapist/PatientsList";
import PatientDetail from "./pages/therapist/PatientDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'patient' | 'therapist' }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'patient' ? '/patient/dashboard' : '/therapist/dashboard'} replace />;
  }

  return <>{children}</>;
};

// Public Route - redirects to dashboard if already logged in
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={user.role === 'patient' ? '/patient/dashboard' : '/therapist/dashboard'} replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    {/* Public Routes */}
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

    {/* Patient Routes */}
    <Route path="/patient/dashboard" element={
      <ProtectedRoute requiredRole="patient">
        <PatientDashboard />
      </ProtectedRoute>
    } />
    <Route path="/patient/assessment" element={
      <ProtectedRoute requiredRole="patient">
        <PatientAssessment />
      </ProtectedRoute>
    } />

    {/* Therapist Routes */}
    <Route path="/therapist/dashboard" element={
      <ProtectedRoute requiredRole="therapist">
        <TherapistDashboard />
      </ProtectedRoute>
    } />
    <Route path="/therapist/patients" element={
      <ProtectedRoute requiredRole="therapist">
        <PatientsList />
      </ProtectedRoute>
    } />
    <Route path="/therapist/patient/:patientId" element={
      <ProtectedRoute requiredRole="therapist">
        <PatientDetail />
      </ProtectedRoute>
    } />

    {/* Catch-all */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
