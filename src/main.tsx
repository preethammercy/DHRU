import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { WatchlistProvider } from './context/WatchlistContext';
import { MarketLiveProvider } from './context/MarketLiveContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <WatchlistProvider>
        <MarketLiveProvider>
          <App />
        </MarketLiveProvider>
      </WatchlistProvider>
    </ThemeProvider>
  </React.StrictMode>
);
