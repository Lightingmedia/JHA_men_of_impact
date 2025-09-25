import React, { useState, useEffect } from 'react';
import { supabase, Member } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Crown, Shield, Users, UserCheck, UserX, Eye, AlertTriangle, CheckCircle } from 'lucide-react';

export const SuperAdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (user?.is_super_admin) {
      fetchAllMembers();
    }
  }, [user]);

  const fetchAllMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('full_name');

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminStatus = async (memberId: string, currentStatus: boolean, memberName: string) => {
    if (!user?.is_super_admin) {
      alert('Only super admins can modify admin privileges.');
      return;
    }

    const action = currentStatus ? 'remove admin privileges from' : 'grant admin privileges to';
    if (!confirm(`Are you sure you want to ${action} ${memberName}?`)) {
      return;
    }

    setUpdating(memberId);
    try {
      const { error } = await supabase
        .from('members')
        .update({ is_admin: !currentStatus })
        .eq('id', memberId);

      if (error) throw error;
      
      await fetchAllMembers();
      alert(`Successfully ${currentStatus ? 'removed admin privileges from' : 'granted admin privileges to'} ${memberName}.`);
    } catch (error) {
      console.error('Error updating admin status:', error);
      alert(`Error updating admin status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUpdating(null);
    }
  };

  if (!user?.is_super_admin) {
    return (
      <div className="text-center py-12">
        <Crown className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Super Admin Access Required</h3>
        <p className="text-gray-600 dark:text-gray-400">Only super administrators can access this panel.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const superAdmins = members.filter(m => m.is_super_admin);
  const regularAdmins = members.filter(m => m.is_admin && !m.is_super_admin);
  const regularMembers = members.filter(m => !m.is_admin && !m.is_super_admin);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-3 rounded-lg">
          <Crown className="text-white" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Super Admin Panel</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage administrator privileges across the platform</p>
        </div>
      </div>

      {/* Super Admin Alert */}
      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Crown className="text-yellow-600 dark:text-yellow-400" size={20} />
          <h3 className="text-yellow-800 dark:text-yellow-200 font-medium">Super Administrator Privileges Active</h3>
        </div>
        <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
          You have the highest level of access and can grant or revoke admin privileges for any member.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-lg">
              <Crown className="text-yellow-600 dark:text-yellow-400" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Super Admins</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{superAdmins.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
              <Shield className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Regular Admins</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{regularAdmins.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
              <Users className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Regular Members</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{regularMembers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Super Admins Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 px-6 py-4 border-b border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center space-x-2">
            <Crown className="text-yellow-600 dark:text-yellow-400" size={20} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Super Administrators</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Highest privilege level - cannot be modified
          </p>
        </div>
        
        <div className="p-6">
          {superAdmins.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No super administrators found.</p>
          ) : (
            <div className="space-y-4">
              {superAdmins.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center space-x-3">
                    {member.profile_picture_url ? (
                      <img
                        src={member.profile_picture_url}
                        alt={member.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                        <Crown className="text-yellow-600 dark:text-yellow-400" size={16} />
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{member.full_name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{member.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-700">
                      <Crown size={12} className="mr-1" />
                      Super Admin
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Regular Admins Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Shield className="text-blue-600 dark:text-blue-400" size={20} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Regular Administrators</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Can be promoted or demoted by super admins
          </p>
        </div>
        
        <div className="p-6">
          {regularAdmins.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No regular administrators.</p>
          ) : (
            <div className="space-y-4">
              {regularAdmins.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center space-x-3">
                    {member.profile_picture_url ? (
                      <img
                        src={member.profile_picture_url}
                        alt={member.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <Shield className="text-blue-600 dark:text-blue-400" size={16} />
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{member.full_name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{member.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                      Administrator
                    </span>
                    <button
                      onClick={() => toggleAdminStatus(member.id, true, member.full_name)}
                      disabled={updating === member.id}
                      className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 rounded text-xs font-medium transition-colors flex items-center space-x-1 disabled:opacity-50"
                    >
                      {updating === member.id ? (
                        <div className="animate-spin rounded-full h-3 w-3 border border-red-600 border-t-transparent"></div>
                      ) : (
                        <UserX size={12} />
                      )}
                      <span>Remove Admin</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Regular Members Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Users className="text-green-600 dark:text-green-400" size={20} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Regular Members</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Can be promoted to administrator by super admins
          </p>
        </div>
        
        <div className="p-6">
          {regularMembers.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No regular members.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {regularMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-3">
                    {member.profile_picture_url ? (
                      <img
                        src={member.profile_picture_url}
                        alt={member.full_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <Users className="text-gray-500 dark:text-gray-400" size={14} />
                      </div>
                    )}
                    
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">{member.full_name}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{member.phone}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleAdminStatus(member.id, false, member.full_name)}
                    disabled={updating === member.id}
                    className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 rounded text-xs font-medium transition-colors flex items-center space-x-1 disabled:opacity-50 flex-shrink-0"
                  >
                    {updating === member.id ? (
                      <div className="animate-spin rounded-full h-3 w-3 border border-green-600 border-t-transparent"></div>
                    ) : (
                      <UserCheck size={12} />
                    )}
                    <span className="hidden sm:inline">Make Admin</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-amber-800 dark:text-amber-200 font-medium mb-2">Important Notes</h4>
            <ul className="text-amber-700 dark:text-amber-300 text-sm space-y-1 list-disc list-inside">
              <li>Super admin status cannot be changed through this interface</li>
              <li>Only super admins can grant or revoke regular admin privileges</li>
              <li>Admin changes take effect immediately</li>
              <li>All actions are logged for security purposes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};