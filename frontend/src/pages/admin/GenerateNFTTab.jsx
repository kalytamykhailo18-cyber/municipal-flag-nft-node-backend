/**
 * GenerateNFTTab - Admin interface for generating NFTs from coordinates
 */
import { useState } from 'react';
import { createNFTFromCoordinates, checkStreetView } from '../../store/slices/adminSlice';
import { registerFlagSimple, isFlagRegistered, connectWallet, getCurrentAddress } from '../../services/web3';
import config from '../../config';

const GenerateNFTTab = ({ municipalities, dispatch, nftGenerationResult, nftGenerating, checkingStreetView, streetViewAvailable, previewImages = [] }) => {
  const [formData, setFormData] = useState({
    latitude: '',
    longitude: '',
    municipality_id: '',
    location_type: '',
    category: 'standard',
    nfts_required: '1',
    custom_name: '',
    custom_prompt: '',
    heading: '',
  });

  const handleCheckStreetView = () => {
    if (!formData.latitude || !formData.longitude) {
      alert('Please enter latitude and longitude');
      return;
    }
    dispatch(checkStreetView({
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
    }));
  };

  const handleGenerateNFT = () => {
    if (!formData.latitude || !formData.longitude || !formData.municipality_id || !formData.location_type) {
      alert('Please fill in all required fields (latitude, longitude, municipality, location type)');
      return;
    }

    const payload = {
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      municipality_id: parseInt(formData.municipality_id),
      location_type: formData.location_type,
      category: formData.category,
      nfts_required: parseInt(formData.nfts_required),
    };

    if (formData.custom_name?.trim()) {
      payload.custom_name = formData.custom_name.trim();
    }
    if (formData.custom_prompt?.trim()) {
      payload.custom_prompt = formData.custom_prompt.trim();
    }
    if (formData.heading) {
      payload.heading = parseInt(formData.heading);
    }

    dispatch(createNFTFromCoordinates(payload));
  };

  const resetForm = () => {
    setFormData({
      latitude: '',
      longitude: '',
      municipality_id: '',
      location_type: '',
      category: 'standard',
      nfts_required: '1',
      custom_name: '',
      custom_prompt: '',
      heading: '',
    });
  };

  return (
    <div className="space-y-8">
      {/* NFT Generation Form */}
      <div className="card p-6" data-animate="fade-up" data-duration="normal">
        <h3 className="text-xl font-bold text-white mb-4">Generate NFT from Coordinates</h3>
        <p className="text-gray-400 mb-6">
          Enter coordinates to fetch a Google Street View image, transform it with AI into a flag-style design,
          upload to IPFS, and create a new flag NFT in the database.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Coordinates */}
          <div>
            <label className="text-gray-400 text-sm block mb-1">Latitude *</label>
            <input
              type="number"
              step="any"
              placeholder="e.g., 40.4168"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              className="input w-full"
              required
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">Longitude *</label>
            <input
              type="number"
              step="any"
              placeholder="e.g., -3.7038"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              className="input w-full"
              required
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">Camera Heading (0-360)</label>
            <input
              type="number"
              min="0"
              max="360"
              placeholder="Optional, e.g., 90"
              value={formData.heading}
              onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
              className="input w-full"
            />
          </div>

          {/* Municipality & Location */}
          <div>
            <label className="text-gray-400 text-sm block mb-1">Municipality *</label>
            <select
              value={formData.municipality_id}
              onChange={(e) => setFormData({ ...formData, municipality_id: e.target.value })}
              className="input w-full"
              required
            >
              <option value="">Select Municipality</option>
              {municipalities.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">Location Type *</label>
            <input
              type="text"
              placeholder="e.g., Town Hall, Fire Station"
              value={formData.location_type}
              onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
              className="input w-full"
              required
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input w-full"
            >
              <option value="standard">Standard</option>
              <option value="plus">Plus</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          {/* NFTs & Custom Options */}
          <div>
            <label className="text-gray-400 text-sm block mb-1">NFTs Required</label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.nfts_required}
              onChange={(e) => setFormData({ ...formData, nfts_required: e.target.value })}
              className="input w-full"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">Custom Name (optional)</label>
            <input
              type="text"
              placeholder="Auto-generated if empty"
              value={formData.custom_name}
              onChange={(e) => setFormData({ ...formData, custom_name: e.target.value })}
              className="input w-full"
            />
          </div>
          <div className="lg:col-span-1">
            <label className="text-gray-400 text-sm block mb-1">Custom AI Prompt (optional)</label>
            <input
              type="text"
              placeholder="Custom style transformation"
              value={formData.custom_prompt}
              onChange={(e) => setFormData({ ...formData, custom_prompt: e.target.value })}
              className="input w-full"
            />
          </div>
        </div>

        {/* Street View Check Status */}
        {streetViewAvailable !== null && (
          <div className={`mb-4 p-3 rounded-[3px] ${streetViewAvailable ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
            {streetViewAvailable
              ? `Found ${previewImages.length} image(s) at these coordinates.`
              : 'No images found. Try different coordinates or search query.'}
          </div>
        )}

        {/* Preview Images Grid */}
        {previewImages.length > 0 && (
          <div className="mb-6">
            <h4 className="text-white font-medium mb-3">Preview Images from Search:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {previewImages.map((img, index) => (
                <div key={index} className="bg-dark-darker rounded-[3px] overflow-hidden">
                  <a href={img.url || img.thumbnail} target="_blank" rel="noopener noreferrer">
                    <img
                      src={img.thumbnail || img.url}
                      alt={img.title || `Preview ${index + 1}`}
                      className="w-full h-24 object-cover hover:opacity-80 transition-opacity"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23333" width="100" height="100"/><text fill="%23666" x="50%" y="50%" text-anchor="middle" dy=".3em">No Image</text></svg>';
                      }}
                    />
                  </a>
                  <div className="p-2">
                    <p className="text-gray-400 text-xs truncate" title={img.title}>
                      {img.title || 'Untitled'}
                    </p>
                    <p className="text-gray-500 text-xs truncate" title={img.source}>
                      {img.source || 'Unknown source'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-gray-500 text-xs mt-2">
              Click on an image to view full size. These are reference images from web search.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleCheckStreetView}
            disabled={nftGenerating || checkingStreetView || !formData.latitude || !formData.longitude}
            className="btn btn-secondary"
          >
            {checkingStreetView ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-white" />
                Checking...
              </span>
            ) : (
              'Check Street View'
            )}
          </button>
          <button
            onClick={handleGenerateNFT}
            disabled={nftGenerating}
            className="btn btn-primary"
          >
            {nftGenerating ? 'Generating NFT...' : 'Generate NFT'}
          </button>
          <button onClick={resetForm} className="btn bg-gray-700 text-white hover:bg-gray-600">
            Reset Form
          </button>
        </div>

        {/* Loading Indicator */}
        {nftGenerating && (
          <div className="mt-6 p-4 bg-blue-600/20 border border-blue-600/50 rounded-[3px]">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary" />
              <div>
                <p className="text-blue-400 font-medium">Generating NFT...</p>
                <p className="text-gray-400 text-sm">
                  This may take 1-3 minutes. Fetching Street View, transforming with AI, uploading to IPFS...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Generation Result */}
      {nftGenerationResult && (
        <GenerationResult result={nftGenerationResult} />
      )}

      {/* Pipeline Info */}
      <PipelineInfo />
    </div>
  );
};

const GenerationResult = ({ result }) => {
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registerError, setRegisterError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  // Category mapping: standard=0, plus=1, premium=2
  const categoryMap = { standard: 0, plus: 1, premium: 2 };

  const handleRegisterOnBlockchain = async () => {
    setRegistering(true);
    setRegisterError(null);

    try {
      // Connect wallet first
      const address = await getCurrentAddress();
      if (!address) {
        await connectWallet();
      }

      // Check if already registered
      const isRegistered = await isFlagRegistered(result.flag_id);
      if (isRegistered) {
        setRegistered(true);
        setRegisterError('Flag is already registered on the blockchain!');
        return;
      }

      // Get category from result or default to standard
      const category = categoryMap[result.category?.toLowerCase()] ?? 0;

      // Default price based on category (in MATIC) - from config
      const prices = { 0: config.prices.standard, 1: config.prices.plus, 2: config.prices.premium };
      const price = prices[category];

      const response = await registerFlagSimple(result.flag_id, category, price);
      setTxHash(response.transactionHash);
      setRegistered(true);
    } catch (error) {
      console.error('Error registering flag:', error);
      setRegisterError(error.message || 'Failed to register flag on blockchain');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="card p-6" data-animate="zoom-in" data-duration="normal">
      <h3 className="text-xl font-bold text-white mb-4">
        {result.success ? 'NFT Generated Successfully!' : 'Generation Failed'}
      </h3>

      {result.success ? (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-dark-darker rounded-[3px] p-4">
              <span className="text-gray-500 text-sm block">Flag ID</span>
              <span className="text-white font-medium">{result.flag_id}</span>
            </div>
            <div className="bg-dark-darker rounded-[3px] p-4">
              <span className="text-gray-500 text-sm block">Flag Name</span>
              <span className="text-white font-medium">{result.flag_name}</span>
            </div>
            <div className="bg-dark-darker rounded-[3px] p-4">
              <span className="text-gray-500 text-sm block">Coordinates</span>
              <span className="text-white font-medium">{result.coordinates}</span>
            </div>
            <div className="bg-dark-darker rounded-[3px] p-4">
              <span className="text-gray-500 text-sm block">Metadata Hash (SHA-256)</span>
              <span className="text-primary font-mono text-xs break-all">{result.metadata_hash}</span>
            </div>
          </div>

          <div className="bg-dark-darker rounded-[3px] p-4">
            <span className="text-gray-500 text-sm block mb-2">Image IPFS Hash</span>
            <div className="flex items-center gap-2">
              <span className="text-primary font-mono text-sm break-all">{result.image_ipfs_hash}</span>
              <a
                href={`${config.ipfsGateway}/${result.image_ipfs_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary text-xs py-1 px-2"
              >
                View Image
              </a>
            </div>
          </div>

          <div className="bg-dark-darker rounded-[3px] p-4">
            <span className="text-gray-500 text-sm block mb-2">Metadata IPFS Hash</span>
            <div className="flex items-center gap-2">
              <span className="text-primary font-mono text-sm break-all">{result.metadata_ipfs_hash}</span>
              <a
                href={`${config.ipfsGateway}/${result.metadata_ipfs_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary text-xs py-1 px-2"
              >
                View Metadata
              </a>
            </div>
          </div>

          <p className="text-green-400 text-sm">{result.message}</p>

          {/* Blockchain Registration Section */}
          <div className="bg-yellow-600/20 border border-yellow-600/50 rounded-[3px] p-4">
            <h4 className="text-yellow-400 font-medium mb-2">Step 2: Register on Blockchain</h4>
            <p className="text-gray-400 text-sm mb-3">
              The flag has been created in the database. To enable purchases, you must register it on the blockchain.
            </p>

            {registered ? (
              <div className="bg-green-600/20 border border-green-600/50 rounded-[3px] p-3">
                <p className="text-green-400 font-medium">Flag registered on blockchain!</p>
                {txHash && (
                  <a
                    href={`${config.networkConfig.blockExplorerUrls[0]}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-sm hover:underline"
                  >
                    View Transaction
                  </a>
                )}
              </div>
            ) : (
              <button
                onClick={handleRegisterOnBlockchain}
                disabled={registering}
                className="btn btn-primary"
              >
                {registering ? 'Registering...' : 'Register on Blockchain'}
              </button>
            )}

            {registerError && (
              <p className="text-red-400 text-sm mt-2">{registerError}</p>
            )}
          </div>

          <button
            onClick={() => window.location.href = `/flags/${result.flag_id}`}
            className="btn btn-secondary"
          >
            View Flag Page
          </button>
        </div>
      ) : (
        <div className="text-red-400">
          <p>{result.message || 'An error occurred during NFT generation.'}</p>
        </div>
      )}
    </div>
  );
};

