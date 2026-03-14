import { Component } from "react";

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Keep this as console logging so we can debug "white screen" reports quickly.
        // eslint-disable-next-line no-console
        console.error("UI crashed:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                    <div className="max-w-xl w-full bg-white border border-gray-200 rounded-2xl shadow-xl p-6">
                        <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
                        <p className="mt-2 text-sm text-gray-600">
                            The page crashed. Please reload and try again.
                        </p>
                        {import.meta?.env?.DEV && this.state.error?.message && (
                            <pre className="mt-4 text-xs bg-gray-50 border border-gray-200 rounded p-3 overflow-auto">
                                {this.state.error.message}
                            </pre>
                        )}
                        <button
                            type="button"
                            className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-700 transition"
                            onClick={() => window.location.reload()}
                        >
                            Reload
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

