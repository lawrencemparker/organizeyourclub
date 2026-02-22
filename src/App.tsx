import { TenantAdminPage } from "./pages/TenantAdminPage";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { LoginPage } from "@/pages/LoginPage";
import { OverviewPage } from "@/pages/OverviewPage";
import { MembersPage } from "@/pages/MembersPage";
import { EventsPage } from "@/pages/EventsPage";
import { CompliancePage } from "@/pages/CompliancePage";
import { FinancePage } from "@/pages/FinancePage";
import { HistoryPage } from "@/pages/HistoryPage";
import { SettingsPage } from "@/pages/SettingsPage";

// NEW IMPORT: Import the Documents Page
import { DocumentsPage } from "@/pages/DocumentsPage";

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

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
		  {/* Add the new Admin route here */}
          <Route path="/admin" element={<TenantAdminPage />} />
          
          {/* Protected Routes */}
          <Route path="/" element={<PrivateRoute><OverviewPage /></PrivateRoute>} />
          <Route path="/members" element={<PrivateRoute><MembersPage /></PrivateRoute>} />
          <Route path="/events" element={<PrivateRoute><EventsPage /></PrivateRoute>} />
          
          {/* NEW ROUTE: Connects the sidebar link to the page */}
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