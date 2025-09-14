import React, { useState, useEffect } from 'react';
import { supabase, Member } from '../lib/supabase';
import { Search, Phone, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

export const MemberDirectory: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(member =>
    member.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatBirthday = (month?: number, day?: number) => {
    if (!month || !day) return 'Not set';
    try {
      const date = new Date(2025, month - 1, day);
      return format(date, 'MMMM d');
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Member Directory</h2>
          <p className="text-gray-600">{filteredMembers.length} active members</p>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredMembers.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:scale-105"
          >
            {/* Profile Picture */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                {member.profile_picture_url ? (
                  <img
                    src={member.profile_picture_url}
                    alt={member.full_name}
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-blue-100"
                  />
                ) : (
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center ring-4 ring-blue-200">
                    <User className="text-blue-600" size={32} />
                  </div>
                )}
                {member.is_admin && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold ring-2 ring-white">
                    A
                  </div>
                )}
              </div>
            </div>

            {/* Member Info */}
            <div className="text-center space-y-4">
              <h3 className="font-semibold text-gray-900 text-lg">{member.full_name}</h3>
              
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center justify-center space-x-2">
                  <Phone size={16} className="text-gray-400" />
                  <span>{member.phone}</span>
                </div>
                
                <div className="flex items-center justify-center space-x-2">
                  <Calendar size={16} className="text-gray-400" />
                  <span>{formatBirthday(member.birth_month, member.birth_day)}</span>
                </div>
              </div>

              {member.is_admin && (
                <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                  Administrator
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredMembers.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
          <p className="text-gray-600">Try adjusting your search terms.</p>
        </div>
      )}
    </div>
  );
};