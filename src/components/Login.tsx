import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Users, Phone, Shield, AlertCircle, CheckCircle, Smartphone, Monitor, User, Calendar, Heart } from 'lucide-react';

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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Group Photo */}
      <div className="absolute inset-0 z-0">
        <img
          src="/jha-group-photo.jpg"
          alt="JHA Men Of Impact Group"
          className="w-full h-full object-cover"
        />
        {/* Dark overlay for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-blue-800/50 to-blue-700/40"></div>
      </div>
      
      {/* Translucent Login Panel */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 p-8 relative overflow-hidden">
          {/* Subtle inner glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-2xl"></div>
          
          {/* Content */}
          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-xl ring-4 ring-blue-200/50">
                <Heart size={32} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-blue-900 mb-2">JHA Men Of Impact</h1>
              <p className="text-blue-700 font-semibold">Building Brotherhood • Creating Impact</p>
              
              {/* Device Info */}
              {deviceInfo && (
                <div className="mt-3 flex items-center justify-center space-x-2 text-xs text-blue-600/80">
                  {deviceInfo.isMobile ? <Smartphone size={14} /> : <Monitor size={14} />}
                  <span>{deviceInfo.browser} on {deviceInfo.os}</span>
                </div>
              )}
            </div>

            {/* Phone Number Step */}
            {step === 'phone' && (
              <>
                <form onSubmit={handlePhoneSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-800 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500" size={20} />
                      <input
                        type="text"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 border-2 border-blue-200/60 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base bg-white/90 backdrop-blur-sm text-gray-900 placeholder-gray-500"
                        placeholder="Enter your phone number"
                        required
                        autoComplete="tel"
                        inputMode="tel"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
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
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98]"
                    style={{ minHeight: '56px' }}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Checking...</span>
                      </>
                    ) : (
                      <>
                        <Shield size={20} />
                        <span>Continue</span>
                      </>
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
                    <label htmlFor="full_name" className="block text-sm font-semibold text-gray-800 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500" size={20} />
                      <input
                        type="text"
                        id="full_name"
                        value={registrationData.full_name}
                        onChange={(e) => setRegistrationData(prev => ({ ...prev, full_name: e.target.value }))}
                        className="w-full pl-12 pr-4 py-4 border-2 border-blue-200/60 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base bg-white/90 backdrop-blur-sm text-gray-900 placeholder-gray-500"
                        placeholder="Enter your full name"
                        required
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="birth_month" className="block text-sm font-semibold text-gray-800 mb-2">
                      Birth Month
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500" size={20} />
                      <select
                        id="birth_month"
                        value={registrationData.birth_month}
                        onChange={(e) => setRegistrationData(prev => ({ ...prev, birth_month: parseInt(e.target.value) }))}
                        className="w-full pl-12 pr-4 py-4 border-2 border-blue-200/60 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base bg-white/90 backdrop-blur-sm appearance-none text-gray-900"
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
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98]"
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

        {/* Additional branding text below the panel */}
        <div className="text-center mt-6">
          <p className="text-white/90 text-sm font-medium backdrop-blur-sm bg-black/20 rounded-lg px-4 py-2 inline-block">
            "Excellence through Brotherhood, Impact through Unity"
          </p>
        </div>
      </div>
    </div>
  );
};