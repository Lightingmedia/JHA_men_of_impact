import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Users, Phone, Shield, AlertCircle, CheckCircle, Smartphone, Monitor, User, Calendar, Heart, Mail, Lock, Github, Chrome } from 'lucide-react';

interface UserRegistrationData {
  phone: string;
  full_name: string;
  birth_month: number;
}

export const Login: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'phone' | 'registration' | 'complete'>('phone');
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [registrationData, setRegistrationData] = useState<UserRegistrationData>({
    phone: '',
    full_name: '',
    birth_month: 0
  });
  const [deviceInfo, setDeviceInfo] = useState<{
    isMobile: boolean;
    browser: string;
    os: string;
  } | null>(null);
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
  }, []);

  const checkUserExists = async (phoneNumber: string) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('🔍 Checking if user exists in database...', phoneNumber);
      
      const { data: existingUser, error: checkError } = await supabase
        .from('members')
        .select('*')
        .eq('phone', phoneNumber)
        .maybeSingle();

      if (checkError) {
        console.error('Database check error:', checkError);
        setUserExists(false);
        setStep('registration');
        setRegistrationData(prev => ({ ...prev, phone: phoneNumber }));
        return;
      }

      if (existingUser) {
        console.log('✅ Returning user found:', existingUser.full_name);
        setUserExists(true);
        const result = await signInWithPhone(phoneNumber);
        if (!result.success) {
          setError(result.error || 'Login failed. Please try again.');
        }
      } else {
        console.log('👤 New user detected, starting registration...');
        setUserExists(false);
        setStep('registration');
        setRegistrationData(prev => ({ ...prev, phone: phoneNumber }));
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setError('Unable to verify user status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    
    await checkUserExists(phone.trim());
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('📝 Registering new user...', registrationData);

      const { data: newUser, error: createError } = await supabase
        .from('members')
        .insert([{
          phone: registrationData.phone,
          full_name: registrationData.full_name,
          birth_month: registrationData.birth_month,
          is_admin: registrationData.phone === '9254343862',
          is_active: true
        }])
        .select()
        .single();

      if (createError) {
        console.error('Registration error:', createError);
        setError('Registration failed. Please try again.');
        return;
      }

      console.log('✅ Registration successful:', newUser);
      setStep('complete');
      
      setTimeout(async () => {
        const result = await signInWithPhone(registrationData.phone);
        if (!result.success) {
          setError(result.error || 'Auto-login failed. Please try logging in manually.');
        }
      }, 2000);

    } catch (error) {
      console.error('Registration error:', error);
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep('phone');
    setPhone('');
    setUserExists(null);
    setRegistrationData({ phone: '', full_name: '', birth_month: 0 });
    setError('');
  };

  const months = [
    { value: 0, label: 'Select Birth Month' },
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-blue-100 relative">
        {/* Floating decorative elements */}
        <div className="absolute top-20 left-20 w-16 h-16 bg-blue-300/30 rounded-full blur-xl"></div>
        <div className="absolute bottom-32 left-16 w-20 h-20 bg-blue-400/25 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-20 w-12 h-12 bg-blue-300/30 rounded-full blur-lg"></div>
        <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-blue-200/40 rounded-full blur-md"></div>
        <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-blue-300/35 rounded-full blur-sm"></div>

        <div className="w-full max-w-md">
          {/* Translucent Login Card */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 p-8 relative overflow-hidden">
            {/* Subtle inner glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-transparent rounded-3xl"></div>
            
            {/* Content */}
            <div className="relative z-10">
              {/* Logo Section */}
              <div className="text-center mb-8">
                <div className="text-blue-600 text-sm font-medium mb-2">JHA Men Of Impact</div>
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Login</h1>
              </div>

              {/* Phone Number Step */}
              {step === 'phone' && (
                <>
                  <form onSubmit={handlePhoneSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base bg-white/90 backdrop-blur-sm text-gray-900 placeholder-gray-500"
                        placeholder="Enter your phone number"
                        required
                        autoComplete="tel"
                        inputMode="tel"
                        style={{ fontSize: '16px' }}
                      />
                    </div>

                    {error && (
                      <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 rounded-xl p-4 flex items-start space-x-3">
                        <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                          <p className="text-red-800 text-sm font-semibold">Error</p>
                          <p className="text-red-700 text-sm mt-1">{error}</p>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !phone.trim()}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                      style={{ minHeight: '56px' }}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <span>Sign in</span>
                      )}
                    </button>
                  </form>
                </>
              )}

              {/* Registration Step */}
              {step === 'registration' && (
                <>
                  <div className="mb-6 p-4 bg-blue-50/90 backdrop-blur-sm border-2 border-blue-200/60 rounded-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <Heart className="text-blue-700" size={20} />
                      <h3 className="text-blue-900 font-bold">Welcome to JHA Men Of Impact!</h3>
                    </div>
                    <p className="text-blue-800 text-sm font-medium">
                      Join our brotherhood of impactful men. Building legacy together.
                    </p>
                  </div>

                  <form onSubmit={handleRegistration} className="space-y-6">
                    <div>
                      <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="full_name"
                        value={registrationData.full_name}
                        onChange={(e) => setRegistrationData(prev => ({ ...prev, full_name: e.target.value }))}
                        className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base bg-white/90 backdrop-blur-sm text-gray-900 placeholder-gray-500"
                        placeholder="Enter your full name"
                        required
                        style={{ fontSize: '16px' }}
                      />
                    </div>

                    <div>
                      <label htmlFor="birth_month" className="block text-sm font-medium text-gray-700 mb-2">
                        Birth Month
                      </label>
                      <select
                        id="birth_month"
                        value={registrationData.birth_month}
                        onChange={(e) => setRegistrationData(prev => ({ ...prev, birth_month: parseInt(e.target.value) }))}
                        className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base bg-white/90 backdrop-blur-sm appearance-none text-gray-900"
                        required
                        style={{ fontSize: '16px' }}
                      >
                        {months.map(month => (
                          <option key={month.value} value={month.value} disabled={month.value === 0}>
                            {month.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {error && (
                      <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 rounded-xl p-4 flex items-start space-x-3">
                        <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                          <p className="text-red-800 text-sm font-semibold">Registration Failed</p>
                          <p className="text-red-700 text-sm mt-1">{error}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={resetFlow}
                        className="flex-1 bg-gray-300/80 backdrop-blur-sm hover:bg-gray-400/80 text-gray-800 font-semibold py-4 px-4 rounded-xl transition-all duration-200"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading || !registrationData.full_name.trim() || registrationData.birth_month === 0}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            <span>Registering...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle size={20} />
                            <span>Complete Registration</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* Registration Complete */}
              {step === 'complete' && (
                <div className="text-center space-y-6">
                  <div className="bg-blue-50/90 backdrop-blur-sm border-2 border-blue-200/60 rounded-xl p-6">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                      <Heart className="text-blue-600" size={32} />
                      <h3 className="text-blue-800 font-bold text-xl">Welcome to the Brotherhood!</h3>
                    </div>
                    <p className="text-blue-700 text-sm mb-4 font-medium">
                      {registrationData.full_name}, you're now part of JHA Men Of Impact!
                    </p>
                    <p className="text-blue-600 text-sm font-medium">
                      Your brotherhood journey begins now. Logging you in...
                    </p>
                  </div>

                  <div className="flex items-center justify-center space-x-2 text-blue-700">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-700 border-t-transparent"></div>
                    <span className="text-sm">Logging you in...</span>
                  </div>
                </div>
              )}

              {/* Returning User Welcome */}
              {userExists === true && step === 'phone' && (
                <div className="mt-6 p-4 bg-blue-50/90 backdrop-blur-sm border-2 border-blue-200/60 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Heart className="text-blue-600" size={20} />
                    <h3 className="text-blue-800 font-bold">Welcome back, Brother!</h3>
                  </div>
                  <p className="text-blue-700 text-sm font-medium">
                    Great to see you again. Logging you into the brotherhood...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Group Photo */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 relative overflow-hidden">
        {/* Floating decorative elements */}
        <div className="absolute top-20 left-20 w-16 h-16 bg-blue-300/30 rounded-full blur-xl"></div>
        <div className="absolute bottom-32 right-16 w-20 h-20 bg-blue-400/25 rounded-full blur-xl"></div>
        <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-blue-200/40 rounded-full blur-lg"></div>
        <div className="absolute bottom-1/4 left-1/3 w-8 h-8 bg-blue-300/35 rounded-full blur-md"></div>

        {/* Group Photo */}
        <div className="flex items-center justify-center p-12 w-full">
          <div className="relative">
            <img
              src="/jha-group-photo.jpg"
              alt="JHA Men Of Impact Group"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-4 border-white/20"
            />
            {/* Photo overlay with brotherhood message */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent rounded-b-2xl p-6">
              <h2 className="text-white text-2xl font-bold mb-2">JHA Men Of Impact</h2>
              <p className="text-white/90 text-sm">Building Brotherhood • Creating Impact • Achieving Excellence</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};