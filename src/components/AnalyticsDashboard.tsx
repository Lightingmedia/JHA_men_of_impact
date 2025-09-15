import React, { useState, useEffect } from 'react';
import { supabase, Member } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  Clock, 
  Smartphone, 
  Monitor, 
  Activity,
  Target,
  PieChart,
  LineChart,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, isToday, isYesterday } from 'date-fns';

interface LoginActivity {
  id: string;
  member_id: string;
  login_time: string;
  device_type: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  success: boolean;
  ip_address?: string;
  user_agent: string;
}

interface AnalyticsData {
  totalMembers: number;
  activeToday: number;
  activeThisWeek: number;
  activeThisMonth: number;
  loginSuccessRate: number;
  avgSessionDuration: number;
  topDevices: { device: string; count: number; percentage: number }[];
  topBrowsers: { browser: string; count: number; percentage: number }[];
  hourlyActivity: { hour: number; count: number }[];
  dailyActivity: { date: string; logins: number; uniqueUsers: number }[];
  memberSegments: {
    highly_active: number;
    moderately_active: number;
    low_activity: number;
    inactive: number;
  };
}

export const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loginActivities, setLoginActivities] = useState<LoginActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(7); // days
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.is_admin) {
      fetchAnalyticsData();
    }
  }, [user, dateRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch members data
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('*');

      if (membersError) throw membersError;

      // Fetch login activities (simulated data for demo)
      const mockLoginActivities = generateMockLoginData(dateRange);
      setLoginActivities(mockLoginActivities);

      // Calculate analytics
      const analyticsData = calculateAnalytics(members || [], mockLoginActivities);
      setAnalytics(analyticsData);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockLoginData = (days: number): LoginActivity[] => {
    const activities: LoginActivity[] = [];
    const members = ['member1', 'member2', 'member3', 'member4', 'member5'];
    const devices = ['mobile', 'desktop', 'tablet'] as const;
    const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];

    for (let i = 0; i < days; i++) {
      const date = subDays(new Date(), i);
      const dailyLogins = Math.floor(Math.random() * 15) + 5;

      for (let j = 0; j < dailyLogins; j++) {
        const hour = Math.floor(Math.random() * 24);
        const loginTime = new Date(date);
        loginTime.setHours(hour, Math.floor(Math.random() * 60));

        activities.push({
          id: `login-${i}-${j}`,
          member_id: members[Math.floor(Math.random() * members.length)],
          login_time: loginTime.toISOString(),
          device_type: devices[Math.floor(Math.random() * devices.length)],
          browser: browsers[Math.floor(Math.random() * browsers.length)],
          success: Math.random() > 0.1, // 90% success rate
          user_agent: `Mock User Agent ${j}`,
        });
      }
    }

    return activities.sort((a, b) => new Date(b.login_time).getTime() - new Date(a.login_time).getTime());
  };

  const calculateAnalytics = (members: Member[], activities: LoginActivity[]): AnalyticsData => {
    const now = new Date();
    const today = startOfDay(now);
    const weekAgo = subDays(now, 7);
    const monthAgo = subDays(now, 30);

    // Filter activities by time periods
    const todayActivities = activities.filter(a => new Date(a.login_time) >= today);
    const weekActivities = activities.filter(a => new Date(a.login_time) >= weekAgo);
    const monthActivities = activities.filter(a => new Date(a.login_time) >= monthAgo);

    // Calculate unique active users
    const activeToday = new Set(todayActivities.map(a => a.member_id)).size;
    const activeThisWeek = new Set(weekActivities.map(a => a.member_id)).size;
    const activeThisMonth = new Set(monthActivities.map(a => a.member_id)).size;

    // Calculate success rate
    const successfulLogins = activities.filter(a => a.success).length;
    const loginSuccessRate = activities.length > 0 ? (successfulLogins / activities.length) * 100 : 0;

    // Device analytics
    const deviceCounts = activities.reduce((acc, activity) => {
      acc[activity.device_type] = (acc[activity.device_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topDevices = Object.entries(deviceCounts)
      .map(([device, count]) => ({
        device,
        count,
        percentage: (count / activities.length) * 100
      }))
      .sort((a, b) => b.count - a.count);

    // Browser analytics
    const browserCounts = activities.reduce((acc, activity) => {
      acc[activity.browser] = (acc[activity.browser] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topBrowsers = Object.entries(browserCounts)
      .map(([browser, count]) => ({
        browser,
        count,
        percentage: (count / activities.length) * 100
      }))
      .sort((a, b) => b.count - a.count);

    // Hourly activity pattern
    const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: activities.filter(a => new Date(a.login_time).getHours() === hour).length
    }));

    // Daily activity for the past week
    const dailyActivity = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(now, i);
      const dayActivities = activities.filter(a => {
        const activityDate = new Date(a.login_time);
        return activityDate >= startOfDay(date) && activityDate <= endOfDay(date);
      });

      return {
        date: format(date, 'MMM dd'),
        logins: dayActivities.length,
        uniqueUsers: new Set(dayActivities.map(a => a.member_id)).size
      };
    }).reverse();

    // Member segmentation (mock data based on activity levels)
    const memberSegments = {
      highly_active: Math.floor(members.length * 0.2),
      moderately_active: Math.floor(members.length * 0.3),
      low_activity: Math.floor(members.length * 0.3),
      inactive: Math.floor(members.length * 0.2)
    };

    return {
      totalMembers: members.length,
      activeToday,
      activeThisWeek,
      activeThisMonth,
      loginSuccessRate,
      avgSessionDuration: 25, // Mock average session duration in minutes
      topDevices,
      topBrowsers,
      hourlyActivity,
      dailyActivity,
      memberSegments
    };
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
  };

  const exportData = () => {
    if (!analytics) return;

    const csvData = [
      ['Metric', 'Value'],
      ['Total Members', analytics.totalMembers],
      ['Active Today', analytics.activeToday],
      ['Active This Week', analytics.activeThisWeek],
      ['Active This Month', analytics.activeThisMonth],
      ['Login Success Rate', `${analytics.loginSuccessRate.toFixed(2)}%`],
      ['Avg Session Duration', `${analytics.avgSessionDuration} minutes`],
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!user?.is_admin) {
    return (
      <div className="text-center py-12">
        <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
        <p className="text-gray-600">Only administrators can view analytics data.</p>
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

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-600">Unable to load analytics data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h2>
          <p className="text-gray-600">Member activity and platform insights</p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>

          <button
            onClick={refreshData}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={exportData}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalMembers}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Today</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.activeToday}</p>
              <p className="text-xs text-green-600">
                {analytics.totalMembers > 0 ? ((analytics.activeToday / analytics.totalMembers) * 100).toFixed(1) : 0}% of total
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Activity className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Login Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.loginSuccessRate.toFixed(1)}%</p>
              <p className="text-xs text-blue-600">Last {dateRange} days</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Target className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Session</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.avgSessionDuration}m</p>
              <p className="text-xs text-orange-600">Minutes per session</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Clock className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Daily Activity</h3>
            <LineChart className="text-gray-400" size={20} />
          </div>
          
          <div className="space-y-3">
            {analytics.dailyActivity.map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{day.date}</span>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">{day.logins} logins</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">{day.uniqueUsers} users</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Usage */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Device Usage</h3>
            <PieChart className="text-gray-400" size={20} />
          </div>
          
          <div className="space-y-4">
            {analytics.topDevices.map((device, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {device.device === 'mobile' && <Smartphone className="text-blue-600" size={20} />}
                  {device.device === 'desktop' && <Monitor className="text-green-600" size={20} />}
                  {device.device === 'tablet' && <Monitor className="text-purple-600" size={20} />}
                  <span className="text-sm font-medium capitalize">{device.device}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{device.count}</p>
                  <p className="text-xs text-gray-500">{device.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Member Segmentation */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Member Activity Segments</h3>
          <Users className="text-gray-400" size={20} />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-2xl font-bold text-green-700">{analytics.memberSegments.highly_active}</p>
            <p className="text-sm text-green-600">Highly Active</p>
            <p className="text-xs text-gray-500 mt-1">Daily users</p>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-2xl font-bold text-blue-700">{analytics.memberSegments.moderately_active}</p>
            <p className="text-sm text-blue-600">Moderately Active</p>
            <p className="text-xs text-gray-500 mt-1">Weekly users</p>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-2xl font-bold text-yellow-700">{analytics.memberSegments.low_activity}</p>
            <p className="text-sm text-yellow-600">Low Activity</p>
            <p className="text-xs text-gray-500 mt-1">Monthly users</p>
          </div>
          
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-2xl font-bold text-red-700">{analytics.memberSegments.inactive}</p>
            <p className="text-sm text-red-600">Inactive</p>
            <p className="text-xs text-gray-500 mt-1">No recent activity</p>
          </div>
        </div>
      </div>

      {/* Recent Login Activities */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Login Activities</h3>
          <Activity className="text-gray-400" size={20} />
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Time</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Device</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Browser</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {loginActivities.slice(0, 10).map((activity) => (
                <tr key={activity.id} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {format(new Date(activity.login_time), 'MMM dd, HH:mm')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      {activity.device_type === 'mobile' && <Smartphone size={16} className="text-blue-600" />}
                      {activity.device_type === 'desktop' && <Monitor size={16} className="text-green-600" />}
                      <span className="text-sm text-gray-900 capitalize">{activity.device_type}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">{activity.browser}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      activity.success 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {activity.success ? 'Success' : 'Failed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Browser Analytics */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Browser Analytics</h3>
          <BarChart3 className="text-gray-400" size={20} />
        </div>
        
        <div className="space-y-4">
          {analytics.topBrowsers.map((browser, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">{browser.browser}</span>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${browser.percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">
                  {browser.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};