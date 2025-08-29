import React from 'react';
import ReactDOM from 'react-dom/client';
import AppShell from './AppShell';
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <AppShell />
  </React.StrictMode>
);
