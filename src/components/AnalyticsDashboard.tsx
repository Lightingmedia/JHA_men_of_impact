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
  RefreshCw,
  Eye,
  UserCheck,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { format, subDays, startOfDay, endOfDay, isToday, isYesterday, startOfWeek, startOfMonth } from 'date-fns';

interface LoginActivity {
  id: string;
  member_id: string;
  login_time: string;
  device_type: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  success: boolean;
  ip_address?: string;
  user_agent: string;
  session_duration?: number;
}

interface OrderActivity {
  id: string;
  member_id: string;
  order_date: string;
  order_value: number;
  product_category: string;
  status: 'completed' | 'pending' | 'cancelled';
  device_type: 'mobile' | 'desktop' | 'tablet';
}

interface AnalyticsData {
  // Member Analytics
  totalMembers: number;
  activeToday: number;
  activeThisWeek: number;
  activeThisMonth: number;
  newMembersThisMonth: number;
  
  // Login Analytics
  loginSuccessRate: number;
  avgSessionDuration: number;
  mobileLoginSuccessRate: number;
  desktopLoginSuccessRate: number;
  
  // Order Analytics
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  conversionRate: number;
  mobileConversionRate: number;
  desktopConversionRate: number;
  
  // Device Analytics
  topDevices: { device: string; count: number; percentage: number; successRate: number }[];
  topBrowsers: { browser: string; count: number; percentage: number; successRate: number }[];
  
  // Time-based Analytics
  hourlyActivity: { hour: number; logins: number; orders: number }[];
  dailyActivity: { date: string; logins: number; uniqueUsers: number; orders: number; revenue: number }[];
  
  // Member Segmentation
  memberSegments: {
    highly_active: number;
    moderately_active: number;
    low_activity: number;
    inactive: number;
  };
  
  // Product Analytics
  topCategories: { category: string; orders: number; revenue: number }[];
  
  // Mobile Issues
  mobileIssues: {
    loginFailures: number;
    browserCompatibility: { browser: string; issues: number }[];
    commonErrors: { error: string; count: number }[];
  };
}

