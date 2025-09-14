import React from 'react';
import { Users, Calendar, User, Settings, Eye, Shield, Phone, Gift } from 'lucide-react';

export const AdminPreview: React.FC = () => {
  const mockMembers = [
    { id: '1', name: 'Brother Johnson', phone: '+1 (925) 434-3862', birthday: 'March 15', isAdmin: true },
    { id: '2', name: 'Brother Williams', phone: '+1 (555) 234-5678', birthday: 'April 22', isAdmin: false },
    { id: '3', name: 'Brother Davis', phone: '+1 (555) 345-6789', birthday: 'May 8', isAdmin: true },
    { id: '4', name: 'Brother Brown', phone: '+1 (555) 456-7890', birthday: 'June 12', isAdmin: false },
    { id: '5', name: 'Brother Wilson', phone: '+1 (555) 567-8901', birthday: 'July 3', isAdmin: false },
    { id: '6', name: 'Brother Miller', phone: '+1 (555) 678-9012', birthday: 'August 18', isAdmin: false },
  ];

  const upcomingBirthdays = [
    { name: 'Brother Johnson', date: 'March 15', daysAway: 2 },
    { name: 'Brother Davis', date: 'May 8', daysAway: 5 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <Eye className="text-white" size={28} />
          <h2 className="text-2xl font-bold">Admin Preview - JHA Men Of Impact</h2>
        </div>
        <p className="text-blue-100">
          This is a preview of what the community platform will look like once members are added and active.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{mockMembers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <Shield className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Members</p>
              <p className="text-2xl font-bold text-gray-900">{mockMembers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Settings className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Administrators</p>
              <p className="text-2xl font-bold text-gray-900">
                {mockMembers.filter(m => m.isAdmin).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Gift className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming Birthdays</p>
              <p className="text-2xl font-bold text-gray-900">{upcomingBirthdays.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Birthdays Preview */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-100">
        <div className="flex items-center space-x-2 mb-4">
          <Gift className="text-orange-600" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Birthday Celebrations</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {upcomingBirthdays.map((birthday, index) => (
            <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-orange-100">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <User className="text-orange-600" size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{birthday.name}</h4>
                  <p className="text-sm text-orange-600 font-medium">{birthday.date}</p>
                  <p className="text-xs text-gray-500">In {birthday.daysAway} days</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Member Directory Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Users size={20} />
            <span>Member Directory Preview</span>
          </h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockMembers.map((member) => (
              <div
                key={member.id}
                className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center ring-2 ring-blue-200">
                      <User className="text-blue-600" size={28} />
                    </div>
                    {member.isAdmin && (
                      <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                        A
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center space-y-3">
                  <h3 className="font-semibold text-gray-900">{member.name}</h3>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-center space-x-2">
                      <Phone size={16} />
                      <span>{member.phone}</span>
                    </div>
                    
                    <div className="flex items-center justify-center space-x-2">
                      <Calendar size={16} />
                      <span>{member.birthday}</span>
                    </div>
                  </div>

                  {member.isAdmin && (
                    <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Administrator
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Features</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Member Features</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Secure phone number authentication</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Personal profile management</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Profile picture upload</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Member directory with search</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Birthday calendar view</span>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Admin Features</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Add and manage members</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Activate/deactivate accounts</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Grant admin privileges</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>WhatsApp birthday notifications</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Member analytics and reports</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white text-center">
        <h3 className="text-xl font-bold mb-2">Ready to Get Started?</h3>
        <p className="text-blue-100 mb-4">
          Connect to Supabase to set up your database and start adding members to your community.
        </p>
        <div className="text-sm text-blue-200">
          Click "Connect to Supabase" in the top right corner to begin setup.
        </div>
      </div>
    </div>
  );
};