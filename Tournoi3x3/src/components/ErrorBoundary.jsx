import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: "2rem",
          maxWidth: 600,
          margin: "4rem auto",
          background: "#fef2f2",
          border: "1.5px solid #fca5a5",
          borderRadius: 12,
          fontFamily: "system-ui, sans-serif",
        }}>
          <h2 style={{ color: "#dc2626", marginBottom: "1rem" }}>
            ⚠️ Une erreur s'est produite
          </h2>
          <p style={{ color: "#7f1d1d", marginBottom: "1rem" }}>
            {this.state.error?.message || "Erreur inconnue"}
          </p>
          <details style={{ marginBottom: "1.5rem" }}>
            <summary style={{ cursor: "pointer", color: "#dc2626", fontSize: ".85rem" }}>
              Détails techniques
            </summary>
            <pre style={{
              marginTop: "0.5rem",
              fontSize: ".75rem",
              color: "#991b1b",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}>
              {this.state.error?.stack}
            </pre>
          </details>
          <button
            onClick={() => this.handleReset()}
            style={{
              background: "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Réessayer
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
