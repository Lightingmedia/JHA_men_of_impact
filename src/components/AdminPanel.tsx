import React, { useState, useEffect } from 'react';
import { supabase, Member } from '../lib/supabase';
import { Plus, Edit, Trash2, Users, UserCheck, UserX } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState({
    phone: '',
    full_name: '',
    is_admin: false,
  });

  useEffect(() => {
    fetchAllMembers();
  }, []);

  const fetchAllMembers = async () => {
    // Handle demo mode with mock data
    if (user?.id === 'admin-bypass-id') {
      const mockMembers: Member[] = [
        {
          id: 'admin-bypass-id',
          phone: '9254343862',
          full_name: 'Administrator',
          profile_picture_url: undefined,
          birth_month: undefined,
          birth_day: undefined,
          is_admin: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'demo-member-1',
          phone: '+1 (555) 234-5678',
          full_name: 'Brother Williams',
          profile_picture_url: undefined,
          birth_month: 4,
          birth_day: 22,
          is_admin: false,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'demo-member-2',
          phone: '+1 (555) 345-6789',
          full_name: 'Brother Davis',
          profile_picture_url: undefined,
          birth_month: 5,
          birth_day: 8,
          is_admin: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'demo-member-3',
          phone: '+1 (555) 456-7890',
          full_name: 'Brother Johnson',
          profile_picture_url: undefined,
          birth_month: 3,
          birth_day: 15,
          is_admin: false,
          is_active: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      setMembers(mockMembers);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Handle demo mode - simulate adding member
    if (user?.id === 'admin-bypass-id') {
      // In demo mode, just show success message and reset form
      setNewMember({ phone: '', full_name: '', is_admin: false });
      setShowAddForm(false);
      alert('Member would be added successfully! (Demo mode - connect to Supabase for real functionality)');
      return;
    }

    try {
      const { error } = await supabase
        .from('members')
        .insert([newMember]);

      if (error) throw error;

      setNewMember({ phone: '', full_name: '', is_admin: false });
      setShowAddForm(false);
      fetchAllMembers();
      alert('Member added successfully!');
    } catch (error) {
      console.error('Error adding member:', error);
      alert(`Error adding member: ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };

  const toggleMemberStatus = async (memberId: string, currentStatus: boolean) => {
    // Prevent operations in demo mode
    if (user?.id === 'admin-bypass-id') {
      alert('Member status changes are not available in demo mode. Connect to Supabase to enable full functionality.');
      return;
    }

    try {
      const { error } = await supabase
        .from('members')
        .update({ is_active: !currentStatus })
        .eq('id', memberId);

      if (error) throw error;
      
      fetchAllMembers();
    } catch (error) {
      console.error('Error updating member status:', error);
      alert('Error updating member status.');
    }
  };

  const toggleAdminStatus = async (memberId: string, currentStatus: boolean) => {
    // Prevent operations in demo mode
    if (user?.id === 'admin-bypass-id') {
      alert('Admin status changes are not available in demo mode. Connect to Supabase to enable full functionality.');
      return;
    }

    try {
      const { error } = await supabase
        .from('members')
        .update({ is_admin: !currentStatus })
        .eq('id', memberId);

      if (error) throw error;
      
      fetchAllMembers();
    } catch (error) {
      console.error('Error updating admin status:', error);
      alert('Error updating admin status.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const activeMembers = members.filter(m => m.is_active);
  const inactiveMembers = members.filter(m => !m.is_active);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
          <p className="text-gray-600">Manage community members and settings</p>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span>Add Member</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{members.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <UserCheck className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Members</p>
              <p className="text-2xl font-bold text-gray-900">{activeMembers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <UserX className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive Members</p>
              <p className="text-2xl font-bold text-gray-900">{inactiveMembers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Member Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Member</h3>
          
          {user?.id === 'admin-bypass-id' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-yellow-800 text-sm">
                <strong>Demo Mode:</strong> This will simulate adding a member. Connect to Supabase for real functionality.
              </p>
            </div>
          )}
          
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newMember.full_name}
                  onChange={(e) => setNewMember({ ...newMember, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_admin"
                checked={newMember.is_admin}
                onChange={(e) => setNewMember({ ...newMember, is_admin: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_admin" className="ml-2 text-sm text-gray-700">
                Grant administrator privileges
              </label>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Add Member
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Members List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Members</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{member.full_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{member.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.is_admin 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.is_admin ? 'Admin' : 'Member'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => toggleMemberStatus(member.id, member.is_active)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          member.is_active
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {member.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      
                      <button
                        onClick={() => toggleAdminStatus(member.id, member.is_admin)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          member.is_admin
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        {member.is_admin ? 'Remove Admin' : 'Make Admin'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};