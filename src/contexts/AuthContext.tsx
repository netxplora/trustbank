import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  bvn: string | null;
  avatar_url: string | null;
  account_number: string | null;
  kyc_status: string;
  account_status: string;
  kyc_tier?: number;
  date_of_birth?: string | null;
  gender?: string | null;
  nationality?: string | null;
  mailing_address?: string | null;
  address?: string | null;
  city?: string | null;
  state_province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  occupation?: string | null;
  employer_name?: string | null;
  annual_income_range?: string | null;
  source_of_funds?: string | null;
  tax_id?: string | null;
  gov_id_type?: string | null;
  gov_id_number?: string | null;
  preferred_language?: string | null;
  preferred_currency?: string | null;
  loan_limit?: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    setProfile(data as Profile | null);
  };

  const checkAdmin = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      
      const roles = data?.map((r: any) => r.role) || [];
      setIsAdmin(roles.includes("admin") || roles.includes("super_admin") || roles.includes("support_admin"));
    } catch (e) {
      console.error("Error checking admin status:", e);
      setIsAdmin(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
      await checkAdmin(user.id);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        if (_event === "SIGNED_IN") {
          // Log login event
          fetch('https://api.ipify.org?format=json').then(res => res.json()).then(ipData => {
             supabase.from("audit_logs").insert({
               user_id: session.user.id,
               action: "login",
               entity_type: "auth",
               entity_id: session.user.id,
               details: { 
                 device: navigator.userAgent,
                 location: "Unknown",
               },
               ip_address: ipData.ip || "Unknown"
             }).then();
          }).catch(() => {
             supabase.from("audit_logs").insert({
               user_id: session.user.id,
               action: "login",
               entity_type: "auth",
               entity_id: session.user.id,
               details: { device: navigator.userAgent, location: "Unknown" },
               ip_address: "Unknown"
             }).then();
          });
        }
        
        setTimeout(async () => {
          await fetchProfile(session.user.id);
          await checkAdmin(session.user.id);
          setLoading(false);
        }, 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then(() => {
          checkAdmin(session.user.id).then(() => setLoading(false));
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Session Inactivity Timeout - resets on user interaction
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (user) {
      inactivityTimerRef.current = setTimeout(() => {
        signOut();
      }, SESSION_TIMEOUT_MS);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(ev => window.addEventListener(ev, resetInactivityTimer));
    resetInactivityTimer(); // Start the timer
    return () => {
      events.forEach(ev => window.removeEventListener(ev, resetInactivityTimer));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [user, resetInactivityTimer]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn("Error during Supabase sign out", error);
    }
    
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);

    // Clear all sensitive storage but preserve theme
    const theme = localStorage.getItem("vite-ui-theme");
    localStorage.clear();
    sessionStorage.clear();
    if (theme) {
      localStorage.setItem("vite-ui-theme", theme);
    }
    
    // Force a full reload to clear any memory cache (e.g. react-query)
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, isAdmin, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
