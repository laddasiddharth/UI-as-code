import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/Login';
import GeneratorPage from './pages/generator/GeneratorPage';
import { PlusCircle, Code, Layout, TerminalSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function DashboardContent() {
  const navigate = useNavigate();
  return (
    <div className="space-y-8">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Workbench</p>
        <h1 className="font-display text-4xl sm:text-5xl text-[color:var(--ink)] mt-3">Dashboard Atelier</h1>
        <p className="text-[color:var(--muted)] mt-3 max-w-2xl">
          Curate, refine, and ship interfaces that feel designed, not generated.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div
          onClick={() => navigate('/generate')}
          className="ink-card p-6 rounded-3xl transition-all cursor-pointer group hover:-translate-y-1"
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-[color:var(--accent)]/10 text-[color:var(--accent)] group-hover:scale-110 transition-transform">
            <PlusCircle className="w-6 h-6" />
          </div>
          <h3 className="font-display text-xl text-[color:var(--ink)]">New Generation</h3>
          <p className="text-sm text-[color:var(--muted)] mt-2">Describe a UI and watch it build</p>
        </div>

        <div className="ink-card p-6 rounded-3xl transition-all cursor-pointer group hover:-translate-y-1">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-[color:var(--accent-2)]/15 text-[color:var(--accent-2)] group-hover:scale-110 transition-transform">
            <Layout className="w-6 h-6" />
          </div>
          <h3 className="font-display text-xl text-[color:var(--ink)]">Templates</h3>
          <p className="text-sm text-[color:var(--muted)] mt-2">Use a pre-built foundation</p>
        </div>

        <div className="ink-card p-6 rounded-3xl transition-all cursor-pointer group hover:-translate-y-1">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-[color:var(--accent-3)]/25 text-[color:var(--ink)] group-hover:scale-110 transition-transform">
            <Code className="w-6 h-6" />
          </div>
          <h3 className="font-display text-xl text-[color:var(--ink)]">Components</h3>
          <p className="text-sm text-[color:var(--muted)] mt-2">Browse your component library</p>
        </div>

        <div className="ink-card p-6 rounded-3xl transition-all cursor-pointer group hover:-translate-y-1">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-[color:var(--accent)]/15 text-[color:var(--accent)] group-hover:scale-110 transition-transform">
            <TerminalSquare className="w-6 h-6" />
          </div>
          <h3 className="font-display text-xl text-[color:var(--ink)]">API Keys</h3>
          <p className="text-sm text-[color:var(--muted)] mt-2">Manage external connections</p>
        </div>
      </div>

      <div className="ink-card rounded-3xl overflow-hidden">
        <div className="px-6 py-5 border-b border-[color:var(--border)] bg-[color:var(--panel)]">
          <h2 className="font-display text-xl text-[color:var(--ink)]">Recent Projects</h2>
        </div>
        <div className="p-6 text-center text-[color:var(--muted)] py-12">
          No projects found.{' '}
          <button
            onClick={() => navigate('/generate')}
            className="text-[color:var(--accent)] hover:underline font-medium"
          >
            Create one to get started!
          </button>
        </div>
      </div>
    </div>
  );
}

// Generator route uses full-screen layout (no sidebar/navbar padding)
function GeneratorRoute() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <DashboardLayout fullscreen>
        <GeneratorPage />
      </DashboardLayout>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Routes>
                  <Route
                    path="/"
                    element={
                      <DashboardLayout>
                        <DashboardContent />
                      </DashboardLayout>
                    }
                  />
                  <Route
                    path="/generate"
                    element={
                      <DashboardLayout fullscreen>
                        <GeneratorPage />
                      </DashboardLayout>
                    }
                  />
                </Routes>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
