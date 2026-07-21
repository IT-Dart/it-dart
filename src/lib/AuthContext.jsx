import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const AuthContext = createContext(null);

// Invite links redirect back with `type=invite` in the URL hash (same mechanism
// Supabase uses for `type=recovery`, which fires PASSWORD_RECOVERY). Only invite
// has no dedicated auth event, so it must be read from the hash before Supabase's
// own session detection consumes and strips it.
const inviteFromUrl = typeof window !== "undefined" && window.location.hash.includes("type=invite");

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading, null = logged out
  const [profile, setProfile] = useState(null);
  const [recoveryMode, setRecoveryMode] = useState(inviteFromUrl);

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

    const fetchProfile = () => {
      supabase.from("profiles").select("is_premium, premium_until, is_admin, is_trainer, email").eq("id", user.id).single()
        .then(({ data, error }) => {
          if (cancelled) return;
          if (error) console.error("Profil konnte nicht geladen werden:", error.message);
          setProfile(data ?? { is_premium: false, premium_until: null, is_admin: false, is_trainer: false });
        });
    };

    fetchProfile();
    // Rollen (z.B. Trainer) kann ein Admin jederzeit in einer anderen Sitzung
    // ändern — beim Zurückkehren zum Tab einmal neu laden, statt bis zum
    // nächsten Login mit dem alten Stand weiterzuarbeiten.
    const onVisible = () => { if (document.visibilityState === "visible") fetchProfile(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => { cancelled = true; document.removeEventListener("visibilitychange", onVisible); };
  }, [session?.user?.id]);

  const hasTimedPremium = !!profile?.premium_until && new Date(profile.premium_until) > new Date();

  const value = {
    session,
    user: session?.user ?? null,
    loading: session === undefined,
    isPremium: !!profile?.is_premium || hasTimedPremium,
    premiumUntil: profile?.premium_until ?? null,
    isAdmin: !!profile?.is_admin,
    isTrainer: !!profile?.is_trainer,
    recoveryMode,
    signUp: (email, password) => supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } }),
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
