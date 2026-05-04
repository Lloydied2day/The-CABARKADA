import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { motion } from "motion/react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 text-center border border-slate-100"
          >
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-red-500">
              <AlertTriangle size={40} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase">Oops! Something went wrong</h1>
            <p className="text-slate-500 mb-10 leading-relaxed font-medium">
              We encountered an unexpected error. Don't worry, your data is safe. Try refreshing the page or returning home.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-8 p-4 bg-slate-900 rounded-2xl text-left overflow-auto max-h-40">
                <code className="text-xs text-red-400 font-mono">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <Button 
                onClick={this.handleReset}
                className="h-14 rounded-2xl bg-brand-blue hover:bg-brand-dark-blue text-white font-black uppercase tracking-widest shadow-xl shadow-brand-blue/20 gap-3"
              >
                <RefreshCcw size={20} /> Reload Application
              </Button>
              <Button 
                variant="ghost"
                onClick={() => window.location.href = '/'}
                className="h-14 rounded-2xl text-slate-500 font-bold uppercase tracking-widest hover:bg-slate-100 gap-3"
              >
                <Home size={20} /> Back to Home
              </Button>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
