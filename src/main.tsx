import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './styles/theme.css';
import { ThemeProvider } from './context/ThemeContext';
import { WatchlistProvider } from './context/WatchlistContext';
import { MotionConfig } from 'motion/react';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
    <ThemeProvider>
      <WatchlistProvider>
        <App />
      </WatchlistProvider>
    </ThemeProvider>
    </MotionConfig>
  </React.StrictMode>
);
