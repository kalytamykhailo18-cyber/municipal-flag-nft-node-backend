/**
 * Admin Login - Authentication screen for admin panel
 */
import { useState } from 'react';

const AdminLogin = ({ onAuth, loading, error }) => {
  const [adminKey, setAdminKey] = useState('');

  const handleSubmit = () => onAuth(adminKey);

  return (
    <div className="page-container">
      <div className="max-w-md mx-auto py-20">
        <div className="card p-8" data-animate="zoom-in" data-duration="normal">
          <h1 className="text-2xl font-bold text-white mb-2 text-center">
            Admin Panel
          </h1>
          <p className="text-gray-400 text-center mb-6">
            Enter your admin API key to continue
          </p>
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Admin API Key"
            className="input mb-4"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? 'Authenticating...' : 'Access Admin'}
          </button>
          {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
