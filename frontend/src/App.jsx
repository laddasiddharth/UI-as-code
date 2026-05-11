import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/Login';
import GeneratorPage from './pages/generator/GeneratorPage';

import ProjectsPage from './pages/projects/ProjectsPage';
import GenerationsPage from './pages/generations/GenerationsPage';
import ComponentsPage from './pages/components/ComponentsPage';
import SettingsPage from './pages/settings/SettingsPage';


const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Removed DashboardContent

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
                      <DashboardLayout fullscreen>
                        <GeneratorPage />
                      </DashboardLayout>
                    }
                  />

                  <Route
                    path="/projects"
                    element={
                      <DashboardLayout>
                        <ProjectsPage />
                      </DashboardLayout>
                    }
                  />
                  <Route
                    path="/generations"
                    element={
                      <DashboardLayout>
                        <GenerationsPage />
                      </DashboardLayout>
                    }
                  />
                  <Route
                    path="/components"
                    element={
                      <DashboardLayout>
                        <ComponentsPage />
                      </DashboardLayout>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <DashboardLayout>
                        <SettingsPage />
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
