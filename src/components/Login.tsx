import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Users, Phone, Shield } from 'lucide-react';

export const Login: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signInWithPhone } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signInWithPhone(phone);
    
    if (!result.success) {
      setError(result.error || 'Sign in failed');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full grid md:grid-cols-2">
        {/* Left Panel - Branding */}
        <div className="bg-gradient-to-br from-blue-700 to-blue-900 p-8 flex flex-col justify-center items-center text-white relative overflow-hidden">
          {/* Background Group Photo */}
          <div className="absolute inset-0 opacity-10">
            <img 
              src="/WhatsApp Image 2025-09-13 at 12.20.47_62c205e7.jpg" 
              alt="JHA Men Of Impact Group" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="text-center mb-8">
            <div className="bg-white/20 rounded-full p-4 mb-4 inline-block">
              <Users size={48} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">JHA Men Of Impact</h1>
            <p className="text-blue-100 text-lg">Private Community Platform</p>
            <p className="text-blue-200 text-sm mt-2 italic">Building Brotherhood, Strengthening Faith</p>
          </div>
          
          <div className="space-y-4 text-center">
            <div className="flex items-center space-x-3">
              <Shield className="text-blue-200" size={20} />
              <span className="text-sm">Secure Member-Only Access</span>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="text-blue-200" size={20} />
              <span className="text-sm">Phone Number Authentication</span>
            </div>
            <div className="flex items-center space-x-3">
              <Users className="text-blue-200" size={20} />
              <span className="text-sm">Connect with Fellow Members</span>
            </div>
          </div>
          
          {/* Featured Group Photo */}
          <div className="mt-8 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg">
            <img 
              src="/WhatsApp Image 2025-09-13 at 12.20.47_62c205e7.jpg" 
              alt="JHA Men Of Impact Brotherhood" 
              className="w-64 h-32 object-cover"
            />
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="p-8 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Member Login
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter phone number (try: 9254343862)"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <Shield size={20} />
                    <span>Secure Login</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p><strong>Demo Access:</strong> Use phone number <code className="bg-gray-100 px-2 py-1 rounded">9254343862</code> for admin login</p>
              <p className="mt-2">Or contact your group administrator for member access.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};