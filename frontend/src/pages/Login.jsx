import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Code2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email for the login link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[color:var(--bg)]"></div>
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[color:var(--accent-3)]/40 rounded-full blur-3xl opacity-60"></div>
      <div className="absolute bottom-[-25%] left-[-5%] w-[45%] h-[45%] bg-[color:var(--accent-2)]/25 rounded-full blur-3xl opacity-70"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,107,53,0.2),transparent_45%),radial-gradient(circle_at_70%_80%,rgba(31,122,140,0.2),transparent_45%)]"></div>

      <div className="max-w-md w-full space-y-8 glass-panel p-10 rounded-[32px] relative z-10">
        <div className="text-center">
          <div className="mx-auto bg-[color:var(--accent)]/15 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
            <Code2 className="w-6 h-6 text-[color:var(--accent)]" />
          </div>
          <h2 className="mt-2 font-display text-3xl text-[color:var(--ink)]">
            {isSignUp ? 'Create an account' : 'Welcome back'}
          </h2>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            {isSignUp ? 'Start building interfaces with code.' : 'Sign in to access your workspaces.'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[color:var(--ink)] mb-1">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-[color:var(--border)] rounded-xl placeholder-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] focus:border-transparent transition-all bg-[color:var(--panel-strong)]"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[color:var(--ink)] mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-[color:var(--border)] rounded-xl placeholder-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] focus:border-transparent transition-all bg-[color:var(--panel-strong)]"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="bg-[color:var(--accent)]/10 text-[color:var(--accent)] p-3 rounded-lg text-sm border border-[color:var(--accent)]/30">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-[color:var(--ink)] bg-[color:var(--accent-3)] hover:bg-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[color:var(--ring)] transition-all disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                isSignUp ? 'Sign up' : 'Sign in'
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-[color:var(--muted)] hover:text-[color:var(--ink)] transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
