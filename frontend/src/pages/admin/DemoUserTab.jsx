/**
 * DemoUserTab - Admin interface for demo user management
 */
import { useState } from 'react';
import {
  createDemoUser,
  seedDemoUserOwnership,
  deleteDemoUser,
} from '../../store/slices/adminSlice';

const DemoUserTab = ({ demoUser, dispatch, loading, actionLoading }) => {
  const [flagCount, setFlagCount] = useState(5);
  const [categories, setCategories] = useState(['standard', 'plus', 'premium']);

  const handleCreateDemoUser = () => {
    dispatch(createDemoUser());
  };

  const handleSeedOwnership = () => {
    if (!demoUser?.user?.id) {
      alert('Please create a demo user first');
      return;
    }
    dispatch(seedDemoUserOwnership({
      user_id: demoUser.user.id,
      flag_count: flagCount,
      include_categories: categories,
    }));
  };

  const handleDeleteDemoUser = () => {
    if (window.confirm('Are you sure you want to delete the demo user and all their data?')) {
      dispatch(deleteDemoUser());
    }
  };

  const toggleCategory = (cat) => {
    if (categories.includes(cat)) {
      setCategories(categories.filter(c => c !== cat));
    } else {
      setCategories([...categories, cat]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Demo User Info */}
      <div className="card p-6" data-animate="fade-up" data-duration="normal">
        <h3 className="text-xl font-bold text-white mb-4">Demo User Management</h3>
        <p className="text-gray-400 mb-6">
          Create a demo user for testing and presentation purposes. The demo user can own flags,
          participate in auctions, and demonstrate all platform features.
        </p>

        {demoUser?.user ? (
          <div className="space-y-6">
            {/* User Details */}
            <UserDetails user={demoUser.user} onDelete={handleDeleteDemoUser} actionLoading={actionLoading} />

            {/* Seed Ownership */}
            <SeedOwnershipForm
              flagCount={flagCount}
              setFlagCount={setFlagCount}
              categories={categories}
              toggleCategory={toggleCategory}
              onSeed={handleSeedOwnership}
              actionLoading={actionLoading}
            />
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No demo user exists yet.</p>
            <button
              onClick={handleCreateDemoUser}
              disabled={loading || actionLoading}
              className="btn btn-primary"
            >
              {loading || actionLoading ? 'Creating...' : 'Create Demo User'}
            </button>
          </div>
        )}
      </div>

      {/* Demo User Credentials Info */}
      <DemoCredentials />
    </div>
  );
};

const UserDetails = ({ user, onDelete, actionLoading }) => (
  <div className="bg-gradient-to-br from-dark-darker to-dark rounded-lg border border-gray-700/50 overflow-hidden" data-animate="fade-right" data-duration="fast">
    {/* Header */}
    <div className="bg-gradient-to-r from-primary/20 to-blue-600/20 px-6 py-4 border-b border-gray-700/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white font-bold text-xl">
            {user.username ? user.username.charAt(0).toUpperCase() : 'D'}
          </div>
          <div>
            <h4 className="text-white font-bold text-lg">{user.username || 'Demo User'}</h4>
            <span className="text-gray-400 text-sm">ID: #{user.id}</span>
          </div>
        </div>
        <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
          Active
        </span>
      </div>
    </div>

    {/* Wallet Address */}
    <div className="px-6 py-3 bg-dark/50 border-b border-gray-700/30">
      <span className="text-gray-500 text-xs uppercase tracking-wide">Wallet Address</span>
      <div className="flex items-center gap-2 mt-1">
        <code className="text-primary font-mono text-sm">{user.wallet_address}</code>
        <button
          onClick={() => navigator.clipboard.writeText(user.wallet_address)}
          className="text-gray-500 hover:text-primary transition-colors"
          title="Copy address"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-700/30">
      <div className="bg-dark-darker p-4 text-center">
        <span className="block text-2xl font-bold text-primary">{user.reputation_score}</span>
        <span className="text-gray-500 text-xs uppercase tracking-wide">Reputation</span>
      </div>
      <div className="bg-dark-darker p-4 text-center">
        <span className="block text-2xl font-bold text-green-400">{user.flags_owned}</span>
        <span className="text-gray-500 text-xs uppercase tracking-wide">Flags Owned</span>
      </div>
      <div className="bg-dark-darker p-4 text-center">
        <span className="block text-2xl font-bold text-blue-400">{user.followers_count}</span>
        <span className="text-gray-500 text-xs uppercase tracking-wide">Followers</span>
      </div>
      <div className="bg-dark-darker p-4 text-center">
        <span className="block text-2xl font-bold text-purple-400">{user.following_count}</span>
        <span className="text-gray-500 text-xs uppercase tracking-wide">Following</span>
      </div>
    </div>

    {/* Footer with Actions */}
    <div className="px-6 py-4 bg-dark/30 flex flex-wrap items-center justify-between gap-4">
      <span className="text-gray-500 text-sm">
        Created: {new Date(user.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })}
      </span>
      <div className="flex gap-3">
        <button
          onClick={() => window.location.href = `/profile/${user.wallet_address}`}
          className="btn btn-secondary flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View Profile
        </button>
        <button
          onClick={onDelete}
          disabled={actionLoading}
          className="btn bg-red-600/80 hover:bg-red-600 text-white flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          {actionLoading ? 'Deleting...' : 'Delete User'}
        </button>
      </div>
    </div>
  </div>
);

