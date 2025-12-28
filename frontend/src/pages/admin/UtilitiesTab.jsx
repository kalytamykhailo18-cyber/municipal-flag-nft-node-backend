/**
 * UtilitiesTab - Admin interface for utility operations
 */
import { useState } from 'react';
import { seedDemoData, syncIpfsFromPinata, fetchIpfsStatus } from '../../store/slices/adminSlice';
import { registerFlagSimple, isFlagRegistered, connectWallet, getCurrentAddress, getContractOwner } from '../../services/web3';
import config from '../../config';

const UtilitiesTab = ({ ipfsStatus, dispatch, loading }) => {
  // Flag registration state
  const [flagId, setFlagId] = useState('');
  const [category, setCategory] = useState('0');
  const [price, setPrice] = useState(config.prices.standard);
  const [registering, setRegistering] = useState(false);
  const [registerResult, setRegisterResult] = useState(null);
  const [registerError, setRegisterError] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [flagStatus, setFlagStatus] = useState(null);

  // Check if flag is registered
  const handleCheckFlag = async () => {
    if (!flagId) return;
    setCheckingStatus(true);
    setFlagStatus(null);
    setRegisterError(null);
    try {
      const address = await getCurrentAddress();
      if (!address) {
        await connectWallet();
      }
      const isRegistered = await isFlagRegistered(parseInt(flagId));
      const owner = await getContractOwner();
      const currentAddress = await getCurrentAddress();
      setFlagStatus({
        isRegistered,
        contractOwner: owner,
        currentAddress,
        isOwner: owner?.toLowerCase() === currentAddress?.toLowerCase()
      });
    } catch (error) {
      setRegisterError(error.message || 'Failed to check flag status');
    } finally {
      setCheckingStatus(false);
    }
  };

  // Register flag on blockchain
  const handleRegisterFlag = async () => {
    if (!flagId) return;
    setRegistering(true);
    setRegisterResult(null);
    setRegisterError(null);
    try {
      const address = await getCurrentAddress();
      if (!address) {
        await connectWallet();
      }

      // Check if already registered
      const isRegistered = await isFlagRegistered(parseInt(flagId));
      if (isRegistered) {
        setRegisterError('Flag is already registered on the blockchain!');
        return;
      }

      const result = await registerFlagSimple(parseInt(flagId), parseInt(category), price);
      setRegisterResult(result);
      setFlagStatus(prev => prev ? { ...prev, isRegistered: true } : null);
    } catch (error) {
      console.error('Error registering flag:', error);
      setRegisterError(error.message || 'Failed to register flag');
    } finally {
      setRegistering(false);
    }
  };

  const handleSeedDemo = () => {
    if (window.confirm('This will seed demo data. Are you sure?')) {
      dispatch(seedDemoData());
    }
  };

  const handleSyncIpfs = () => {
    dispatch(syncIpfsFromPinata()).then(() => {
      dispatch(fetchIpfsStatus());
    });
  };

  return (
    <div className="space-y-8">
      {/* Register Flag on Blockchain */}
      <div className="card p-6" data-animate="fade-up" data-duration="normal">
        <h3 className="text-xl font-bold text-white mb-4">Register Flag on Blockchain</h3>
        <p className="text-gray-400 mb-4">
          Register a flag from the database onto the blockchain. Only the contract owner can perform this action.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Flag ID</label>
            <input
              type="number"
              value={flagId}
              onChange={(e) => setFlagId(e.target.value)}
              placeholder="e.g., 67"
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                const prices = { '0': config.prices.standard, '1': config.prices.plus, '2': config.prices.premium };
                setPrice(prices[e.target.value]);
              }}
              className="input w-full"
            >
              <option value="0">Standard ({config.prices.standard} MATIC)</option>
              <option value="1">Plus ({config.prices.plus} MATIC)</option>
              <option value="2">Premium ({config.prices.premium} MATIC)</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Price (MATIC)</label>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input w-full"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleCheckFlag}
              disabled={!flagId || checkingStatus}
              className="btn btn-secondary"
            >
              {checkingStatus ? 'Checking...' : 'Check Status'}
            </button>
          </div>
        </div>

        {/* Flag Status */}
        {flagStatus && (
          <div className="bg-dark-darker p-4 rounded mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Flag #{flagId} Registered:</span>
                <span className={`ml-2 font-bold ${flagStatus.isRegistered ? 'text-green-400' : 'text-red-400'}`}>
                  {flagStatus.isRegistered ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">You are owner:</span>
                <span className={`ml-2 font-bold ${flagStatus.isOwner ? 'text-green-400' : 'text-red-400'}`}>
                  {flagStatus.isOwner ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400">Contract Owner:</span>
                <span className="ml-2 text-gray-300 font-mono text-xs">{flagStatus.contractOwner}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400">Your Address:</span>
                <span className="ml-2 text-gray-300 font-mono text-xs">{flagStatus.currentAddress}</span>
              </div>
            </div>
          </div>
        )}

        {/* Register Button */}
        <button
          onClick={handleRegisterFlag}
          disabled={!flagId || registering}
          className="btn btn-primary"
        >
          {registering ? 'Registering...' : `Register Flag #${flagId || '?'} on Blockchain`}
        </button>

        {/* Success Result */}
        {registerResult && (
          <div className="mt-4 p-4 bg-green-600/20 border border-green-600/50 rounded text-green-400">
            <p className="font-bold">Flag registered successfully!</p>
            <p className="text-sm mt-1">
              Transaction: <a
                href={`https://amoy.polygonscan.com/tx/${registerResult.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                {registerResult.transactionHash?.slice(0, 20)}...
              </a>
            </p>
          </div>
        )}

        {/* Error */}
        {registerError && (
          <div className="mt-4 p-4 bg-red-600/20 border border-red-600/50 rounded text-red-400">
            {registerError}
          </div>
        )}
      </div>

      {/* Demo Data */}
      <div className="card p-6" data-animate="fade-up" data-duration="normal">
        <h3 className="text-xl font-bold text-white mb-4">Seed Demo Data</h3>
        <p className="text-gray-400 mb-4">
          Seed the database with demo countries, regions, municipalities, and flags for testing.
        </p>
        <button onClick={handleSeedDemo} disabled={loading} className="btn btn-primary">
          {loading ? 'Seeding...' : 'Seed Demo Data'}
        </button>
      </div>

      {/* IPFS Sync */}
      <div className="card p-6" data-animate="fade-up" data-duration="normal">
        <h3 className="text-xl font-bold text-white mb-4">IPFS Image Sync</h3>
        <p className="text-gray-400 mb-4">
          Sync flag images from Pinata IPFS. This updates the database with the latest image hashes.
        </p>
        {ipfsStatus && <IpfsStatusGrid status={ipfsStatus} />}
        <button onClick={handleSyncIpfs} disabled={loading} className="btn btn-secondary">
          {loading ? 'Syncing...' : 'Sync Images from Pinata'}
        </button>
      </div>
    </div>
  );
};

const IpfsStatusGrid = ({ status }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4" data-animate="zoom-in" data-duration="fast">
    <div className="bg-dark-darker p-3 rounded text-center">
      <span className="text-primary font-bold block text-xl">{status.total_flags}</span>
      <span className="text-gray-500 text-sm">Total Flags</span>
    </div>
    <div className="bg-dark-darker p-3 rounded text-center">
      <span className="text-green-400 font-bold block text-xl">{status.flags_with_image_hash}</span>
      <span className="text-gray-500 text-sm">With Images</span>
    </div>
    <div className="bg-dark-darker p-3 rounded text-center">
      <span className="text-blue-400 font-bold block text-xl">{status.flags_with_metadata_hash}</span>
      <span className="text-gray-500 text-sm">With Metadata</span>
    </div>
    <div className="bg-dark-darker p-3 rounded text-center">
      <span className="text-yellow-400 font-bold block text-xl">{status.flags_pending_upload}</span>
      <span className="text-gray-500 text-sm">Pending</span>
    </div>
  </div>
);

export default UtilitiesTab;
