import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useBusiness } from '../contexts/BusinessContext';

export default function Layout({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showBusinessDropdown, setShowBusinessDropdown] = useState(false);
  const { businesses, selectedBusiness, selectBusiness, getSelectedBusiness, loading } = useBusiness();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/clients', label: 'Clients' },
    { path: '/contracts', label: 'Contracts' },
    { path: '/invoices', label: 'Invoices' },
  ];

  const currentBusiness = getSelectedBusiness();

  const handleBusinessSelect = (businessId) => {
    selectBusiness(businessId);
    setShowBusinessDropdown(false);
    // Refresh the current page to show filtered data
    navigate(location.pathname);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-cyan-600 to-cyan-700 border-r border-cyan-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-cyan-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <span className="text-cyan-600 font-bold text-lg">C</span>
          </div>
          <h1 className="text-xl font-bold text-white">CRM</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-white text-cyan-700'
                      : 'text-cyan-100 hover:bg-cyan-800 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Side - Business Switcher */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setShowBusinessDropdown(!showBusinessDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-50 border border-cyan-200 rounded-lg hover:bg-cyan-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">
                    {loading ? 'Loading...' : currentBusiness ? currentBusiness.name : 'Select Business'}
                  </span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showBusinessDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowBusinessDropdown(false)}
                    ></div>
                    <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-96 overflow-y-auto">
                      <div className="p-2">
                        <Link
                          to="/businesses"
                          className="block px-3 py-2 text-sm text-cyan-600 hover:bg-cyan-50 rounded mb-2 font-medium"
                          onClick={() => setShowBusinessDropdown(false)}
                        >
                          + Manage Businesses
                        </Link>
                        <div className="border-t border-gray-200 my-2"></div>
                        {businesses.length === 0 ? (
                          <div className="px-3 py-4 text-sm text-gray-500 text-center">
                            No businesses yet
                          </div>
                        ) : (
                          businesses.map((business) => (
                            <button
                              key={business.id}
                              onClick={() => handleBusinessSelect(business.id)}
                              className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 transition-colors ${
                                selectedBusiness === business.id
                                  ? 'bg-cyan-50 text-cyan-700 font-medium'
                                  : 'text-gray-700'
                              }`}
                            >
                              <div className="font-medium">{business.name}</div>
                              {business.email && (
                                <div className="text-xs text-gray-500">{business.email}</div>
                              )}
                            </button>
                          ))
                        )}
                        <div className="border-t border-gray-200 my-2"></div>
                        <button
                          onClick={() => handleBusinessSelect(null)}
                          className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 transition-colors ${
                            selectedBusiness === null
                              ? 'bg-cyan-50 text-cyan-700 font-medium'
                              : 'text-gray-700'
                          }`}
                        >
                          All Businesses
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Center - Search */}
            <div className="flex-1 max-w-md mx-4">
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              {/* Settings */}
              <Link
                to="/settings"
                className="p-2 text-gray-600 hover:text-gray-900"
                title="Settings"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>

              {/* User Profile */}
              <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                  <span className="text-cyan-700 font-semibold">
                    {user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {user.email.split('@')[0]}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">{user.role}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                  title="Logout"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

