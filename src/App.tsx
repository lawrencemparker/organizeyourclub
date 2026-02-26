import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Loader2 } from "lucide-react";

// 🚀 Performance Optimization: Lazy Loading Pages
// This ensures mobile users only download the code for the page they are viewing
const LandingPage = lazy(() => import("@/pages/LandingPage").then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import("@/pages/LoginPage").then(m => ({ default: m.LoginPage })));
const TenantAdminPage = lazy(() => import("@/pages/TenantAdminPage").then(m => ({ default: m.TenantAdminPage })));
const OverviewPage = lazy(() => import("@/pages/OverviewPage").then(m => ({ default: m.OverviewPage })));
const MembersPage = lazy(() => import("@/pages/MembersPage").then(m => ({ default: m.MembersPage })));
const EventsPage = lazy(() => import("@/pages/EventsPage").then(m => ({ default: m.EventsPage })));
const DocumentsPage = lazy(() => import("@/pages/DocumentsPage").then(m => ({ default: m.DocumentsPage })));
const CompliancePage = lazy(() => import("@/pages/CompliancePage").then(m => ({ default: m.CompliancePage })));
const FinancePage = lazy(() => import("@/pages/FinancePage").then(m => ({ default: m.FinancePage })));
const HistoryPage = lazy(() => import("@/pages/HistoryPage").then(m => ({ default: m.HistoryPage })));
const SettingsPage = lazy(() => import("@/pages/SettingsPage").then(m => ({ default: m.SettingsPage })));

/**
 * PrivateRoute:
 * Only allows logged-in users. Kicks others to login.
 */
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A] text-white"><Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" /></div>;
  if (!user) return <Navigate to="/login" />;
  
  return (
    <div className="flex h-screen bg-[#0B0F1A] text-foreground overflow-hidden">
      <Sidebar />
      {/* Added pt-16 on mobile to push content down below the new hamburger menu header */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0B0F1A] to-[#1A1F2E] pt-16 md:pt-0">
        {children}
      </main>
    </div>
  );
}

/**
 * PublicRoute:
 * Only allows logged-out users. 
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A] text-white"><Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" /></div>;
  if (user) return <Navigate to="/overview" />;
  
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        {/* Suspense catches the lazy-loaded pages and shows a spinner while they download */}
        <Suspense fallback={
          <div className="h-screen w-screen flex items-center justify-center bg-[#0B0F1A]">
            <Loader2 className="animate-spin text-[var(--primary)] w-8 h-8" />
          </div>
        }>
          <Routes>
            {/* Admin Route */}
            <Route path="/admin" element={<TenantAdminPage />} />

            {/* Public / Marketing Routes */}
            <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            
            {/* Protected App Routes */}
            <Route path="/overview" element={<PrivateRoute><OverviewPage /></PrivateRoute>} />
            <Route path="/members" element={<PrivateRoute><MembersPage /></PrivateRoute>} />
            <Route path="/events" element={<PrivateRoute><EventsPage /></PrivateRoute>} />
            <Route path="/documents" element={<PrivateRoute><DocumentsPage /></PrivateRoute>} />
            <Route path="/compliance" element={<PrivateRoute><CompliancePage /></PrivateRoute>} />
            <Route path="/finance" element={<PrivateRoute><FinancePage /></PrivateRoute>} />
            <Route path="/history" element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
        <Toaster position="top-right" theme="dark" />
      </AuthProvider>
    </Router>
  );
}