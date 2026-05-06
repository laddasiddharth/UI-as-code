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
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-gray-500 mt-2">Welcome back to your UI-as-Code workspace.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div
          onClick={() => navigate('/generate')}
          className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <PlusCircle className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900">New Generation</h3>
          <p className="text-sm text-gray-500 mt-1">Describe a UI and watch it build</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Layout className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Templates</h3>
          <p className="text-sm text-gray-500 mt-1">Use a pre-built foundation</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Code className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Components</h3>
          <p className="text-sm text-gray-500 mt-1">Browse your component library</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <TerminalSquare className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="font-semibold text-gray-900">API Keys</h3>
          <p className="text-sm text-gray-500 mt-1">Manage external connections</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Projects</h2>
        </div>
        <div className="p-6 text-center text-gray-500 py-12">
          No projects found.{' '}
          <button onClick={() => navigate('/generate')} className="text-purple-600 hover:underline font-medium">
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
