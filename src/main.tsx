import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './services/i18nService';
import { validateConfig } from './config/app';

// Validate configuration
const configValidation = validateConfig();
if (!configValidation.isValid) {
  console.error('❌ Missing required environment variables:', configValidation.missingVars);
  // Show user-friendly error in development
  if (import.meta.env.DEV) {
    document.body.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h2>Configuration Error</h2>
        <p>Missing required environment variables:</p>
        <ul>${configValidation.missingVars.map(v => `<li>${v}</li>`).join('')}</ul>
        <p>Please check your .env file.</p>
      </div>
    `;
    throw new Error('Configuration validation failed');
  }
}

// Add React import for optimization service
import React from 'react';
(window as any).React = React;
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
