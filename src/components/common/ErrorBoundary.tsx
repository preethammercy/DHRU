// DHRU.AI - Institutional Error Boundary
// Prevents blank white screens by intercepting runtime errors and providing a graceful recovery UI.

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[DHRU.AI Runtime Error Intercepted]:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.removeItem('dhru_auth_user');
      localStorage.removeItem('dhru_market_mode');
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-surface dark:bg-surface text-ink dark:text-ink">
          <div className="max-w-md w-full bg-surface dark:bg-surface border border-line dark:border-line rounded-3xl p-8  text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-surface-2 dark:bg-surface-2 border border-line dark:border-line flex items-center justify-center text-warn dark:text-warn">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black tracking-tight">Session Recovery Active</h2>
              <p className="text-xs text-ink-2 dark:text-ink-3">
                A temporary interface render issue was caught safely to preserve your account and margin data.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-surface-2 dark:bg-surface-2 rounded-xl text-left font-mono text-ink-2 dark:text-ink-3 max-h-24 overflow-y-auto border border-line dark:border-line">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-fill hover:bg-brand-fill text-on-brand font-bold text-xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Dashboard</span>
              </button>

              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-line dark:border-line text-ink-2 dark:text-ink-3 hover:bg-surface-2 dark:hover:bg-surface-2 font-semibold text-xs transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Reset View</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