const SeedOwnershipForm = ({ flagCount, setFlagCount, categories, toggleCategory, onSeed, actionLoading }) => (
  <div className="bg-dark-darker rounded-[3px] p-4" data-animate="fade-right" data-duration="fast">
    <h4 className="text-white font-semibold mb-4">Seed Flag Ownerships</h4>
    <p className="text-gray-400 text-sm mb-4">
      Assign flag ownerships to the demo user to demonstrate the profile and collection features.
    </p>

    <div className="flex flex-wrap gap-4 mb-4">
      <div>
        <label className="text-gray-400 text-sm block mb-1">Number of Flags</label>
        <input
          type="number"
          min="1"
          max="50"
          value={flagCount}
          onChange={(e) => setFlagCount(parseInt(e.target.value) || 5)}
          className="input w-32"
        />
      </div>
      <div>
        <label className="text-gray-400 text-sm block mb-1">Categories</label>
        <div className="flex gap-2">
          {['standard', 'plus', 'premium'].map((cat) => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`px-3 py-1 rounded text-sm capitalize ${
                categories.includes(cat)
                  ? cat === 'premium' ? 'bg-yellow-500/30 text-yellow-400 border border-yellow-500/50'
                  : cat === 'plus' ? 'bg-blue-500/30 text-blue-400 border border-blue-500/50'
                  : 'bg-gray-500/30 text-gray-400 border border-gray-500/50'
                  : 'bg-dark text-gray-600 border border-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>

    <button
      onClick={onSeed}
      disabled={actionLoading || categories.length === 0}
      className="btn btn-primary"
    >
      {actionLoading ? 'Seeding...' : `Seed ${flagCount} Flag Ownerships`}
    </button>
  </div>
);

const DemoCredentials = () => (
  <div className="card p-6" data-animate="fade-up" data-duration="normal">
    <h3 className="text-lg font-bold text-white mb-4">Demo User Credentials</h3>
    <p className="text-gray-400 mb-4">
      Use these credentials to test the platform as the demo user:
    </p>
    <div className="bg-dark-darker rounded-[3px] p-4 space-y-2">
      <div>
        <span className="text-gray-500 text-sm">Default Wallet Address:</span>
        <code className="block text-primary font-mono text-sm mt-1">
          0xdemo000000000000000000000000000000000001
        </code>
      </div>
      <p className="text-gray-500 text-sm mt-4">
        Note: To connect as the demo user, you would need to import this address into MetaMask
        (requires corresponding private key). For presentation, you can view the profile page directly.
      </p>
    </div>
  </div>
);

export default DemoUserTab;
