import { TenantAdminPage } from "./pages/TenantAdminPage";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";

// Public Pages
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";

// Protected Pages
import { OverviewPage } from "@/pages/OverviewPage";
import { MembersPage } from "@/pages/MembersPage";
import { EventsPage } from "@/pages/EventsPage";
import { DocumentsPage } from "@/pages/DocumentsPage";
import { CompliancePage } from "@/pages/CompliancePage";
import { FinancePage } from "@/pages/FinancePage";
import { HistoryPage } from "@/pages/HistoryPage";
import { SettingsPage } from "@/pages/SettingsPage";

// ─── ROUTE WRAPPERS ───────────────────────────────────────────────────

// Only allows logged-in users. Kicks others to login.
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A] text-white">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return (
    <div className="flex h-screen bg-[#0B0F1A] text-foreground overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0B0F1A] to-[#1A1F2E]">
        {children}
      </main>
    </div>
  );
}

// Only allows logged-out users. Kicks active users straight to their dashboard.
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A] text-white">Loading...</div>;
  if (user) return <Navigate to="/overview" />;
  
  return <>{children}</>;
}

// ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          
          {/* Public / Marketing Routes */}
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          {/* If you add a /register page later, wrap it in <PublicRoute> here! */}

          {/* Admin Route */}
          <Route path="/admin" element={<TenantAdminPage />} />
          
          {/* Protected App Routes */}
          <Route path="/overview" element={<PrivateRoute><OverviewPage /></PrivateRoute>} />
          <Route path="/members" element={<PrivateRoute><MembersPage /></PrivateRoute>} />
          <Route path="/events" element={<PrivateRoute><EventsPage /></PrivateRoute>} />
          <Route path="/documents" element={<PrivateRoute><DocumentsPage /></PrivateRoute>} />
          <Route path="/compliance" element={<PrivateRoute><CompliancePage /></PrivateRoute>} />
          <Route path="/finance" element={<PrivateRoute><FinancePage /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
          
          {/* Fallback - Catch bad URLs and send them to the landing page */}
          <Route path="*" element={<Navigate to="/" />} />
          
        </Routes>
        <Toaster position="top-right" theme="dark" />
      </AuthProvider>
    </Router>
  );
}