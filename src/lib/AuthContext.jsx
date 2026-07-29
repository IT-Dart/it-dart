import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { authFetch } from "./authFetch";

const AuthContext = createContext(null);

// Nur eine aktive Sitzung pro Konto. localStorage statt sessionStorage,
// damit mehrere Tabs desselben Browsers dieselbe Sitzungs-ID teilen (sonst
// würde jeder Tab einen eigenen Herzschlag mit unterschiedlicher ID senden
// und die Sitzung wirkt nach dem Schließen des Original-Tabs fälschlich
// abgelaufen). Ein echter Login-Versuch mit denselben Zugangsdaten in
// einem ANDEREN Browser/Gerät hat dagegen sein eigenes, leeres
// localStorage und löst den Anspruchsversuch entsprechend neu aus.
const SESSION_ID_KEY = "it_dart_session_id";
const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000;

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
      supabase.from("profiles").select("is_premium, premium_until, is_admin, is_trainer, is_junior_admin, email").eq("id", user.id).single()
        .then(({ data, error }) => {
          if (cancelled) return;
          if (error) console.error("Profil konnte nicht geladen werden:", error.message);
          setProfile(data ?? { is_premium: false, premium_until: null, is_admin: false, is_trainer: false, is_junior_admin: false });
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

  // Herzschlag: solange eine Sitzung besteht, alle 2 Minuten "ich lebe
  // noch" melden, damit sie nicht nach 5 Minuten fälschlich als beendet
  // gilt. Bootstrapt auch Sitzungen, die vor Einführung dieser Funktion
  // entstanden sind (noch keine lokale Sitzungs-ID) — beansprucht dann
  // still eine neue ID, ohne den Nutzer zu unterbrechen.
  useEffect(() => {
    const user = session?.user;
    if (!user) return;
    let sid = localStorage.getItem(SESSION_ID_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem(SESSION_ID_KEY, sid);
      supabase.rpc("claim_session", { new_session_id: sid }).then(({ error }) => {
        if (error) console.error("[AuthContext] claim_session (bootstrap) failed:", error.message);
      });
    }
    const beat = () => {
      supabase.rpc("heartbeat_session", { session_id: sid }).then(({ error }) => {
        if (error) console.error("[AuthContext] heartbeat_session failed:", error.message);
      });
    };
    beat();
    const id = setInterval(beat, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(id);
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
    isJuniorAdmin: !!profile?.is_junior_admin,
    recoveryMode,
    signUp: (email, password) => supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } }),
    signIn: async (email, password, { force = false } = {}) => {
      const result = await supabase.auth.signInWithPassword({ email, password });
      if (result.error) return result;

      // Passwort ist bereits von Supabase geprüft -- jetzt zusätzlich
      // sicherstellen, dass mit diesem Konto nicht schon anderswo eine
      // aktive Sitzung läuft, bevor der Nutzer tatsächlich hereingelassen wird.
      // Läuft über eine Edge Function statt direktem RPC, damit die Client-IP
      // fürs Sicherheits-Audit-Log erfasst werden kann. `force` erlaubt einen
      // erneuten, bereits passwort-verifizierten Login-Versuch, die alte
      // (vermutlich tote) Sitzung sofort zu beenden, statt 5 Minuten auf den
      // Herzschlag-Timeout zu warten.
      const sid = crypto.randomUUID();
      let claimed = false;
      let requestFailed = false;
      let failureDetail = "";
      try {
        const res = await authFetch("claim-session", { new_session_id: sid, force });
        const d = await res.json().catch(() => ({}));
        if (res.ok) {
          claimed = !!d.claimed;
        } else {
          requestFailed = true;
          failureDetail = d.error || `Status ${res.status}`;
        }
      } catch (e) {
        requestFailed = true;
        failureDetail = e?.message || "Netzwerkfehler";
      }
      if (requestFailed) {
        await supabase.auth.signOut();
        console.error("[AuthContext] claim-session request failed:", failureDetail);
        return { data: { user: null, session: null }, error: { message: `Anmeldung fehlgeschlagen (Sitzungsprüfung nicht erreichbar): ${failureDetail}` } };
      }
      if (!claimed) {
        await supabase.auth.signOut();
        return { data: { user: null, session: null }, error: { code: "SESSION_CONFLICT", message: "Mit diesen Anmeldedaten existiert bereits eine Sitzung. Weitere Sitzung nicht möglich." } };
      }
      localStorage.setItem(SESSION_ID_KEY, sid);
      return result;
    },
    signOut: async () => {
      const sid = localStorage.getItem(SESSION_ID_KEY);
      if (sid) {
        await supabase.rpc("release_session", { session_id: sid }).then(({ error }) => {
          if (error) console.error("[AuthContext] release_session failed:", error.message);
        });
        localStorage.removeItem(SESSION_ID_KEY);
      }
      return supabase.auth.signOut();
    },
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
