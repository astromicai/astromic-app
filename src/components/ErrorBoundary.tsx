import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen w-full flex flex-col items-center justify-center p-8 text-center bg-background-dark text-white">
                    <div className="mb-6 rounded-full bg-red-500/10 p-6">
                        <span className="material-symbols-outlined text-5xl text-red-400">error_outline</span>
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
                    <p className="text-white/60 mb-8 max-w-sm mx-auto">
                        The stars are realigning. A rendering error occurred.
                    </p>
                    <div className="bg-black/30 p-4 rounded-xl text-left text-xs font-mono text-white/40 mb-8 w-full max-w-md overflow-x-auto">
                        {this.state.error?.message}
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-alt font-bold transition-all"
                    >
                        Reload Application
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
