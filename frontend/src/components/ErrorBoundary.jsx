import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[RailFlow AI ErrorBoundary caught error]:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Unknown error';
      const errorStack = this.state.error?.stack || '';
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100 font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl text-center">
            <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl text-rose-400">
              ⚠️
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">Something unexpected happened</h2>
            <p className="text-sm text-slate-400 mb-4">
              RailFlow AI caught a rendering exception. Your session data remains safe.
            </p>
            <div className="mt-2 p-3 bg-slate-950 border border-slate-800 rounded-xl text-left text-xs text-red-300 font-mono break-words">
              <strong>Error:</strong> {errorMessage}
              {errorStack && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-slate-400">Stack trace</summary>
                  <pre className="mt-2 text-[10px] text-slate-500 whitespace-pre-wrap">{errorStack}</pre>
                </details>
              )}
            </div>
            <button
              onClick={this.handleReload}
              className="w-full mt-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl transition-colors shadow-lg shadow-cyan-500/20"
            >
              Refresh Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
