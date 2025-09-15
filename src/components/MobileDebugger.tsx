import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  Smartphone, 
  Monitor, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  RefreshCw,
  Wifi,
  Camera,
  Mic,
  Globe,
  Shield,
  Settings,
  Bug,
  Eye,
  EyeOff
} from 'lucide-react';

interface DeviceInfo {
  userAgent: string;
  platform: string;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  touchSupport: boolean;
  orientation: string;
  connectionType?: string;
  isOnline: boolean;
}

interface PermissionStatus {
  camera: 'granted' | 'denied' | 'prompt' | 'unknown';
  microphone: 'granted' | 'denied' | 'prompt' | 'unknown';
  notifications: 'granted' | 'denied' | 'prompt' | 'unknown';
  geolocation: 'granted' | 'denied' | 'prompt' | 'unknown';
}

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'running';
  message: string;
  details?: string;
}

export const MobileDebugger: React.FC = () => {
  const { user } = useAuth();
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [permissions, setPermissions] = useState<PermissionStatus>({
    camera: 'unknown',
    microphone: 'unknown',
    notifications: 'unknown',
    geolocation: 'unknown'
  });
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    collectDeviceInfo();
    checkPermissions();
  }, []);

  const collectDeviceInfo = () => {
    const info: DeviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenWidth: screen.width,
      screenHeight: screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      orientation: screen.orientation?.type || 'unknown',
      isOnline: navigator.onLine
    };

    // Check connection type if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      info.connectionType = connection?.effectiveType || connection?.type || 'unknown';
    }

    setDeviceInfo(info);
  };

  const checkPermissions = async () => {
    const newPermissions: PermissionStatus = {
      camera: 'unknown',
      microphone: 'unknown',
      notifications: 'unknown',
      geolocation: 'unknown'
    };

    if ('permissions' in navigator) {
      try {
        const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        newPermissions.camera = cameraPermission.state;

        const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        newPermissions.microphone = micPermission.state;

        const notificationPermission = await navigator.permissions.query({ name: 'notifications' as PermissionName });
        newPermissions.notifications = notificationPermission.state;

        const geoPermission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        newPermissions.geolocation = geoPermission.state;
      } catch (error) {
        console.log('Permission API not fully supported');
      }
    }

    setPermissions(newPermissions);
  };

  const runDiagnosticTests = async () => {
    setIsRunningTests(true);
    const results: TestResult[] = [];

    // Test 1: Device Detection
    results.push({
      name: 'Device Detection',
      status: 'running',
      message: 'Checking device type...'
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    results[0] = {
      name: 'Device Detection',
      status: isMobile ? 'pass' : 'warning',
      message: isMobile ? 'Mobile device detected' : 'Desktop device detected',
      details: `User Agent: ${navigator.userAgent.substring(0, 50)}...`
    };

    setTestResults([...results]);

    // Test 2: Viewport Size
    results.push({
      name: 'Viewport Size',
      status: 'running',
      message: 'Checking viewport dimensions...'
    });

    setTestResults([...results]);
    await new Promise(resolve => setTimeout(resolve, 500));

    const viewportOk = window.innerWidth >= 320 && window.innerHeight >= 568;
    results[1] = {
      name: 'Viewport Size',
      status: viewportOk ? 'pass' : 'warning',
      message: viewportOk ? 'Viewport size is adequate' : 'Viewport size may cause issues',
      details: `${window.innerWidth}x${window.innerHeight} (min recommended: 320x568)`
    };

    setTestResults([...results]);

    // Test 3: Touch Support
    results.push({
      name: 'Touch Support',
      status: 'running',
      message: 'Checking touch capabilities...'
    });

    setTestResults([...results]);
    await new Promise(resolve => setTimeout(resolve, 500));

    const touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    results[2] = {
      name: 'Touch Support',
      status: touchSupported ? 'pass' : 'warning',
      message: touchSupported ? 'Touch events supported' : 'Touch events not detected',
      details: `Max touch points: ${navigator.maxTouchPoints || 0}`
    };

    setTestResults([...results]);

    // Test 4: HTTPS Check
    results.push({
      name: 'HTTPS Security',
      status: 'running',
      message: 'Checking connection security...'
    });

    setTestResults([...results]);
    await new Promise(resolve => setTimeout(resolve, 500));

    const isHTTPS = location.protocol === 'https:' || location.hostname === 'localhost';
    results[3] = {
      name: 'HTTPS Security',
      status: isHTTPS ? 'pass' : 'fail',
      message: isHTTPS ? 'Secure connection established' : 'Insecure connection detected',
      details: `Protocol: ${location.protocol}, Host: ${location.hostname}`
    };

    setTestResults([...results]);

    // Test 5: Camera Access
    results.push({
      name: 'Camera Access',
      status: 'running',
      message: 'Testing camera permissions...'
    });

    setTestResults([...results]);
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      results[4] = {
        name: 'Camera Access',
        status: 'pass',
        message: 'Camera access granted',
        details: 'Successfully accessed camera device'
      };
    } catch (error) {
      results[4] = {
        name: 'Camera Access',
        status: 'fail',
        message: 'Camera access denied or unavailable',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    setTestResults([...results]);

    // Test 6: Microphone Access
    results.push({
      name: 'Microphone Access',
      status: 'running',
      message: 'Testing microphone permissions...'
    });

    setTestResults([...results]);
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      results[5] = {
        name: 'Microphone Access',
        status: 'pass',
        message: 'Microphone access granted',
        details: 'Successfully accessed microphone device'
      };
    } catch (error) {
      results[5] = {
        name: 'Microphone Access',
        status: 'fail',
        message: 'Microphone access denied or unavailable',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    setTestResults([...results]);

    // Test 7: Network Connection
    results.push({
      name: 'Network Connection',
      status: 'running',
      message: 'Testing network connectivity...'
    });

    setTestResults([...results]);
    await new Promise(resolve => setTimeout(resolve, 500));

    const connectionOk = navigator.onLine;
    const connectionType = (navigator as any).connection?.effectiveType || 'unknown';
    results[6] = {
      name: 'Network Connection',
      status: connectionOk ? 'pass' : 'fail',
      message: connectionOk ? 'Network connection active' : 'Network connection issues',
      details: `Connection type: ${connectionType}, Online: ${navigator.onLine}`
    };

    setTestResults([...results]);

    // Test 8: Local Storage
    results.push({
      name: 'Local Storage',
      status: 'running',
      message: 'Testing local storage...'
    });

    setTestResults([...results]);
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      localStorage.setItem('test', 'value');
      localStorage.removeItem('test');
      results[7] = {
        name: 'Local Storage',
        status: 'pass',
        message: 'Local storage working correctly',
        details: 'Can read and write to localStorage'
      };
    } catch (error) {
      results[7] = {
        name: 'Local Storage',
        status: 'fail',
        message: 'Local storage unavailable',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    setTestResults([...results]);
    setIsRunningTests(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'fail':
        return <X className="text-red-600" size={20} />;
      case 'warning':
        return <AlertTriangle className="text-yellow-600" size={20} />;
      case 'running':
        return <RefreshCw className="text-blue-600 animate-spin" size={20} />;
      default:
        return <AlertTriangle className="text-gray-400" size={20} />;
    }
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'granted':
        return <CheckCircle className="text-green-600" size={16} />;
      case 'denied':
        return <X className="text-red-600" size={16} />;
      case 'prompt':
        return <AlertTriangle className="text-yellow-600" size={16} />;
      default:
        return <AlertTriangle className="text-gray-400" size={16} />;
    }
  };

  if (!user?.is_admin) {
    return (
      <div className="text-center py-12">
        <Bug className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
        <p className="text-gray-600">Only administrators can access the mobile debugger.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Mobile Debugger</h2>
          <p className="text-gray-600">Diagnose and troubleshoot mobile device issues</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            {showDetails ? <EyeOff size={16} /> : <Eye size={16} />}
            <span>{showDetails ? 'Hide Details' : 'Show Details'}</span>
          </button>

          <button
            onClick={runDiagnosticTests}
            disabled={isRunningTests}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <RefreshCw size={16} className={isRunningTests ? 'animate-spin' : ''} />
            <span>{isRunningTests ? 'Running Tests...' : 'Run Diagnostics'}</span>
          </button>
        </div>
      </div>

      {/* Device Information */}
      {deviceInfo && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Device Information</h3>
            <Smartphone className="text-gray-400" size={20} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Monitor size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Screen</span>
              </div>
              <p className="text-sm text-gray-900">{deviceInfo.screenWidth} × {deviceInfo.screenHeight}</p>
              <p className="text-xs text-gray-500">Pixel ratio: {deviceInfo.devicePixelRatio}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Eye size={16} className="text-green-600" />
                <span className="text-sm font-medium text-gray-700">Viewport</span>
              </div>
              <p className="text-sm text-gray-900">{deviceInfo.viewportWidth} × {deviceInfo.viewportHeight}</p>
              <p className="text-xs text-gray-500">Orientation: {deviceInfo.orientation}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Wifi size={16} className="text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Connection</span>
              </div>
              <p className="text-sm text-gray-900">{deviceInfo.connectionType || 'Unknown'}</p>
              <p className="text-xs text-gray-500">Online: {deviceInfo.isOnline ? 'Yes' : 'No'}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Settings size={16} className="text-orange-600" />
                <span className="text-sm font-medium text-gray-700">Platform</span>
              </div>
              <p className="text-sm text-gray-900">{deviceInfo.platform}</p>
              <p className="text-xs text-gray-500">Touch: {deviceInfo.touchSupport ? 'Yes' : 'No'}</p>
            </div>

            {showDetails && (
              <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Globe size={16} className="text-indigo-600" />
                  <span className="text-sm font-medium text-gray-700">User Agent</span>
                </div>
                <p className="text-xs text-gray-900 break-all">{deviceInfo.userAgent}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Permissions Status */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Permissions Status</h3>
          <Shield className="text-gray-400" size={20} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Camera size={20} className="text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Camera</span>
            </div>
            <div className="flex items-center space-x-2">
              {getPermissionIcon(permissions.camera)}
              <span className="text-sm text-gray-600 capitalize">{permissions.camera}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Mic size={20} className="text-green-600" />
              <span className="text-sm font-medium text-gray-700">Microphone</span>
            </div>
            <div className="flex items-center space-x-2">
              {getPermissionIcon(permissions.microphone)}
              <span className="text-sm text-gray-600 capitalize">{permissions.microphone}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertTriangle size={20} className="text-yellow-600" />
              <span className="text-sm font-medium text-gray-700">Notifications</span>
            </div>
            <div className="flex items-center space-x-2">
              {getPermissionIcon(permissions.notifications)}
              <span className="text-sm text-gray-600 capitalize">{permissions.notifications}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Globe size={20} className="text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Location</span>
            </div>
            <div className="flex items-center space-x-2">
              {getPermissionIcon(permissions.geolocation)}
              <span className="text-sm text-gray-600 capitalize">{permissions.geolocation}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Diagnostic Tests */}
      {testResults.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Diagnostic Test Results</h3>
            <Bug className="text-gray-400" size={20} />
          </div>

          <div className="space-y-4">
            {testResults.map((test, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(test.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">{test.name}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      test.status === 'pass' ? 'bg-green-100 text-green-800' :
                      test.status === 'fail' ? 'bg-red-100 text-red-800' :
                      test.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {test.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{test.message}</p>
                  {showDetails && test.details && (
                    <p className="text-xs text-gray-500 mt-2 bg-white p-2 rounded border">
                      {test.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!isRunningTests && testResults.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Test Summary</h4>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-green-700">
                  ✓ {testResults.filter(t => t.status === 'pass').length} Passed
                </span>
                <span className="text-red-700">
                  ✗ {testResults.filter(t => t.status === 'fail').length} Failed
                </span>
                <span className="text-yellow-700">
                  ⚠ {testResults.filter(t => t.status === 'warning').length} Warnings
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Troubleshooting Guide */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Mobile Login Troubleshooting Guide</h3>
          <AlertTriangle className="text-yellow-400" size={20} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Common Issues & Solutions</h4>
            <div className="space-y-3">
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <h5 className="text-sm font-medium text-red-800">Camera/Microphone Permission Denied</h5>
                <p className="text-xs text-red-700 mt-1">
                  Users must manually grant permissions in browser settings. Guide them to:
                  Settings → Site Settings → Camera/Microphone → Allow
                </p>
              </div>

              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <h5 className="text-sm font-medium text-yellow-800">Touch Target Too Small</h5>
                <p className="text-xs text-yellow-700 mt-1">
                  Ensure all clickable elements are at least 44px × 44px for proper touch interaction.
                </p>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="text-sm font-medium text-blue-800">Viewport Issues</h5>
                <p className="text-xs text-blue-700 mt-1">
                  Check responsive design breakpoints and ensure proper viewport meta tag is set.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Browser Compatibility</h4>
            <div className="space-y-3">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <h5 className="text-sm font-medium text-green-800">Chrome Mobile</h5>
                <p className="text-xs text-green-700 mt-1">
                  Best compatibility. Supports all modern web APIs including WebRTC.
                </p>
              </div>

              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <h5 className="text-sm font-medium text-yellow-800">Safari Mobile</h5>
                <p className="text-xs text-yellow-700 mt-1">
                  Good compatibility but may have restrictions on autoplay and permissions.
                </p>
              </div>

              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <h5 className="text-sm font-medium text-red-800">Samsung Internet</h5>
                <p className="text-xs text-red-700 mt-1">
                  May have additional security restrictions. Test thoroughly on Samsung devices.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Quick Fix Checklist</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
              <span>Verify HTTPS is enabled</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
              <span>Test on multiple mobile browsers</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
              <span>Check viewport meta tag</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
              <span>Validate touch target sizes</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
              <span>Test permission flows</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
              <span>Verify responsive design</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};