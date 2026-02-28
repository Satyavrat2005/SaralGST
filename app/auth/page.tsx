'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle2, Sparkles, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type AuthMode = 'signin' | 'signup' | 'forgot-password';

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  );
}

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'auth_callback_error') {
      setError('Authentication failed. Please try again.');
    }
  }, [searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        // Check if profile is complete
        const { data: profile } = await supabase
          .from('business_profiles')
          .select('is_profile_complete')
          .eq('user_id', data.user.id)
          .single();

        if (!profile || !profile.is_profile_complete) {
          router.push('/onboarding');
        } else {
          router.push('/dashboard/sme');
        }
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      // Check if email confirmation is required
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError('An account with this email already exists.');
        return;
      }

      setSuccess('Account created! Please check your email for a verification link to complete your registration.');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess('Password reset link sent! Check your email inbox.');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        setGoogleLoading(false);
      }
    } catch (err) {
      setError('Failed to sign in with Google. Please try again.');
      setGoogleLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setSuccess(null);
    setPassword('');
    setConfirmPassword('');
  };

  const getTitle = () => {
    switch (mode) {
      case 'signin':
        return 'Welcome back';
      case 'signup':
        return 'Create your account';
      case 'forgot-password':
        return 'Reset your password';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'signin':
        return 'Manage your business finances seamlessly';
      case 'signup':
        return 'Get started with intelligent GST compliance';
      case 'forgot-password':
        return "Enter your email and we'll send you a reset link";
    }
  };

  const getBadge = () => {
    switch (mode) {
      case 'signin':
        return 'Secure Login';
      case 'signup':
        return 'Get Started';
      case 'forgot-password':
        return 'Account Recovery';
    }
  };

  return (
    <div className="h-screen w-full flex overflow-hidden hero-bg-custom">
      {/* Left Side - Immersive Visual with Emerald Theme */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-8 xl:p-10 demo-emerald-bg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.2),transparent_50%)]"></div>
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-emerald-400/20 to-transparent"></div>
        
        {/* Animated floating elements */}
        <div className="absolute top-[10vh] left-[10%] w-24 h-24 xl:w-32 xl:h-32 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[20vh] right-[10%] w-32 h-32 xl:w-40 xl:h-40 bg-emerald-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* 3D Mesh Grid Effect */}
        <div className="absolute inset-0 opacity-10" 
             style={{ 
               backgroundImage: 'linear-gradient(rgba(52,211,153,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.3) 1px, transparent 1px)', 
               backgroundSize: '50px 50px',
               transform: 'perspective(600px) rotateX(25deg) translateY(60px) scale(1.3)'
             }}>
        </div>

        <div className="relative z-10 opacity-0 animate-fade-in-up" style={{ animationFillMode: 'forwards' }}>
          <div className="h-10 w-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/50">
             <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold text-white mb-3 leading-tight">
            GST Compliance <br/>
            <span className="text-gradient">Made Simple</span>
          </h1>
          <p className="text-emerald-100/80 text-base xl:text-lg">Join 10,000+ businesses maximizing their ITC with SaralGST.</p>
        </div>

        <div className="relative z-10 space-y-3 opacity-0 animate-fade-in-up animation-delay-400" style={{ animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-3 text-sm xl:text-base text-emerald-100/90 bg-white/5 backdrop-blur-sm rounded-lg p-3.5 border border-emerald-400/20">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            <span>AI-driven Reconciliation Engine</span>
          </div>
          <div className="flex items-center gap-3 text-sm xl:text-base text-emerald-100/90 bg-white/5 backdrop-blur-sm rounded-lg p-3.5 border border-emerald-400/20">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            <span>Real-time Vendor Compliance Scoring</span>
          </div>
          <div className="flex items-center gap-3 text-sm xl:text-base text-emerald-100/90 bg-white/5 backdrop-blur-sm rounded-lg p-3.5 border border-emerald-400/20">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            <span>Automated GSTR Filing</span>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 relative bg-white overflow-hidden">
        {/* Decorative gradient orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 xl:w-96 xl:h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 xl:w-96 xl:h-96 bg-emerald-400/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="w-full max-w-md space-y-4 relative z-10 opacity-0 animate-fade-in-up animation-delay-200" style={{ animationFillMode: 'forwards' }}>
          
          {/* Back button for forgot password */}
          {mode === 'forgot-password' && (
            <button
              onClick={() => switchMode('signin')}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </button>
          )}

          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
              <Sparkles className="h-3 w-3" />
              {getBadge()}
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">{getTitle()}</h2>
            <p className="text-sm text-gray-600">{getSubtitle()}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              {success}
            </div>
          )}

          {/* Sign In Form */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-3.5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-sm"
                    placeholder="name@company.com"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-gray-700">Password</label>
                  <button 
                    type="button" 
                    onClick={() => switchMode('forgot-password')}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-10 rounded-xl bg-white border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-11 flex items-center justify-center gap-2 btn-primary-custom font-semibold text-sm transition-all hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 mt-5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
                </div>
              </div>

              <button 
                type="button" 
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full h-11 flex items-center justify-center gap-2 btn-secondary-custom font-semibold text-sm transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>
            </form>
          )}

          {/* Sign Up Form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-sm"
                    placeholder="name@company.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-10 rounded-xl bg-white border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-sm"
                    placeholder="Min. 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'} 
                    required 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-10 rounded-xl bg-white border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-sm"
                    placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-11 flex items-center justify-center gap-2 btn-primary-custom font-semibold text-sm transition-all hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 mt-5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
                </div>
              </div>

              <button 
                type="button" 
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full h-11 flex items-center justify-center gap-2 btn-secondary-custom font-semibold text-sm transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>
            </form>
          )}

          {/* Forgot Password Form */}
          {mode === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="space-y-3.5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-sm"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-11 flex items-center justify-center gap-2 btn-primary-custom font-semibold text-sm transition-all hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 mt-5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Send Reset Link
                    <Mail className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer toggle between sign in and sign up */}
          {mode !== 'forgot-password' && (
            <p className="text-center text-xs text-gray-500 pt-1">
              {mode === 'signin' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button 
                    onClick={() => switchMode('signup')}
                    className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    Sign up now
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button 
                    onClick={() => switchMode('signin')}
                    className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
