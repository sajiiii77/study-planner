import { Component } from "react";

// Shows a friendly screen instead of a blank page if something crashes
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="eb">
        <div className="eb-card" role="alert">
          <h1>Something went wrong</h1>
          <p>The page hit an unexpected error. Your tasks and exams are safe on the server.</p>
          <pre>{String(this.state.error.message || this.state.error)}</pre>
          <button className="btn-accent" onClick={() => window.location.reload()}>Reload the app</button>
        </div>
      </div>
    );
  }
}
