import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Nach jedem Deployment bekommen Chunk-Dateien (z. B. der dynamisch
// nachgeladene jsPDF-Baustein) einen neuen Hash im Dateinamen. Ein Tab, der
// seit vor dem letzten Deployment offen ist, versucht dann noch den alten,
// nicht mehr existierenden Dateinamen zu laden ("Failed to fetch dynamically
// imported module") -- Vite feuert dafür dieses Event. Einmaliger Reload
// behebt es zuverlässig, ein sessionStorage-Flag verhindert eine Endlos-
// schleife, falls der Fehler doch mal einen anderen Grund hat.
window.addEventListener('vite:preloadError', () => {
  if (sessionStorage.getItem('reloaded-after-preload-error')) return;
  sessionStorage.setItem('reloaded-after-preload-error', '1');
  window.location.reload();
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