const PipelineInfo = () => (
  <div className="card p-6" data-animate="fade-up" data-duration="normal">
    <h3 className="text-lg font-bold text-white mb-4">NFT Generation Pipeline</h3>
    <div className="grid md:grid-cols-5 gap-4 text-center">
      <div className="bg-dark-darker p-4 rounded-[3px]">
        <div className="text-2xl mb-2">1</div>
        <span className="text-gray-400 text-sm">Fetch Street View Image</span>
      </div>
      <div className="bg-dark-darker p-4 rounded-[3px]">
        <div className="text-2xl mb-2">2</div>
        <span className="text-gray-400 text-sm">AI Transformation (Replicate)</span>
      </div>
      <div className="bg-dark-darker p-4 rounded-[3px]">
        <div className="text-2xl mb-2">3</div>
        <span className="text-gray-400 text-sm">Upload Image to IPFS</span>
      </div>
      <div className="bg-dark-darker p-4 rounded-[3px]">
        <div className="text-2xl mb-2">4</div>
        <span className="text-gray-400 text-sm">Create & Upload Metadata</span>
      </div>
      <div className="bg-dark-darker p-4 rounded-[3px]">
        <div className="text-2xl mb-2">5</div>
        <span className="text-gray-400 text-sm">Save Flag to Database</span>
      </div>
    </div>
  </div>
);

export default GenerateNFTTab;
