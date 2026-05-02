import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export const Login = () => {
  const { user, isSupabaseConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;
        
        setSuccess('Account created! Please check your email for the confirmation link to verify your account.');
        setEmail('');
        setPassword('');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-in fade-in duration-500">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center text-sm">
          <div className="w-12 h-12 rounded-xl bg-white text-black flex items-center justify-center font-bold text-xl mx-auto mb-4">
            P
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Welcome to Pro Designer</h1>
          <p className="text-[#8a8f98]">Sign in to track your learning progress</p>
        </div>

        {!isSupabaseConfigured ? (
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-sm flex gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>Please configure your Supabase credentials in the .env file to enable authentication and cloud progress tracking. Local storage tracking is currently active as a fallback.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-[13px] flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="p-3 rounded-md bg-[#4ade80]/10 border border-[#4ade80]/20 text-[#4ade80] text-[13px] flex gap-2 items-start">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-[13px] font-medium text-[#8a8f98]">Email address</label>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#1f1f1f] rounded-md text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#444] transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[13px] font-medium text-[#8a8f98]">Password</label>
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#1f1f1f] rounded-md text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#444] transition-colors"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading || (success !== null)}
              className={cn(
                "w-full py-2.5 rounded-md bg-white text-black font-semibold text-sm transition-colors flex items-center justify-center gap-2",
                (isLoading || success) ? "opacity-70 cursor-not-allowed" : "hover:bg-gray-200"
              )}
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              {isSignUp ? 'Create account' : 'Sign in'}
            </button>

            <p className="text-center text-[13px] text-[#8a8f98] mt-6">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{' '}
              <button 
                type="button" 
                onClick={toggleMode}
                className="text-white hover:underline focus:outline-none"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
