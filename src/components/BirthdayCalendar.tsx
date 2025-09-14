import React, { useState, useEffect } from 'react';
import { supabase, Member } from '../lib/supabase';
import { Calendar, Gift, User, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDate, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';

interface BirthdayMember extends Member {
  birthday_this_year: Date;
  is_upcoming: boolean;
}

export const BirthdayCalendar: React.FC = () => {
  const [members, setMembers] = useState<BirthdayMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchMembersWithBirthdays();
  }, []);

  const fetchMembersWithBirthdays = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('is_active', true)
        .not('birth_month', 'is', null)
        .not('birth_day', 'is', null);

      if (error) throw error;

      const currentYear = new Date().getFullYear();
      const today = new Date();
      const membersWithBirthdays = (data || []).map(member => {
        const birthday = new Date(currentYear, member.birth_month! - 1, member.birth_day!);
        const nextBirthday = birthday < today 
          ? new Date(currentYear + 1, member.birth_month! - 1, member.birth_day!)
          : birthday;
        
        return {
          ...member,
          birthday_this_year: nextBirthday,
          is_upcoming: nextBirthday <= addDays(today, 7)
        };
      }).sort((a, b) => a.birthday_this_year.getTime() - b.birthday_this_year.getTime());

      setMembers(membersWithBirthdays);
    } catch (error) {
      console.error('Error fetching members with birthdays:', error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingBirthdays = members.filter(member => member.is_upcoming);
  
  // Get full calendar grid (6 weeks)
  const monthStart = startOfWeek(startOfMonth(currentDate));
  const monthEnd = endOfWeek(endOfMonth(currentDate));
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getBirthdaysForDay = (date: Date) => {
    return members.filter(member => {
      const birthday = new Date(date.getFullYear(), member.birth_month! - 1, member.birth_day!);
      return getDate(birthday) === getDate(date) && 
             birthday.getMonth() === date.getMonth();
    });
  };

  const getCurrentMonthBirthdays = () => {
    return members.filter(member => member.birth_month === currentDate.getMonth() + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const currentMonthBirthdays = getCurrentMonthBirthdays();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Birthday Calendar</h2>
        <p className="text-gray-600">Keep track of upcoming celebrations</p>
      </div>

      {/* Current Month Birthdays Summary */}
      {currentMonthBirthdays.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
          <div className="flex items-center space-x-2 mb-4">
            <CalendarDays className="text-purple-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">
              {format(currentDate, 'MMMM yyyy')} Birthdays ({currentMonthBirthdays.length})
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {currentMonthBirthdays.map(member => (
              <span key={member.id} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                {member.full_name} - {member.birth_day}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Birthdays */}
      {upcomingBirthdays.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center space-x-2 mb-4">
            <Gift className="text-blue-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Birthdays (Next 7 Days)</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingBirthdays.map(member => (
              <div key={member.id} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center space-x-3">
                  {member.profile_picture_url ? (
                    <img
                      src={member.profile_picture_url}
                      alt={member.full_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="text-blue-600" size={20} />
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-medium text-gray-900">{member.full_name}</h4>
                    <p className="text-sm text-blue-600 font-medium">
                      {format(member.birthday_this_year, 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Calendar Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {format(currentDate, 'MMMM yyyy')}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Calendar Grid */}
        <div className="p-6">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(day => {
              const dayBirthdays = getBirthdaysForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);
              const dayNumber = getDate(day);

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[100px] p-2 border rounded-lg transition-all hover:shadow-sm ${
                    isCurrentMonth ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
                  } ${isCurrentDay ? 'ring-2 ring-blue-500 bg-blue-50' : ''} ${
                    dayBirthdays.length > 0 ? 'border-purple-200 bg-purple-50' : ''
                  }`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  } ${isCurrentDay ? 'text-blue-700 font-bold' : ''}`}>
                    {dayNumber}
                  </div>
                  
                  {dayBirthdays.length > 0 && (
                    <div className="space-y-1">
                      {dayBirthdays.map(member => (
                        <div
                          key={member.id}
                          className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 text-xs px-2 py-1 rounded-md truncate flex items-center space-x-1 border border-purple-200 shadow-sm"
                          title={`${member.full_name}'s Birthday`}
                        >
                          <Gift size={10} className="text-purple-600 flex-shrink-0" />
                          <span className="truncate font-medium">{member.full_name}</span>
                        </div>
                      ))}
                      {dayBirthdays.length > 2 && (
                        <div className="text-xs text-purple-600 font-medium text-center">
                          +{dayBirthdays.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Calendar Legend */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Calendar Legend</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-50 border-2 border-blue-500 rounded"></div>
            <span className="text-gray-600">Today</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-50 border border-purple-200 rounded"></div>
            <span className="text-gray-600">Birthday</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-50 border border-gray-100 rounded"></div>
            <span className="text-gray-600">Other Month</span>
          </div>
        </div>
      </div>
    </div>
  );
};