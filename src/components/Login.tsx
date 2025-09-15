import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Users, Phone, Shield, AlertCircle, CheckCircle, Smartphone, Monitor } from 'lucide-react';

export const Login: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deviceInfo, setDeviceInfo] = useState<{
    isMobile: boolean;
    browser: string;
    os: string;
  } | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [showMobileHelp, setShowMobileHelp] = useState(false);
  const { signInWithPhone } = useAuth();

  useEffect(() => {
    // Detect device and browser info
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    else if (userAgent.includes('Samsung')) browser = 'Samsung Internet';
    
    let os = 'Unknown';
    if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
    else if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    
    setDeviceInfo({ isMobile, browser, os });
    
    // Show mobile help if on mobile and has previous failed attempts
    if (isMobile && localStorage.getItem('mobile_login_failures')) {
      setShowMobileHelp(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading) return;
    
    // Prevent rapid successive submissions
    if (Date.now() - (window as any).lastSubmit < 1000) {
      return;
    }
    (window as any).lastSubmit = Date.now();
    
    setLoading(true);
    setError('');
    
    // Track login attempts for mobile users
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    
    try {
      console.log('🔐 Starting login process...', {
        phone,
        deviceInfo,
        attempt: newAttempts,
        timestamp: new Date().toISOString()
      });

      // Mobile-specific pre-checks
      if (deviceInfo?.isMobile) {
        // Check if localStorage is available
        try {
          localStorage.setItem('test', 'test');
          localStorage.removeItem('test');
        } catch (e) {
          throw new Error('Browser storage is disabled. Please enable cookies and local storage in your browser settings.');
        }

        // Check network connectivity
        if (!navigator.onLine) {
          throw new Error('No internet connection detected. Please check your network and try again.');
        }
      }

      const result = await signInWithPhone(phone);
      
      if (!result.success) {
        // Track mobile failures
        if (deviceInfo?.isMobile) {
          const failures = parseInt(localStorage.getItem('mobile_login_failures') || '0') + 1;
          localStorage.setItem('mobile_login_failures', failures.toString());
          setShowMobileHelp(true);
        }
        
        setError(result.error || 'Login failed. Please try again.');
      } else {
        // Clear failure tracking on success
        localStorage.removeItem('mobile_login_failures');
        console.log('✅ Login successful!');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      
      // Track mobile failures
      if (deviceInfo?.isMobile) {
        const failures = parseInt(localStorage.getItem('mobile_login_failures') || '0') + 1;
        localStorage.setItem('mobile_login_failures', failures.toString());
        setShowMobileHelp(true);
      }
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (err instanceof Error) {
        if (err.message.includes('storage') || err.message.includes('localStorage')) {
          errorMessage = 'Browser storage issue detected. Please enable cookies and try again.';
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Network connection issue. Please check your internet and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleMobileTroubleshooting = () => {
    // Clear any cached data that might be causing issues
    try {
      localStorage.clear();
      sessionStorage.clear();
      
      // Force reload to clear any cached JavaScript
      window.location.reload();
    } catch (e) {
      console.error('Error clearing storage:', e);
    }
  };

  const quickLogin = (testPhone: string) => {
    setPhone(testPhone);
    // Auto-submit after a brief delay
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        form.requestSubmit();
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="bg-blue-100 rounded-full p-3 sm:p-4 w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 flex items-center justify-center">
            <Users size={deviceInfo?.isMobile ? 28 : 32} className="text-blue-600" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">JHA Men Of Impact</h1>
          <p className="text-sm sm:text-base text-gray-600">Welcome to our private community</p>
          
          {/* Device Info */}
          {deviceInfo && (
            <div className="mt-3 flex items-center justify-center space-x-2 text-xs text-gray-500">
              {deviceInfo.isMobile ? <Smartphone size={14} /> : <Monitor size={14} />}
              <span>{deviceInfo.browser} on {deviceInfo.os}</span>
            </div>
          )}
        </div>

        {/* Mobile Help Alert */}
        {showMobileHelp && deviceInfo?.isMobile && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="text-sm font-medium text-yellow-800 mb-2">Mobile Login Help</h3>
                <div className="text-xs text-yellow-700 space-y-1">
                  <p>• Make sure cookies and local storage are enabled</p>
                  <p>• Try refreshing the page if login fails</p>
                  <p>• Use a stable internet connection</p>
                  <p>• Clear browser cache if issues persist</p>
                </div>
                <button
                  onClick={handleMobileTroubleshooting}
                  className="mt-2 text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition-colors"
                >
                  Clear Cache & Reload
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-12 pr-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base bg-white"
                placeholder="Enter any phone number"
                required
                autoComplete="tel"
                inputMode="tel"
                style={{ fontSize: '16px' }} // Prevent iOS zoom
                onFocus={(e) => {
                  // Scroll input into view on mobile
                  if (deviceInfo?.isMobile) {
                    setTimeout(() => {
                      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                  }
                }}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-red-800 text-sm font-medium">Login Failed</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                {deviceInfo?.isMobile && loginAttempts > 1 && (
                  <p className="text-red-600 text-xs mt-2">
                    Attempt {loginAttempts} - Try the troubleshooting steps above
                  </p>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !phone.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 sm:py-4 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 touch-manipulation"
            style={{ minHeight: '48px' }} // Ensure minimum touch target
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <Shield size={20} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Login Options */}
        <div className="mt-6 space-y-3">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">Quick Login Options:</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => quickLogin('9254343862')}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm py-2 px-3 rounded-lg transition-colors touch-manipulation"
              >
                Admin Access
              </button>
              <button
                onClick={() => quickLogin('123')}
                disabled={loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white text-sm py-2 px-3 rounded-lg transition-colors touch-manipulation"
              >
                Demo User
              </button>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium mb-2">Demo Access</p>
            <p className="text-sm text-blue-700 mb-2">
              Enter any phone number to access the platform
            </p>
            <div className="text-xs text-blue-600 space-y-1">
              <p>Admin: <code className="bg-blue-100 px-2 py-1 rounded">9254343862</code></p>
              <p>Demo: <code className="bg-blue-100 px-2 py-1 rounded">123</code></p>
            </div>
          </div>
        </div>

        {/* Mobile-specific footer */}
        {deviceInfo?.isMobile && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Having trouble? Try switching to desktop or contact support
            </p>
          </div>
        )}
      </div>
    </div>
  );
};