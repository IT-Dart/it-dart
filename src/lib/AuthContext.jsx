import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading, null = logged out
  const [profile, setProfile] = useState(null);
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const user = session?.user;
    if (!user) { setProfile(null); return; }
    let cancelled = false;
    supabase.from("profiles").select("is_premium, premium_until, is_admin, email").eq("id", user.id).single()
      .then(({ data }) => { if (!cancelled) setProfile(data ?? { is_premium: false, premium_until: null, is_admin: false }); });
    return () => { cancelled = true; };
  }, [session?.user?.id]);

  const hasTimedPremium = !!profile?.premium_until && new Date(profile.premium_until) > new Date();

  const value = {
    session,
    user: session?.user ?? null,
    loading: session === undefined,
    isPremium: !!profile?.is_premium || hasTimedPremium,
    premiumUntil: profile?.premium_until ?? null,
    isAdmin: !!profile?.is_admin,
    recoveryMode,
    signUp: (email, password) => supabase.auth.signUp({ email, password }),
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signOut: () => supabase.auth.signOut(),
    resetPassword: (email) => supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin }),
    updatePassword: async (password) => {
      const result = await supabase.auth.updateUser({ password });
      if (!result.error) setRecoveryMode(false);
      return result;
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
