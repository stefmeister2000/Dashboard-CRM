import { useState, useEffect } from 'react';
import { authAPI } from '../api';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('password');
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // API Key state
  const [apiKey, setApiKey] = useState('');
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [apiKeyError, setApiKeyError] = useState('');
  const [apiKeySuccess, setApiKeySuccess] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Load API key on mount
  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      const response = await authAPI.getApiKey();
      setApiKey(response.data.api_key || '');
    } catch (err) {
      console.error('Failed to load API key:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await authAPI.changePassword(currentPassword, newPassword);
      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateApiKey = async () => {
    setApiKeyError('');
    setApiKeySuccess('');
    setApiKeyLoading(true);

    try {
      const response = await authAPI.generateApiKey();
      setApiKey(response.data.api_key);
      setShowApiKey(true);
      setApiKeySuccess('API key generated successfully! Make sure to copy it now.');
    } catch (err) {
      setApiKeyError(err.response?.data?.error || 'Failed to generate API key');
    } finally {
      setApiKeyLoading(false);
    }
  };

  const handleRevokeApiKey = async () => {
    if (!window.confirm('Are you sure you want to revoke your API key? This will disable all integrations using it.')) {
      return;
    }

    setApiKeyError('');
    setApiKeySuccess('');
    setApiKeyLoading(true);

    try {
      await authAPI.revokeApiKey();
      setApiKey('');
      setShowApiKey(false);
      setApiKeySuccess('API key revoked successfully');
    } catch (err) {
      setApiKeyError(err.response?.data?.error || 'Failed to revoke API key');
    } finally {
      setApiKeyLoading(false);
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setApiKeySuccess('API key copied to clipboard!');
  };

  const getWebhookUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/clients`;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
        <p className="text-sm text-gray-600">Manage your account settings and integrations</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('password')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'password'
                ? 'border-cyan-500 text-cyan-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Password
          </button>
          <button
            onClick={() => setActiveTab('integration')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'integration'
                ? 'border-cyan-500 text-cyan-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Website Integration
          </button>
        </nav>
      </div>

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 font-medium"
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Integration Tab */}
      {activeTab === 'integration' && (
        <div className="space-y-6">
          {/* API Key Management */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">API Key</h2>
            <p className="text-sm text-gray-600 mb-4">
              Use your API key to securely connect your website forms to this CRM. The API key authenticates requests from your website.
            </p>

            {apiKeyError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {apiKeyError}
              </div>
            )}

            {apiKeySuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                {apiKeySuccess}
              </div>
            )}

            {apiKey ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your API Key
                  </label>
                  <div className="flex gap-2">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      readOnly
                      value={apiKey}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                    />
                    <button
                      onClick={copyApiKey}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                    >
                      {showApiKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleRevokeApiKey}
                  disabled={apiKeyLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                >
                  {apiKeyLoading ? 'Revoking...' : 'Revoke API Key'}
                </button>
              </div>
            ) : (
              <button
                onClick={handleGenerateApiKey}
                disabled={apiKeyLoading}
                className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 font-medium"
              >
                {apiKeyLoading ? 'Generating...' : 'Generate API Key'}
              </button>
            )}
          </div>

          {/* Integration Instructions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Integration Guide</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Webhook URL</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <code className="text-sm text-gray-800">{getWebhookUrl()}</code>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">JavaScript Example</h3>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`// Add this to your website form submission handler
async function submitLead(formData) {
  const response = await fetch('${getWebhookUrl()}', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ${apiKey ? `'X-API-Key': '${apiKey}',` : '// Optional: Add X-API-Key header for authentication'}
    },
    body: JSON.stringify({
      full_name: formData.name,
      email: formData.email,
      phone: formData.phone,
      source: 'website',
      business_id: null, // Optional: Set to assign to specific business
      utm_source: new URLSearchParams(window.location.search).get('utm_source'),
      utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
      utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
      referrer: document.referrer,
      signup_page: window.location.pathname
    })
  });
  
  if (response.ok) {
    const data = await response.json();
    console.log('Lead created:', data);
  }
}`}
                </pre>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">cURL Example</h3>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`curl -X POST '${getWebhookUrl()}' \\
  -H 'Content-Type: application/json' \\
  ${apiKey ? `-H 'X-API-Key: ${apiKey}' \\` : ''}
  -d '{
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "source": "website",
    "business_id": null
  }'`}
                </pre>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Required Fields</h3>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li><code className="bg-gray-100 px-1 rounded">full_name</code> - Lead's full name (required)</li>
                  <li><code className="bg-gray-100 px-1 rounded">email</code> - Email address (optional)</li>
                  <li><code className="bg-gray-100 px-1 rounded">phone</code> - Phone number (optional)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Optional Fields</h3>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li><code className="bg-gray-100 px-1 rounded">source</code> - Lead source (default: "website")</li>
                  <li><code className="bg-gray-100 px-1 rounded">business_id</code> - Assign to specific business</li>
                  <li><code className="bg-gray-100 px-1 rounded">status</code> - Status: "new", "contacted", "active", "inactive"</li>
                  <li><code className="bg-gray-100 px-1 rounded">tags</code> - Array of tags</li>
                  <li><code className="bg-gray-100 px-1 rounded">utm_source</code>, <code className="bg-gray-100 px-1 rounded">utm_medium</code>, <code className="bg-gray-100 px-1 rounded">utm_campaign</code> - UTM parameters</li>
                  <li><code className="bg-gray-100 px-1 rounded">referrer</code> - Referrer URL</li>
                  <li><code className="bg-gray-100 px-1 rounded">signup_page</code> - Page where signup occurred</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


