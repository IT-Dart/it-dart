import { flushSync } from "react-dom";

// Sanfte Bildschirm-/Seitenwechsel (To-Do #126) ueber die native
// View-Transitions-API des Browsers -- automatischer Crossfade zwischen
// altem/neuem DOM, keine Animations-Bibliothek noetig. Geteilt zwischen
// App.jsx (page-Wechsel) und ITDart.jsx (view-Wechsel), damit dieselbe
// Logik nicht zweimal gepflegt werden muss.
//
// flushSync zwingt React, die Zustandsaenderung SYNCHRON innerhalb des
// Transition-Callbacks abzuschliessen: ohne das committet React erst NACH
// Rueckkehr des Callbacks (automatisches Batching) -- die Browser-API sieht
// "vorher" und "nachher" dann oft identisch, der Uebergang war dadurch bei
// manchen Klicks unsichtbar.
//
// Faellt in Browsern ohne Unterstuetzung oder bei aktivem
// prefers-reduced-motion automatisch auf einen einfachen State-Wechsel
// zurueck (wie AIChat.jsx).
//
// Gibt das ViewTransition-Objekt zurueck (oder null), damit der Aufrufer es
// per skipTransition() gezielt abbrechen kann, bevor ein harter Seitenwechsel
// (window.location.href) ausgeloest wird -- sonst kann ein noch nicht
// abgeschlossener Uebergang seinen Schnappschuss noch einmal ins Reload-Bild
// zeichnen (realer Regressions-Fund 2026-08-05: Wartungsseite blitzte beim
// Abmelden auf).
export function transitionState(setState, value) {
  const reduceMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (!reduceMotion && typeof document !== "undefined" && document.startViewTransition) {
    return document.startViewTransition(() => flushSync(() => setState(value)));
  }
  setState(value);
  return null;
}
