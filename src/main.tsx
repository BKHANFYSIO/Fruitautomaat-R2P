import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { SettingsProvider } from './context/SettingsContext'
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SettingsProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </SettingsProvider>
  </React.StrictMode>,
)
