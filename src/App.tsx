import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Loader2 } from "lucide-react";

// Standard Imports (Reverted from lazy loading for maximum mobile stability)
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { TenantAdminPage } from "@/pages/TenantAdminPage";
import { OverviewPage } from "@/pages/OverviewPage";
import { MembersPage } from "@/pages/MembersPage";
import { EventsPage } from "@/pages/EventsPage";
import { DocumentsPage } from "@/pages/DocumentsPage";
import { CompliancePage } from "@/pages/CompliancePage";
import { FinancePage } from "@/pages/FinancePage";
import { HistoryPage } from "@/pages/HistoryPage";
import { SettingsPage } from "@/pages/SettingsPage";

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
        <Toaster position="top-right" theme="dark" />
      </AuthProvider>
    </Router>
  );
}