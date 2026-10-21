import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './fonts.css';
import './styles.css';
import './site.css';

// Dev-only probes (frame perf, contrast, encode). Stripped from production.
if (import.meta.env.DEV) import('./devtools');

// The TDT instrument lives behind a flag: the product never links to it, and a
// participant must never see it by accident.
const isTdt = new URLSearchParams(window.location.search).has('tdt');

async function boot() {
  const Root = isTdt ? (await import('./TdtRunner')).default : App;
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>,
  );
}

boot();
