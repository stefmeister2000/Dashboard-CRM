import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, exportAPI } from '../api';
import { useBusiness } from '../contexts/BusinessContext';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { selectedBusiness, loading: businessLoading } = useBusiness();

  useEffect(() => {
    if (!businessLoading) {
      loadMetrics();
    }
  }, [selectedBusiness, businessLoading]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const params = selectedBusiness ? { business_id: selectedBusiness.toString() } : {};
      const response = await dashboardAPI.getMetrics(params);
      setMetrics(response.data);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await exportAPI.exportCSV();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'clients.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (loading || businessLoading) {
    return <div className="text-center py-12 text-gray-600">Loading dashboard...</div>;
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Failed to load dashboard</div>
        <button
          onClick={loadMetrics}
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const calculatePercentage = (current, total) => {
    if (total === 0) return 0;
    return Math.round((current / total) * 100);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
        <p className="text-sm text-gray-600">Overview of your client signups</p>
      </div>

      {/* Action Bar */}
      <div className="flex justify-end items-center mb-8">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 font-medium text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="New Signups Today"
          value={metrics.signupsToday}
        />
        <MetricCard
          title="This Week"
          value={metrics.signupsThisWeek}
        />
        <MetricCard
          title="This Month"
          value={metrics.signupsThisMonth}
        />
        <MetricCard
          title="Total Clients"
          value={metrics.totalClients.toLocaleString()}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Clients by Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Clients by Status</h2>
          <div className="space-y-4">
            {Object.entries(metrics.clientsByStatus).map(([status, count]) => {
              const percentage = calculatePercentage(count, metrics.totalClients);
              const colors = {
                new: 'bg-yellow-400',
                contacted: 'bg-blue-400',
                active: 'bg-green-400',
                inactive: 'bg-gray-400'
              };
              return (
                <div key={status}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 capitalize">{status}</span>
                    <span className="text-sm font-semibold text-gray-900">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`${colors[status] || 'bg-cyan-400'} h-2.5 rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Clients by Source */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Clients by Source</h2>
          <div className="space-y-4">
            {Object.entries(metrics.clientsBySource).map(([source, count]) => {
              const percentage = calculatePercentage(count, metrics.totalClients);
              const colors = {
                website: 'bg-cyan-400',
                manual: 'bg-blue-400',
                import: 'bg-green-400'
              };
              return (
                <div key={source}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 capitalize">{source}</span>
                    <span className="text-sm font-semibold text-gray-900">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`${colors[source] || 'bg-cyan-400'} h-2.5 rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Signups Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Last 20 Signups</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Signup Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.lastSignups.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`/clients/${client.id}`}
                      className="text-cyan-600 hover:text-cyan-800 font-medium"
                    >
                      {client.full_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {client.email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      client.status === 'active' ? 'bg-green-100 text-green-800' :
                      client.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                      client.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                    {client.source}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(client.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
