import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { User, Camera, Save, Calendar, Phone } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    birth_month: user?.birth_month || '',
    birth_day: user?.birth_day || '',
  });
  const [uploading, setUploading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Prevent Supabase operations in demo mode
    if (user?.id === 'admin-bypass-id') {
      alert('Profile updates are not available in demo mode. Connect to Supabase to enable full functionality.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('members')
        .update({
          full_name: formData.full_name,
          birth_month: formData.birth_month ? parseInt(formData.birth_month) : null,
          birth_day: formData.birth_day ? parseInt(formData.birth_day) : null,
        })
        .eq('id', user?.id);

      if (error) throw error;

      await refreshUser();
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Prevent Supabase operations in demo mode
    if (user.id === 'admin-bypass-id') {
      alert('Profile picture uploads are not available in demo mode. Connect to Supabase to enable full functionality.');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('members')
        .update({ profile_picture_url: data.publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshUser();
      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const months = [
    { value: '', label: 'Select Month' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Settings</h2>
        <p className="text-gray-600">Update your personal information and profile picture</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        {/* Profile Picture Section */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            {user?.profile_picture_url ? (
              <img
                src={user.profile_picture_url}
                alt={user.full_name}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-100"
              />
            ) : (
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center ring-4 ring-blue-200">
                <User className="text-blue-600" size={36} />
              </div>
            )}
            
            <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors">
              <Camera size={16} />
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
          
          {uploading && (
            <p className="text-sm text-blue-600 mt-2">Uploading...</p>
          )}
        </div>

        {/* Profile Form */}
        <form onSubmit={handleProfileUpdate} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="flex items-center space-x-2 text-gray-600 bg-gray-50 px-4 py-3 rounded-lg">
              <Phone size={20} />
              <span>{user?.phone}</span>
              <span className="text-sm">(Cannot be changed)</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Birthday
            </label>
            <div className="grid grid-cols-2 gap-4">
              <select
                name="birth_month"
                value={formData.birth_month}
                onChange={handleInputChange}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {months.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>

              <select
                name="birth_day"
                value={formData.birth_day}
                onChange={handleInputChange}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!formData.birth_month}
              >
                <option value="">Select Day</option>
                {days.map(day => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                <Save size={20} />
                <span>Update Profile</span>
              </>
            )}
          </button>
        </form>
      </div>

      {user?.is_admin && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              A
            </div>
            <span className="text-blue-800 font-medium">Administrator Account</span>
          </div>
          <p className="text-blue-700 text-sm mt-1">
            You have administrative privileges to manage members and platform settings.
          </p>
        </div>
      )}
    </div>
  );
};