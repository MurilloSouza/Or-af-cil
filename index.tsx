
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './LanguageContext';
import { SubscriptionProvider } from './SubscriptionContext';
import { AuthProvider } from './AuthContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <SubscriptionProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </SubscriptionProvider>
    </AuthProvider>
  </React.StrictMode>
);