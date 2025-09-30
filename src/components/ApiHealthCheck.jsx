import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ApiHealthCheck = ({ onClose }) => {
  const [status, setStatus] = useState('checking');
  const [details, setDetails] = useState(null);

  const checkApiHealth = async () => {
    setStatus('checking');
    setDetails(null);

    const results = {
      envVars: {},
      apiTest: null,
      timestamp: new Date().toISOString()
    };

    // Check environment variables
    results.envVars = {
      VITE_RAPIDAPI_KEY: import.meta.env.VITE_RAPIDAPI_KEY ? 
        `${import.meta.env.VITE_RAPIDAPI_KEY.substring(0, 8)}...` : 'NOT SET',
      VITE_RAPIDAPI_HOST: import.meta.env.VITE_RAPIDAPI_HOST || 'NOT SET',
      hasKey: !!import.meta.env.VITE_RAPIDAPI_KEY,
      hasHost: !!import.meta.env.VITE_RAPIDAPI_HOST
    };

    // Test API connection using axios (same as main API service)
    if (results.envVars.hasKey && results.envVars.hasHost) {
      try {
        const response = await axios.get(`https://${import.meta.env.VITE_RAPIDAPI_HOST}/projects/azuki/history/pricefloor/1d?start=1640995200&end=1672444800`, {
          headers: {
            'X-RapidAPI-Key': import.meta.env.VITE_RAPIDAPI_KEY,
            'X-RapidAPI-Host': import.meta.env.VITE_RAPIDAPI_HOST,
            'Content-Type': 'application/json',
          },
          timeout: 30000 // 30 seconds - same as main API service
        });

        results.apiTest = {
          success: response.status >= 200 && response.status < 300,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        };

        if (results.apiTest.success) {
          const data = response.data;
          results.apiTest.dataLength = Array.isArray(data) ? data.length : 'Not array';
          results.apiTest.sample = Array.isArray(data) && data.length > 0 ? data[0] : null;
        } else {
          results.apiTest.errorData = response.data;
        }

      } catch (error) {
        results.apiTest = {
          success: false,
          error: error.message,
          code: error.code,
          type: error.constructor.name,
          status: error.response?.status,
          statusText: error.response?.statusText,
          errorData: error.response?.data
        };
      }
    } else {
      results.apiTest = {
        success: false,
        error: 'Missing required environment variables'
      };
    }

    setDetails(results);
    setStatus(results.apiTest?.success ? 'success' : 'error');
  };

  useEffect(() => {
    checkApiHealth();
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'checking': return 'text-blue-600';
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'checking': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">API Health Check</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Status */}
          <div className={`mb-6 p-4 rounded-lg border-2 ${
            status === 'success' ? 'border-green-200 bg-green-50' : 
            status === 'error' ? 'border-red-200 bg-red-50' : 
            'border-blue-200 bg-blue-50'
          }`}>
            <div className={`flex items-center gap-2 font-medium ${getStatusColor()}`}>
              <span className="text-2xl">{getStatusIcon()}</span>
              <span className="capitalize">{status === 'checking' ? 'Checking API...' : 
                status === 'success' ? 'API is working!' : 'API connection failed'}</span>
            </div>
          </div>

          {details && (
            <div className="space-y-4">
              {/* Environment Variables */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Environment Variables</h3>
                <div className="bg-gray-50 p-3 rounded border text-sm font-mono">
                  <div>VITE_RAPIDAPI_KEY: {details.envVars.VITE_RAPIDAPI_KEY}</div>
                  <div>VITE_RAPIDAPI_HOST: {details.envVars.VITE_RAPIDAPI_HOST}</div>
                  <div className="mt-2">
                    Status: {details.envVars.hasKey && details.envVars.hasHost ? 
                      '✅ All variables set' : '❌ Missing variables'}
                  </div>
                </div>
              </div>

              {/* API Test Results */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">API Test Results</h3>
                <div className="bg-gray-50 p-3 rounded border">
                  {details.apiTest.success ? (
                    <div className="text-sm space-y-1">
                      <div className="text-green-600">✅ API connection successful</div>
                      <div>Status: {details.apiTest.status} {details.apiTest.statusText}</div>
                      <div>Data points received: {details.apiTest.dataLength}</div>
                      {details.apiTest.sample && (
                        <div className="mt-2">
                          <div className="font-medium">Sample data:</div>
                          <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                            {JSON.stringify(details.apiTest.sample, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm space-y-1">
                      <div className="text-red-600">❌ API connection failed</div>
                      {details.apiTest.status && (
                        <div>HTTP Status: {details.apiTest.status} {details.apiTest.statusText}</div>
                      )}
                      <div>Error: {details.apiTest.error}</div>
                      {details.apiTest.errorData && (
                        <div className="mt-2">
                          <div className="font-medium">Response:</div>
                          <pre className="text-xs bg-white p-2 rounded border max-h-32 overflow-auto">
                            {details.apiTest.errorData}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t">
                <div className="flex gap-3">
                  <button
                    onClick={checkApiHealth}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    🔄 Test Again
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(details, null, 2));
                      alert('Results copied to clipboard!');
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    📋 Copy Results
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiHealthCheck;
