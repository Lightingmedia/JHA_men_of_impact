import React, { useState, useEffect } from 'react';
import { supabase, Member } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Plus, Edit, Trash2, Users, UserCheck, UserX, X, Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editForm, setEditForm] = useState({
    phone: '',
    full_name: '',
    birth_month: '',
    birth_day: '',
    is_admin: false,
  });
  const [newMember, setNewMember] = useState({
    phone: '',
    full_name: '',
    is_admin: false,
  });

  useEffect(() => {
    fetchAllMembers();
  }, []);

  const fetchAllMembers = async () => {
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
      alert(`Error adding member: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    }
  };

  const startEditing = (member: Member) => {
    setEditingMember(member);
    setEditForm({
      phone: member.phone,
      full_name: member.full_name,
      birth_month: member.birth_month?.toString() || '',
      birth_day: member.birth_day?.toString() || '',
      is_admin: member.is_admin,
    });
  };

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    
    try {
      const { error } = await supabase
        .from('members')
        .update({
          phone: editForm.phone,
          full_name: editForm.full_name,
          birth_month: editForm.birth_month ? parseInt(editForm.birth_month) : null,
          birth_day: editForm.birth_day ? parseInt(editForm.birth_day) : null,
          is_admin: editForm.is_admin,
        })
        .eq('id', editingMember.id);

      if (error) throw error;

      setEditingMember(null);
      fetchAllMembers();
      alert('Member updated successfully!');
    } catch (error) {
      console.error('Error updating member:', error);
      alert(`Error updating member: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    }
  };

  const deleteMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to delete ${memberName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      
      fetchAllMembers();
      alert('Member deleted successfully!');
    } catch (error) {
      console.error('Error deleting member:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        alert('Network error: Unable to connect to the database. Please check your internet connection and Supabase configuration.');
      } else {
        alert(`Error deleting member: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      }
    }
  };

  const addAllMembers = async () => {
    const membersToAdd = [
      { phone: '5101234501', full_name: 'Adedeji, Azeez Oyebade', birth_month: 7, birth_day: 30, is_admin: false, is_active: true },
      { phone: '5101234502', full_name: 'Adebowale, Kolade', birth_month: 6, birth_day: 11, is_admin: false, is_active: true },
      { phone: '5101234503', full_name: 'Akra, Victor', birth_month: 3, birth_day: 30, is_admin: false, is_active: true },
      { phone: '5101234504', full_name: 'Anselme, Dah-Touhouenou', birth_month: 4, birth_day: 21, is_admin: false, is_active: true },
      { phone: '5101234505', full_name: 'Bidemi, Kareem', birth_month: 9, birth_day: 21, is_admin: false, is_active: true },
      { phone: '5101234506', full_name: 'Bmo, Chika', birth_month: 4, birth_day: 21, is_admin: false, is_active: true },
      { phone: '5101234507', full_name: 'Friday, Edia', birth_month: 2, birth_day: 15, is_admin: false, is_active: true },
      { phone: '5101234508', full_name: 'Kelvin, Oghogh', birth_month: 5, birth_day: 28, is_admin: false, is_active: true },
      { phone: '5101234509', full_name: 'Monday, Udoh', birth_month: 8, birth_day: 15, is_admin: false, is_active: true },
      { phone: '5101234510', full_name: 'Nick, Agbo', birth_month: 4, birth_day: 11, is_admin: false, is_active: true },
      { phone: '5101234511', full_name: 'Philip, Dika', birth_month: 6, birth_day: 9, is_admin: false, is_active: true },
      { phone: '5101234512', full_name: 'Sola, Soneye', birth_month: 1, birth_day: 8, is_admin: false, is_active: true },
      { phone: '5101234513', full_name: 'Suo, Adidi', birth_month: 8, birth_day: 7, is_admin: false, is_active: true },
      { phone: '5101234514', full_name: 'Teddy, Chilaka', birth_month: 4, birth_day: 4, is_admin: false, is_active: true },
      { phone: '5101234515', full_name: 'Tiwalolu, Adebote', birth_month: 10, birth_day: 30, is_admin: false, is_active: true },
      { phone: '5101234516', full_name: 'Ubedu, Joseph', birth_month: 8, birth_day: 2, is_admin: false, is_active: true },
      { phone: '5101234517', full_name: 'Yves, Eteti', birth_month: 6, birth_day: 30, is_admin: false, is_active: true },
      { phone: '5101234518', full_name: 'Ball, Ude', birth_month: 6, birth_day: 16, is_admin: false, is_active: true }
    ];

    if (!confirm(`Are you sure you want to add all ${membersToAdd.length} members? This will add them to the database.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('members')
        .insert(membersToAdd);

      if (error) throw error;

      fetchAllMembers();
      alert(`Successfully added ${membersToAdd.length} members!`);
    } catch (error) {
      console.error('Error adding members:', error);
      if (error instanceof Error && error.message.includes('duplicate key')) {
        alert('Some members may already exist. Please check the member list.');
      } else {
        alert(`Error adding members: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      }
    }
  };
  const toggleMemberStatus = async (memberId: string, currentStatus: boolean) => {
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

  const exportToExcel = () => {
    try {
      // Prepare member data for export
      const exportData = members.map(member => ({
        'Full Name': member.full_name,
        'Phone Number': member.phone,
        'Birthday': member.birth_month && member.birth_day 
          ? `${months.find(m => m.value === member.birth_month?.toString())?.label} ${member.birth_day}`
          : 'Not set',
        'Status': member.is_active ? 'Active' : 'Inactive',
        'Role': member.is_admin ? 'Administrator' : 'Member',
        'Created Date': format(new Date(member.created_at), 'MMM dd, yyyy'),
        'Last Updated': format(new Date(member.updated_at), 'MMM dd, yyyy'),
        'Member ID': member.id
      }));

      // Create workbook with multiple sheets
      const workbook = XLSX.utils.book_new();

      // Members sheet
      const membersSheet = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(workbook, membersSheet, 'Members');

      // Summary sheet
      const summaryData = [
        { Metric: 'Total Members', Value: members.length },
        { Metric: 'Active Members', Value: activeMembers.length },
        { Metric: 'Inactive Members', Value: inactiveMembers.length },
        { Metric: 'Administrators', Value: members.filter(m => m.is_admin).length },
        { Metric: 'Members with Birthdays Set', Value: members.filter(m => m.birth_month && m.birth_day).length },
        { Metric: 'Export Date', Value: format(new Date(), 'MMM dd, yyyy HH:mm') }
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Birthday calendar sheet
      const birthdayData = members
        .filter(m => m.birth_month && m.birth_day)
        .map(member => ({
          'Name': member.full_name,
          'Month': months.find(m => m.value === member.birth_month?.toString())?.label || '',
          'Day': member.birth_day,
          'Phone': member.phone,
          'Status': member.is_active ? 'Active' : 'Inactive'
        }))
        .sort((a, b) => {
          const monthA = months.findIndex(m => m.label === a.Month);
          const monthB = months.findIndex(m => m.label === b.Month);
          if (monthA !== monthB) return monthA - monthB;
          return (a.Day || 0) - (b.Day || 0);
        });
      const birthdaySheet = XLSX.utils.json_to_sheet(birthdayData);
      XLSX.utils.book_append_sheet(workbook, birthdaySheet, 'Birthday Calendar');

      // Generate filename with timestamp
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
      const filename = `JHA_Members_Export_${timestamp}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filename);
      
      alert(`Excel file "${filename}" has been downloaded successfully!`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Error exporting data to Excel. Please try again.');
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
        
        <button
          onClick={exportToExcel}
          className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <FileSpreadsheet size={20} />
          <span>Export to Excel</span>
        </button>
        
        <button
          onClick={addAllMembers}
          className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Users size={20} />
          <span>Add All Members</span>
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

      {/* Edit Member Form */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Member</h3>
              <button
                onClick={() => setEditingMember(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleEditMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Birthday
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={editForm.birth_month}
                    onChange={(e) => setEditForm({ ...editForm, birth_month: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {months.map(month => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={editForm.birth_day}
                    onChange={(e) => setEditForm({ ...editForm, birth_day: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!editForm.birth_month}
                  >
                    <option value="">Select Day</option>
                    {days.map(day => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit_is_admin"
                  checked={editForm.is_admin}
                  onChange={(e) => setEditForm({ ...editForm, is_admin: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="edit_is_admin" className="ml-2 text-sm text-gray-700">
                  Administrator privileges
                </label>
              </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Update Member
                </button>
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
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
                  Birthday
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
                    <div className="text-sm text-gray-600">
                      {member.birth_month && member.birth_day 
                        ? `${months.find(m => m.value === member.birth_month?.toString())?.label} ${member.birth_day}`
                        : 'Not set'
                      }
                    </div>
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
                        onClick={() => startEditing(member)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs font-medium transition-colors flex items-center space-x-1"
                      >
                        <Edit size={12} />
                        <span>Edit</span>
                      </button>
                      
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
                      
                      <button
                        onClick={() => deleteMember(member.id, member.full_name)}
                        className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs font-medium transition-colors flex items-center space-x-1"
                      >
                        <Trash2 size={12} />
                        <span>Delete</span>
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