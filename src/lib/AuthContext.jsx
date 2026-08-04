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

// Ein abgelaufener oder bereits verwendeter Magic-Link (z.B. nach der
// Einladungs-Zwischenseite in EinladungScreen.jsx) schickt Supabase
// ebenfalls per URL-Hash zurück, aber als Fehler statt als Session:
// `#error=access_denied&error_code=otp_expired&error_description=...`.
// Muss aus demselben Grund wie inviteFromUrl oben VOR Supabases eigener
// Session-Erkennung ausgelesen werden.
const authErrorFromUrl = (() => {
  if (typeof window === "undefined") return null;
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  if (hash.get("error") !== "access_denied") return null;
  return { code: hash.get("error_code"), description: hash.get("error_description") };
})();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading, null = logged out
  const [profile, setProfile] = useState(null);
  const [recoveryMode, setRecoveryMode] = useState(inviteFromUrl);
  const [kickedOut, setKickedOut] = useState(false);
  const [authError, setAuthError] = useState(authErrorFromUrl);

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
      supabase.from("profiles").select("is_premium, premium_until, is_admin, is_trainer, is_junior_admin, email, needs_password_setup").eq("id", user.id).single()
        .then(({ data, error }) => {
          if (cancelled) return;
          if (error) console.error("Profil konnte nicht geladen werden:", error.message);
          setProfile(data ?? { is_premium: false, premium_until: null, is_admin: false, is_trainer: false, is_junior_admin: false, needs_password_setup: false });
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
    // Während recoveryMode (Passwort-Reset-/Einladungs-Link) darf dieser
    // Effect nicht laufen: die frische, gerade erst aus der URL aufgebaute
    // Session hat noch keine aktive_session_id beansprucht -- claim_session()
    // würde sie sofort setzen, der eigene Realtime-Kanal unten empfängt
    // dieses eigene UPDATE dann als vermeintliches "anderes Gerät" und meldet
    // den Nutzer noch vor dem Absenden des neuen Passworts wieder ab
    // ("Auth session missing!" beim updateUser()-Aufruf, To-Do #108). Sobald
    // updatePassword() recoveryMode auf false setzt, läuft dieser Effect
    // ganz normal für die jetzt echte Sitzung an.
    if (!user || recoveryMode) return;
    let sid = localStorage.getItem(SESSION_ID_KEY);
    let stopped = false;
    let intervalId = null;

    const kickOut = () => {
      if (stopped) return;
      stopped = true;
      localStorage.removeItem(SESSION_ID_KEY);
      setKickedOut(true);
      supabase.auth.signOut();
    };

    const beat = () => {
      supabase.rpc("heartbeat_session", { session_id: sid }).then(({ data, error }) => {
        if (error) { console.error("[AuthContext] heartbeat_session failed:", error.message); return; }
        // false heisst: ein anderes Geraet hat diese Sitzung per force
        // uebernommen (aktiver_session_id in der DB ist nicht mehr diese
        // hier) -- sofort lokal abmelden statt bis zum naechsten Reload
        // unbemerkt weiterzulaufen. Dient hier nur noch als Ausfallsicherung
        // fuer den Realtime-Kanal unten (z.B. bei getrennter Verbindung).
        if (data === false) kickOut();
      });
    };

    // Realtime: sobald sich die eigene profiles-Zeile aendert (z.B. weil ein
    // anderes Geraet die Sitzung per force uebernommen hat), sofort reagieren
    // statt bis zu 2 Minuten auf den naechsten Herzschlag zu warten -- genau
    // das war mit "aktivem" Kick-out (Task #6) gemeint, ein reines Polling
    // liess ein verdraengtes Geraet sonst kurzzeitig weiter "angemeldet"
    // wirken. RLS ("Users can read own profile") filtert automatisch auf
    // die eigene Zeile.
    const channel = supabase
      .channel(`profile-session-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (payload) => {
          const newActive = payload.new?.active_session_id;
          if (newActive && newActive !== sid) kickOut();
        }
      )
      .subscribe();

    // Kein sofortiger Herzschlag mehr direkt nach dem Anspruch: claim_session
    // (bzw. die claim-session Edge Function bei signIn()) setzt
    // session_last_seen_at bereits selbst beim Beanspruchen -- ein
    // synchron direkt danach abgefeuerter Herzschlag konkurrierte mit
    // genau diesem noch laufenden Anspruch-Request um den DB-Schreibzugriff
    // und meldete faelschlich "abgemeldet", sobald er zuerst ankam (echter
    // Bug, hat gerade jeden frischen Login sofort wieder rueckgaengig
    // gemacht). Der erste echte Herzschlag darf daher erst greifen, wenn
    // ein etwaiger Bootstrap-Anspruch garantiert abgeschlossen ist.
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem(SESSION_ID_KEY, sid);
      supabase.rpc("claim_session", { new_session_id: sid }).then(({ error }) => {
        if (error) console.error("[AuthContext] claim_session (bootstrap) failed:", error.message);
      }).finally(() => { if (!stopped) intervalId = setInterval(beat, HEARTBEAT_INTERVAL_MS); });
    } else {
      intervalId = setInterval(beat, HEARTBEAT_INTERVAL_MS);
    }
    return () => { stopped = true; if (intervalId) clearInterval(intervalId); supabase.removeChannel(channel); };
  }, [session?.user?.id, recoveryMode]);

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
    needsPasswordSetup: !!profile?.needs_password_setup,
    recoveryMode,
    kickedOut,
    dismissKickedOut: () => setKickedOut(false),
    authError,
    dismissAuthError: () => setAuthError(null),
    signUp: (email, password) => supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } }),
    signIn: async (email, password) => {
      setKickedOut(false);
      const result = await supabase.auth.signInWithPassword({ email, password });
      if (result.error) return result;

      // Passwort ist bereits von Supabase geprüft -- jetzt zusätzlich diese
      // Sitzung als die aktive beanspruchen (immer sofort, bedingungslos:
      // der neueste Login gewinnt, eine eventuell noch aktive andere
      // Sitzung wird per Realtime aktiv abgemeldet, siehe Herzschlag-Effect
      // unten). Läuft über eine Edge Function statt direktem RPC, damit die
      // Client-IP fürs Sicherheits-Audit-Log erfasst werden kann.
      const sid = crypto.randomUUID();
      // Sofort setzen, BEVOR der Server-Aufruf läuft: die gerade ausgelöste
      // Session-Änderung lässt den Herzschlag-Bootstrap-Effect (unten)
      // ebenfalls sofort anspringen -- findet er hier schon eine ID vor,
      // generiert er keine eigene, konkurrierende Sitzungs-ID mehr. Ohne
      // das entsteht ein Wettlauf zwischen zwei claim_session-Aufrufen mit
      // zwei verschiedenen IDs, bei dem Browser-Speicher und Datenbank am
      // Ende auseinanderlaufen können.
      localStorage.setItem(SESSION_ID_KEY, sid);
      try {
        const res = await authFetch("claim-session", { new_session_id: sid });
        const d = await res.json().catch(() => ({}));
        if (!res.ok || !d.claimed) throw new Error(d.error || `Status ${res.status}`);
      } catch (e) {
        localStorage.removeItem(SESSION_ID_KEY);
        await supabase.auth.signOut();
        console.error("[AuthContext] claim-session failed:", e?.message);
        return { data: { user: null, session: null }, error: { message: `Anmeldung fehlgeschlagen (Sitzungsprüfung nicht erreichbar): ${e?.message || "Netzwerkfehler"}` } };
      }
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
      if (!result.error) {
        setRecoveryMode(false);
        if (profile?.needs_password_setup) {
          const { error } = await supabase.rpc("clear_needs_password_setup");
          if (error) console.error("[AuthContext] needs_password_setup clear failed:", error.message);
          else setProfile((p) => p && { ...p, needs_password_setup: false });
        }
      }
      return result;
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
