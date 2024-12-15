import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ImageProvider } from './context/ImageContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Failed to find root element');
  throw new Error('Failed to find root element');
}

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

