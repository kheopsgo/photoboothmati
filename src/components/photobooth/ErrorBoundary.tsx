import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-screen w-full px-8 gap-6 bg-background text-foreground">
          <AlertCircle size={64} className="text-destructive" />
          <h1 className="font-display text-3xl text-center">Oups, un problème est survenu</h1>
          <p className="text-muted-foreground text-center max-w-md">
            L'application a rencontré une erreur inattendue. Touchez le bouton ci-dessous pour revenir à l'accueil.
          </p>
          <button
            onClick={() => {
              this.props.onReset?.();
              this.setState({ error: null });
            }}
            className="flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 font-body font-medium active:scale-95 transition-transform"
          >
            <RotateCcw size={18} />
            Retour à l'accueil
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
