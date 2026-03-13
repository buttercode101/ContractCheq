import React, { Component } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

class AppErrorBoundary extends (Component as any) {
  state = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || 'Unknown runtime error' };
  }

  componentDidCatch(error: Error): void {
    console.error('App runtime error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'Inter, sans-serif', padding: '2rem' }}>
          <div style={{ maxWidth: 680, background: 'white', border: '1px solid #fecaca', borderRadius: 24, padding: 24 }}>
            <h1 style={{ margin: 0, fontSize: 24, color: '#991b1b' }}>Something went wrong while rendering ContractCheck.</h1>
            <p style={{ marginTop: 12, color: '#7f1d1d' }}>
              Runtime error: <strong>{this.state.message}</strong>
            </p>
            <p style={{ marginTop: 8, color: '#9f1239' }}>
              Please refresh the page. If this persists, redeploy and verify <code>/api/version</code> returns the latest commit.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
);
