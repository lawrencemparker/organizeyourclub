import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  session: null, 
  user: null, 
  loading: true, 
  signOut: async () => {} 
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check active session on load
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error("Session check error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // 2. Listen for changes (login, logout, auto-refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- UPDATED SIGNOUT FUNCTION ---
  const signOut = async () => {
    try {
      // 1. Try to sign out from Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      // 2. FORCE the local state to null immediately.
      // This ensures the UI updates even if the network request fails or is slow.
      setSession(null); 
      // Optional: Clear any local storage if you use it for other things
      localStorage.removeItem("sb-access-token");
      localStorage.removeItem("sb-refresh-token");
    }
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}