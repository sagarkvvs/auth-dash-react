
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
              <Route path="attendance" element={<div className="p-6"><h2 className="text-2xl font-bold">Attendance Tracking</h2><p className="text-gray-600 mt-2">Feature coming soon...</p></div>} />
              <Route path="reports" element={<div className="p-6"><h2 className="text-2xl font-bold">Reports</h2><p className="text-gray-600 mt-2">Feature coming soon...</p></div>} />
              <Route path="students" element={<div className="p-6"><h2 className="text-2xl font-bold">Student Management</h2><p className="text-gray-600 mt-2">Feature coming soon...</p></div>} />
              <Route path="years" element={<div className="p-6"><h2 className="text-2xl font-bold">Academic Years</h2><p className="text-gray-600 mt-2">Feature coming soon...</p></div>} />
              <Route path="admin" element={<div className="p-6"><h2 className="text-2xl font-bold">Admin Management</h2><p className="text-gray-600 mt-2">Feature coming soon...</p></div>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
