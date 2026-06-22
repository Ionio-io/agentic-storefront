"use client";
import { Component, ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Uncaught render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cream flex items-center justify-center px-6">
          <div className="text-center max-w-sm">
            <span className="font-display text-4xl text-border/60">✦</span>
            <h2 className="font-display text-xl text-dark mt-4 mb-2">Something went wrong</h2>
            <p className="font-sans text-sm text-taupe mb-6">
              An unexpected error occurred. Please refresh the page to continue.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="font-sans text-xs tracking-[0.15em] uppercase border border-dark bg-dark text-cream px-6 py-2.5 hover:bg-warm transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