export const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loginActivities, setLoginActivities] = useState<LoginActivity[]>([]);
  const [orderActivities, setOrderActivities] = useState<OrderActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(7); // days
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'overview' | 'mobile'>('overview');

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

      // Generate comprehensive mock data for demo
      const mockLoginActivities = generateMockLoginData(dateRange);
      const mockOrderActivities = generateMockOrderData(dateRange);
      
      setLoginActivities(mockLoginActivities);
      setOrderActivities(mockOrderActivities);

      // Calculate comprehensive analytics
      const analyticsData = calculateComprehensiveAnalytics(members || [], mockLoginActivities, mockOrderActivities);
      setAnalytics(analyticsData);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockLoginData = (days: number): LoginActivity[] => {
    const activities: LoginActivity[] = [];
    const members = ['member1', 'member2', 'member3', 'member4', 'member5', 'member6', 'member7'];
    const devices = ['mobile', 'desktop', 'tablet'] as const;
    const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge', 'Samsung Internet'];
    const mobileFailureRate = 0.25; // 25% failure rate on mobile
    const desktopFailureRate = 0.05; // 5% failure rate on desktop

    for (let i = 0; i < days; i++) {
      const date = subDays(new Date(), i);
      const dailyLogins = Math.floor(Math.random() * 25) + 15; // 15-40 logins per day

      for (let j = 0; j < dailyLogins; j++) {
        const hour = Math.floor(Math.random() * 24);
        const loginTime = new Date(date);
        loginTime.setHours(hour, Math.floor(Math.random() * 60));

        const deviceType = devices[Math.floor(Math.random() * devices.length)];
        const failureRate = deviceType === 'mobile' ? mobileFailureRate : desktopFailureRate;
        const success = Math.random() > failureRate;

        activities.push({
          id: `login-${i}-${j}`,
          member_id: members[Math.floor(Math.random() * members.length)],
          login_time: loginTime.toISOString(),
          device_type: deviceType,
          browser: browsers[Math.floor(Math.random() * browsers.length)],
          success,
          user_agent: `Mock User Agent ${deviceType} ${j}`,
          session_duration: success ? Math.floor(Math.random() * 45) + 5 : 0, // 5-50 minutes
        });
      }
    }

    return activities.sort((a, b) => new Date(b.login_time).getTime() - new Date(a.login_time).getTime());
  };

  const generateMockOrderData = (days: number): OrderActivity[] => {
    const activities: OrderActivity[] = [];
    const members = ['member1', 'member2', 'member3', 'member4', 'member5'];
    const categories = ['Books', 'Clothing', 'Electronics', 'Health', 'Home', 'Sports'];
    const devices = ['mobile', 'desktop', 'tablet'] as const;
    const statuses = ['completed', 'pending', 'cancelled'] as const;

    for (let i = 0; i < days; i++) {
      const date = subDays(new Date(), i);
      const dailyOrders = Math.floor(Math.random() * 12) + 3; // 3-15 orders per day

      for (let j = 0; j < dailyOrders; j++) {
        const hour = Math.floor(Math.random() * 24);
        const orderTime = new Date(date);
        orderTime.setHours(hour, Math.floor(Math.random() * 60));

        const deviceType = devices[Math.floor(Math.random() * devices.length)];
        const orderValue = Math.floor(Math.random() * 200) + 25; // $25-$225

        activities.push({
          id: `order-${i}-${j}`,
          member_id: members[Math.floor(Math.random() * members.length)],
          order_date: orderTime.toISOString(),
          order_value: orderValue,
          product_category: categories[Math.floor(Math.random() * categories.length)],
          status: statuses[Math.floor(Math.random() * statuses.length)],
          device_type: deviceType,
        });
      }
    }

    return activities.sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());
  };

  const calculateComprehensiveAnalytics = (
    members: Member[], 
    loginActivities: LoginActivity[], 
    orderActivities: OrderActivity[]
  ): AnalyticsData => {
    const now = new Date();
    const today = startOfDay(now);
    const weekAgo = subDays(now, 7);
    const monthAgo = subDays(now, 30);

    // Filter activities by time periods
    const todayLogins = loginActivities.filter(a => new Date(a.login_time) >= today);
    const weekLogins = loginActivities.filter(a => new Date(a.login_time) >= weekAgo);
    const monthLogins = loginActivities.filter(a => new Date(a.login_time) >= monthAgo);

    const todayOrders = orderActivities.filter(a => new Date(a.order_date) >= today);
    const weekOrders = orderActivities.filter(a => new Date(a.order_date) >= weekAgo);
    const monthOrders = orderActivities.filter(a => new Date(a.order_date) >= monthAgo);

    // Member Analytics
    const activeToday = new Set(todayLogins.map(a => a.member_id)).size;
    const activeThisWeek = new Set(weekLogins.map(a => a.member_id)).size;
    const activeThisMonth = new Set(monthLogins.map(a => a.member_id)).size;
    const newMembersThisMonth = members.filter(m => 
      new Date(m.created_at) >= startOfMonth(now)
    ).length;

    // Login Analytics
    const successfulLogins = loginActivities.filter(a => a.success);
    const loginSuccessRate = loginActivities.length > 0 ? (successfulLogins.length / loginActivities.length) * 100 : 0;
    
    const mobileLogins = loginActivities.filter(a => a.device_type === 'mobile');
    const mobileSuccessfulLogins = mobileLogins.filter(a => a.success);
    const mobileLoginSuccessRate = mobileLogins.length > 0 ? (mobileSuccessfulLogins.length / mobileLogins.length) * 100 : 0;
    
    const desktopLogins = loginActivities.filter(a => a.device_type === 'desktop');
    const desktopSuccessfulLogins = desktopLogins.filter(a => a.success);
    const desktopLoginSuccessRate = desktopLogins.length > 0 ? (desktopSuccessfulLogins.length / desktopLogins.length) * 100 : 0;

    const avgSessionDuration = successfulLogins.reduce((sum, login) => sum + (login.session_duration || 0), 0) / successfulLogins.length;

    // Order Analytics
    const completedOrders = orderActivities.filter(o => o.status === 'completed');
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.order_value, 0);
    const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
    
    const uniqueLoginUsers = new Set(successfulLogins.map(a => a.member_id)).size;
    const uniqueOrderUsers = new Set(completedOrders.map(o => o.member_id)).size;
    const conversionRate = uniqueLoginUsers > 0 ? (uniqueOrderUsers / uniqueLoginUsers) * 100 : 0;

    const mobileOrderUsers = new Set(completedOrders.filter(o => o.device_type === 'mobile').map(o => o.member_id)).size;
    const mobileLoginUsers = new Set(mobileSuccessfulLogins.map(a => a.member_id)).size;
    const mobileConversionRate = mobileLoginUsers > 0 ? (mobileOrderUsers / mobileLoginUsers) * 100 : 0;

    const desktopOrderUsers = new Set(completedOrders.filter(o => o.device_type === 'desktop').map(o => o.member_id)).size;
    const desktopLoginUsers = new Set(desktopSuccessfulLogins.map(a => a.member_id)).size;
    const desktopConversionRate = desktopLoginUsers > 0 ? (desktopOrderUsers / desktopLoginUsers) * 100 : 0;

    // Device Analytics with Success Rates
    const deviceCounts = loginActivities.reduce((acc, activity) => {
      if (!acc[activity.device_type]) {
        acc[activity.device_type] = { total: 0, successful: 0 };
      }
      acc[activity.device_type].total++;
      if (activity.success) acc[activity.device_type].successful++;
      return acc;
    }, {} as Record<string, { total: number; successful: number }>);

    const topDevices = Object.entries(deviceCounts)
      .map(([device, counts]) => ({
        device,
        count: counts.total,
        percentage: (counts.total / loginActivities.length) * 100,
        successRate: (counts.successful / counts.total) * 100
      }))
      .sort((a, b) => b.count - a.count);

    // Browser Analytics with Success Rates
    const browserCounts = loginActivities.reduce((acc, activity) => {
      if (!acc[activity.browser]) {
        acc[activity.browser] = { total: 0, successful: 0 };
      }
      acc[activity.browser].total++;
      if (activity.success) acc[activity.browser].successful++;
      return acc;
    }, {} as Record<string, { total: number; successful: number }>);

    const topBrowsers = Object.entries(browserCounts)
      .map(([browser, counts]) => ({
        browser,
        count: counts.total,
        percentage: (counts.total / loginActivities.length) * 100,
        successRate: (counts.successful / counts.total) * 100
      }))
      .sort((a, b) => b.count - a.count);

    // Time-based Analytics
    const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      logins: loginActivities.filter(a => new Date(a.login_time).getHours() === hour).length,
      orders: orderActivities.filter(o => new Date(o.order_date).getHours() === hour).length
    }));

    const dailyActivity = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(now, i);
      const dayLogins = loginActivities.filter(a => {
        const activityDate = new Date(a.login_time);
        return activityDate >= startOfDay(date) && activityDate <= endOfDay(date);
      });
      const dayOrders = orderActivities.filter(o => {
        const orderDate = new Date(o.order_date);
        return orderDate >= startOfDay(date) && orderDate <= endOfDay(date);
      });

      return {
        date: format(date, 'MMM dd'),
        logins: dayLogins.length,
        uniqueUsers: new Set(dayLogins.map(a => a.member_id)).size,
        orders: dayOrders.length,
        revenue: dayOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.order_value, 0)
      };
    }).reverse();

    // Member Segmentation based on activity
    const memberActivity = members.map(member => {
      const memberLogins = monthLogins.filter(l => l.member_id === member.id && l.success);
      const memberOrders = monthOrders.filter(o => o.member_id === member.id);
      return {
        member,
        loginCount: memberLogins.length,
        orderCount: memberOrders.length,
        totalActivity: memberLogins.length + memberOrders.length * 2 // Weight orders more
      };
    });

    const memberSegments = {
      highly_active: memberActivity.filter(m => m.totalActivity >= 15).length,
      moderately_active: memberActivity.filter(m => m.totalActivity >= 5 && m.totalActivity < 15).length,
      low_activity: memberActivity.filter(m => m.totalActivity >= 1 && m.totalActivity < 5).length,
      inactive: memberActivity.filter(m => m.totalActivity === 0).length
    };

    // Product Category Analytics
    const categoryCounts = completedOrders.reduce((acc, order) => {
      if (!acc[order.product_category]) {
        acc[order.product_category] = { orders: 0, revenue: 0 };
      }
      acc[order.product_category].orders++;
      acc[order.product_category].revenue += order.order_value;
      return acc;
    }, {} as Record<string, { orders: number; revenue: number }>);

    const topCategories = Object.entries(categoryCounts)
      .map(([category, data]) => ({
        category,
        orders: data.orders,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Mobile Issues Analysis
    const mobileFailures = mobileLogins.filter(l => !l.success);
    const mobileBrowserIssues = mobileFailures.reduce((acc, failure) => {
      acc[failure.browser] = (acc[failure.browser] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const browserCompatibility = Object.entries(mobileBrowserIssues)
      .map(([browser, issues]) => ({ browser, issues }))
      .sort((a, b) => b.issues - a.issues);

    const commonErrors = [
      { error: 'Permission dismissed', count: Math.floor(mobileFailures.length * 0.4) },
      { error: 'Network timeout', count: Math.floor(mobileFailures.length * 0.3) },
      { error: 'Invalid credentials', count: Math.floor(mobileFailures.length * 0.2) },
      { error: 'Browser compatibility', count: Math.floor(mobileFailures.length * 0.1) }
    ];

    return {
      totalMembers: members.length,
      activeToday,
      activeThisWeek,
      activeThisMonth,
      newMembersThisMonth,
      loginSuccessRate,
      avgSessionDuration,
      mobileLoginSuccessRate,
      desktopLoginSuccessRate,
      totalOrders: orderActivities.length,
      totalRevenue,
      avgOrderValue,
      conversionRate,
      mobileConversionRate,
      desktopConversionRate,
      topDevices,
      topBrowsers,
      hourlyActivity,
      dailyActivity,
      memberSegments,
      topCategories,
      mobileIssues: {
        loginFailures: mobileFailures.length,
        browserCompatibility,
        commonErrors
      }
    };
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
  };

  const exportData = () => {
    if (!analytics) return;

    try {
      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Analytics Summary Sheet
      const summaryData = [
        { Metric: 'Total Members', Value: analytics.totalMembers },
        { Metric: 'Active Today', Value: analytics.activeToday },
        { Metric: 'Active This Week', Value: analytics.activeThisWeek },
        { Metric: 'Active This Month', Value: analytics.activeThisMonth },
        { Metric: 'New Members This Month', Value: analytics.newMembersThisMonth },
        { Metric: 'Login Success Rate', Value: `${analytics.loginSuccessRate.toFixed(2)}%` },
        { Metric: 'Mobile Login Success Rate', Value: `${analytics.mobileLoginSuccessRate.toFixed(2)}%` },
        { Metric: 'Desktop Login Success Rate', Value: `${analytics.desktopLoginSuccessRate.toFixed(2)}%` },
        { Metric: 'Average Session Duration (minutes)', Value: analytics.avgSessionDuration.toFixed(1) },
        { Metric: 'Report Generated', Value: format(new Date(), 'MMM dd, yyyy HH:mm') }
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Analytics Summary');

      // Daily Activity Sheet
      const dailyActivitySheet = XLSX.utils.json_to_sheet(analytics.dailyActivity);
      XLSX.utils.book_append_sheet(workbook, dailyActivitySheet, 'Daily Activity');

      // Device Usage Sheet
      const deviceData = analytics.topDevices.map(device => ({
        Device: device.device,
        'Login Count': device.count,
        'Usage Percentage': `${device.percentage.toFixed(1)}%`,
        'Success Rate': `${device.successRate.toFixed(1)}%`
      }));
      const deviceSheet = XLSX.utils.json_to_sheet(deviceData);
      XLSX.utils.book_append_sheet(workbook, deviceSheet, 'Device Usage');

      // Browser Usage Sheet
      const browserData = analytics.topBrowsers.map(browser => ({
        Browser: browser.browser,
        'Login Count': browser.count,
        'Usage Percentage': `${browser.percentage.toFixed(1)}%`,
        'Success Rate': `${browser.successRate.toFixed(1)}%`
      }));
      const browserSheet = XLSX.utils.json_to_sheet(browserData);
      XLSX.utils.book_append_sheet(workbook, browserSheet, 'Browser Usage');

      // Member Segments Sheet
      const segmentData = [
        { Segment: 'Highly Active', Count: analytics.memberSegments.highly_active, Description: 'Daily users' },
        { Segment: 'Moderately Active', Count: analytics.memberSegments.moderately_active, Description: 'Weekly users' },
        { Segment: 'Low Activity', Count: analytics.memberSegments.low_activity, Description: 'Monthly users' },
        { Segment: 'Inactive', Count: analytics.memberSegments.inactive, Description: 'No recent activity' }
      ];
      const segmentSheet = XLSX.utils.json_to_sheet(segmentData);
      XLSX.utils.book_append_sheet(workbook, segmentSheet, 'Member Segments');

      // Mobile Issues Sheet (if there are issues)
      if (analytics.mobileIssues.loginFailures > 0) {
        const mobileIssuesData = [
          { Issue: 'Total Mobile Login Failures', Count: analytics.mobileIssues.loginFailures },
          ...analytics.mobileIssues.commonErrors.map(error => ({
            Issue: error.error,
            Count: error.count
          }))
        ];
        const mobileIssuesSheet = XLSX.utils.json_to_sheet(mobileIssuesData);
        XLSX.utils.book_append_sheet(workbook, mobileIssuesSheet, 'Mobile Issues');
      }

      // Recent Login Activities Sheet
      const recentActivities = loginActivities.slice(0, 100).map(activity => ({
        'Login Time': format(new Date(activity.login_time), 'MMM dd, yyyy HH:mm'),
        'Device Type': activity.device_type,
        'Browser': activity.browser,
        'Status': activity.success ? 'Success' : 'Failed',
        'Session Duration (minutes)': activity.session_duration || 0,
        'Member ID': activity.member_id
      }));
      const activitiesSheet = XLSX.utils.json_to_sheet(recentActivities);
      XLSX.utils.book_append_sheet(workbook, activitiesSheet, 'Recent Activities');

      // Generate filename with timestamp
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
      const filename = `JHA_Analytics_Report_${timestamp}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filename);
      
      alert(`Analytics report "${filename}" has been downloaded successfully!`);
    } catch (error) {
      console.error('Error exporting analytics:', error);
      alert('Error exporting analytics data. Please try again.');
    }
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
          <p className="text-gray-600">Comprehensive member activity and business insights</p>
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

      {/* Metric Selector */}
      <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setSelectedMetric('overview')}
          className={`px-4 py-2 rounded-md transition-colors ${
            selectedMetric === 'overview' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setSelectedMetric('mobile')}
          className={`px-4 py-2 rounded-md transition-colors ${
            selectedMetric === 'mobile' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Mobile Issues
        </button>
      </div>

      {/* Mobile Issues Alert */}
      {analytics.mobileLoginSuccessRate < 80 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="text-red-600" size={20} />
            <h3 className="text-red-800 font-medium">Critical Mobile Login Issue Detected</h3>
          </div>
          <p className="text-red-700 text-sm mt-1">
            Mobile login success rate is {analytics.mobileLoginSuccessRate.toFixed(1)}% 
            (vs {analytics.desktopLoginSuccessRate.toFixed(1)}% on desktop). 
            Immediate attention required.
          </p>
        </div>
      )}

      {selectedMetric === 'overview' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalMembers}</p>
                  <p className="text-xs text-green-600">+{analytics.newMembersThisMonth} this month</p>
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
                  <p className="text-2xl font-bold text-gray-900">{analytics.avgSessionDuration.toFixed(0)}m</p>
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
                <h3 className="text-lg font-semibold text-gray-900">Device Usage & Success Rates</h3>
                <PieChart className="text-gray-400" size={20} />
              </div>
              
              <div className="space-y-4">
                {analytics.topDevices.map((device, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {device.device === 'mobile' && <Smartphone className="text-blue-600" size={20} />}
                      {device.device === 'desktop' && <Monitor className="text-green-600" size={20} />}
                      {device.device === 'tablet' && <Monitor className="text-purple-600" size={20} />}
                      <div>
                        <span className="text-sm font-medium capitalize">{device.device}</span>
                        <p className="text-xs text-gray-500">{device.successRate.toFixed(1)}% success rate</p>
                      </div>
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
        </>
      )}

      {selectedMetric === 'mobile' && (
        <>
          {/* Mobile Issues KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Mobile Success Rate</p>
                  <p className="text-2xl font-bold text-red-600">{analytics.mobileLoginSuccessRate.toFixed(1)}%</p>
                  <p className="text-xs text-red-600">vs {analytics.desktopLoginSuccessRate.toFixed(1)}% desktop</p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <Smartphone className="text-red-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Mobile Failures</p>
                  <p className="text-2xl font-bold text-red-600">{analytics.mobileIssues.loginFailures}</p>
                  <p className="text-xs text-red-600">Last {dateRange} days</p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <AlertTriangle className="text-red-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Mobile Conversion</p>
                  <p className="text-2xl font-bold text-orange-600">{analytics.mobileConversionRate.toFixed(1)}%</p>
                  <p className="text-xs text-orange-600">vs {analytics.desktopConversionRate.toFixed(1)}% desktop</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <TrendingUp className="text-orange-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Issue Impact</p>
                  <p className="text-2xl font-bold text-red-600">High</p>
                  <p className="text-xs text-red-600">Immediate action needed</p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <Target className="text-red-600" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Issues Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Browser Compatibility Issues */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Mobile Browser Issues</h3>
                <AlertTriangle className="text-red-400" size={20} />
              </div>
              
              <div className="space-y-4">
                {analytics.mobileIssues.browserCompatibility.map((browser, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-900">{browser.browser}</span>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">{browser.issues} failures</p>
                      <p className="text-xs text-red-500">High priority</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Common Error Types */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Common Mobile Errors</h3>
                <BarChart3 className="text-red-400" size={20} />
              </div>
              
              <div className="space-y-4">
                {analytics.mobileIssues.commonErrors.map((error, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{error.error}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-600 h-2 rounded-full" 
                          style={{ width: `${(error.count / analytics.mobileIssues.loginFailures) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-red-600 w-12 text-right">
                        {error.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Debugging Checklist */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Mobile Login Debugging Checklist</h3>
              <CheckCircle className="text-green-400" size={20} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Immediate Actions</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                    <span className="text-sm text-gray-700">Test login on multiple mobile browsers</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                    <span className="text-sm text-gray-700">Check responsive design breakpoints</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                    <span className="text-sm text-gray-700">Verify touch target sizes (min 44px)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                    <span className="text-sm text-gray-700">Test camera/microphone permissions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                    <span className="text-sm text-gray-700">Check HTTPS certificate validity</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Technical Investigation</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                    <span className="text-sm text-gray-700">Review browser console errors</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                    <span className="text-sm text-gray-700">Analyze network requests in DevTools</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                    <span className="text-sm text-gray-700">Test with mobile device simulators</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                    <span className="text-sm text-gray-700">Validate form input handling</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                    <span className="text-sm text-gray-700">Check authentication flow timing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Recent Activities */}
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
                <th className="text-left py-3 px-4 font-medium text-gray-600">Session</th>
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
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {activity.session_duration ? `${activity.session_duration}m` : '-'}
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