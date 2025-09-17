import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Users, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signInWithPhone } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // For demo purposes, we'll use the email as phone number
      // In a real app, you'd have proper email/password authentication
      const result = await signInWithPhone(email);
      if (!result.success) {
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Main Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-center">
            <div className="flex justify-center mb-3">
              <div className="bg-white/20 p-3 rounded-full">
                <Users className="text-white" size={32} />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">JHA Men Of Impact</h1>
            <p className="text-blue-100 text-sm">Brotherhood • Impact • Excellence</p>
          </div>

          {/* Login Form */}
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-600">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                    placeholder="Enter your email"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-red-800 text-sm font-medium">Login Failed</p>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading || !email.trim() || !password.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-8 text-center">
              <p className="text-gray-600 text-sm">
                Don't have an account?{' '}
                <button className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                  Register for free
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Group Photo Section - Desktop Only */}
        <div className="hidden lg:block fixed top-0 right-0 w-1/2 h-full">
          <div className="relative h-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-12">
            {/* Decorative Elements */}
            <div className="absolute top-20 left-20 w-16 h-16 bg-blue-300/30 rounded-full blur-xl"></div>
            <div className="absolute bottom-32 right-16 w-20 h-20 bg-blue-400/25 rounded-full blur-xl"></div>
            <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-blue-200/40 rounded-full blur-lg"></div>
            <div className="absolute bottom-1/4 left-1/3 w-8 h-8 bg-blue-300/35 rounded-full blur-md"></div>

            {/* Group Photo */}
            <div className="relative max-w-lg">
              <img
                src="/jha-group-photo.jpg"
                alt="JHA Men Of Impact Group"
                className="w-full h-auto object-cover rounded-2xl shadow-2xl border-4 border-white/20"
              />
              {/* Photo Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-2xl p-6">
                <h2 className="text-white text-xl font-bold mb-2">JHA Men Of Impact</h2>
                <p className="text-white/90 text-sm">Building Brotherhood • Creating Impact • Achieving Excellence</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};