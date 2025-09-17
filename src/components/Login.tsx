import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Users, Phone, Shield, AlertCircle, CheckCircle, Smartphone, Monitor, User, Calendar } from 'lucide-react';

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
        // Continue with registration flow even if database check fails
        setUserExists(false);
        setStep('registration');
        setRegistrationData(prev => ({ ...prev, phone: phoneNumber }));
        return;
      }

      if (existingUser) {
        console.log('✅ Returning user found:', existingUser.full_name);
        setUserExists(true);
        // Proceed with login for existing user
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
      
      // Auto-login after successful registration
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-full p-3 sm:p-4 w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 flex items-center justify-center shadow-lg">
            <Users size={deviceInfo?.isMobile ? 28 : 32} className="text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">JHA Men Of Impact</h1>
          <p className="text-sm sm:text-base text-blue-700 font-medium">Building Brotherhood, Creating Impact</p>
          
          {/* Device Info */}
          {deviceInfo && (
            <div className="mt-3 flex items-center justify-center space-x-2 text-xs text-blue-500">
              {deviceInfo.isMobile ? <Smartphone size={14} /> : <Monitor size={14} />}
              <span>{deviceInfo.browser} on {deviceInfo.os}</span>
            </div>
          )}
        </div>

        {/* Phone Number Step */}
        {step === 'phone' && (
          <>
            <form onSubmit={handlePhoneSubmit} className="space-y-4 sm:space-y-6">
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
                    placeholder="Enter your phone number"
                    required
                    autoComplete="tel"
                    inputMode="tel"
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-red-800 text-sm font-medium">Error</p>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !phone.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 sm:py-4 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 touch-manipulation shadow-lg hover:shadow-xl"
                style={{ minHeight: '48px' }}
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
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <User className="text-blue-700" size={20} />
                <h3 className="text-blue-900 font-semibold">Welcome to JHA Men Of Impact!</h3>
              </div>
              <p className="text-blue-800 text-sm">
                Join our brotherhood of impactful men. Let's get you set up with some basic information.
              </p>
            </div>

            <form onSubmit={handleRegistration} className="space-y-4 sm:space-y-6">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    id="full_name"
                    value={registrationData.full_name}
                    onChange={(e) => setRegistrationData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base bg-white"
                    placeholder="Enter your full name"
                    required
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="birth_month" className="block text-sm font-medium text-gray-700 mb-2">
                  Birth Month
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <select
                    id="birth_month"
                    value={registrationData.birth_month}
                    onChange={(e) => setRegistrationData(prev => ({ ...prev, birth_month: parseInt(e.target.value) }))}
                    className="w-full pl-12 pr-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base bg-white appearance-none"
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
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-red-800 text-sm font-medium">Registration Failed</p>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={resetFlow}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !registrationData.full_name.trim() || registrationData.birth_month === 0}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
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
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <CheckCircle className="text-blue-600" size={32} />
                <h3 className="text-blue-800 font-bold text-lg">Welcome to the Brotherhood!</h3>
              </div>
              <p className="text-blue-700 text-sm mb-4">
                {registrationData.full_name}, you're now part of JHA Men Of Impact!
              </p>
              <p className="text-blue-600 text-sm">
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
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="text-blue-600" size={20} />
              <h3 className="text-blue-800 font-medium">Welcome back, Brother!</h3>
            </div>
            <p className="text-blue-700 text-sm">
              Great to see you again. Logging you into the brotherhood...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};