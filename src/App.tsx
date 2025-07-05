
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { LoginForm } from "@/components/LoginForm";
import { SignUpForm } from "@/components/SignUpForm";
import { ResetPassword } from "@/pages/ResetPassword";
import { Dashboard } from "@/pages/Dashboard";
import { Students } from "@/pages/Students";
import { MarkAttendance } from "@/pages/MarkAttendance";
import { Courses } from "@/pages/Courses";
import { AcademicYears } from "@/pages/AcademicYears";
import { Reports } from "@/pages/Reports";
import { Admin } from "@/pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/signup" element={<SignUpForm />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/"
              element={
                <AuthGuard>
                  <DashboardLayout />
                </AuthGuard>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="attendance" element={<MarkAttendance />} />
              <Route path="reports" element={<Reports />} />
              <Route path="students" element={<Students />} />
              <Route path="courses" element={<Courses />} />
              <Route path="years" element={<AcademicYears />} />
              <Route path="admin" element={<Admin />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
