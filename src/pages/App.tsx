import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoginPage } from "@/pages/LoginPage";
import { MembersPage } from "@/pages/MembersPage";
import { Toaster } from "sonner";
import { Loader2 } from "lucide-react";

// This component decides which page to show
function AppRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If no session, show Login. If session exists, show the App.
  return session ? <MembersPage /> : <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster position="top-right" theme="dark" />
    </AuthProvider>
  );



