/**
 * Mystery View - Hidden flag state before interest is shown
 */
import { useDispatch } from 'react-redux';
import { connectWallet } from '../../store/slices/walletSlice';
import config from '../../config';
import Breadcrumb from './Breadcrumb';
import { animationStyles } from './styles';

const MysteryView = ({
  flag,
  nftsRequired,
  isConnected,
  isActionLoading,
  interestLoading,
  onShowInterest
}) => {
  const dispatch = useDispatch();
  const totalBasePrice = parseFloat(flag.price) * nftsRequired;

  return (
    <div className="page-container">
      <Breadcrumb flag={flag} isMystery={true} />

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Mystery Image Section */}
        <div>
          <div
            data-animate="zoom-in"
            data-duration="slow"
            className="card overflow-hidden relative"
          >
            <div className="w-full aspect-square bg-gradient-to-br from-dark to-dark-darker relative overflow-hidden">
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 20px,
                  rgba(233, 69, 96, 0.1) 20px,
                  rgba(233, 69, 96, 0.1) 40px
                )`
              }} />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 rounded-full bg-primary/20 border-4 border-primary/40 flex items-center justify-center animate-pulse">
                  <svg className="w-20 h-20 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" style={{
                animation: 'shimmer 3s infinite'
              }} />
            </div>
          </div>
          <div
            data-animate="fade-up"
            data-duration="normal"
            className="flex gap-2 mt-4 flex-wrap"
          >
            <span className={`badge badge-${flag.category.toLowerCase()}`}>{flag.category}</span>
            {nftsRequired > 1 && (
              <span className="badge bg-purple-600/80 text-purple-100">
                Requires {nftsRequired} NFTs
              </span>
            )}
            <span className="badge bg-gray-700 text-gray-300">Mystery</span>
          </div>
        </div>

        {/* Mystery Info Section */}
        <div>
          <h1
            data-animate="fade-down"
            data-duration="normal"
            className="text-3xl font-bold text-white mb-2"
          >
            Mystery Flag
          </h1>
          <p
            data-animate="fade-up"
            data-duration="normal"
            className="text-gray-400 mb-6"
          >
            Show interest to reveal this flag's details
          </p>

          {/* Mystery Info Box */}
          <div
            data-animate="fade-right"
            data-duration="normal"
            className="card p-6 mb-6 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold">Discover This Flag</h3>
                <p className="text-gray-400 text-sm">Click below to reveal the flag details</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>See the actual flag image</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Learn about the location</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Claim the first NFT for free</span>
              </div>
            </div>
          </div>

          {/* Price Preview */}
          <div
            data-animate="fade-up"
            data-duration="normal"
            className="card p-6 mb-6"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">Second NFT Price:</span>
              <span className="text-primary font-bold text-lg">
                {config.formatPrice(totalBasePrice)} MATIC
              </span>
            </div>
            {nftsRequired > 1 && (
              <p className="text-gray-500 text-sm">
                ({config.formatPrice(flag.price)} MATIC x {nftsRequired} NFTs)
              </p>
            )}
            <p className="text-gray-500 text-sm mt-2">
              First NFT is always FREE!
            </p>
          </div>

          {/* Show Interest Button */}
          <div
            data-animate="fade-up"
            data-duration="normal"
            className="space-y-3"
          >
            {!isConnected ? (
              <button
                onClick={() => dispatch(connectWallet())}
                className="btn btn-primary w-full py-4 text-lg"
              >
                Connect Wallet to Reveal
              </button>
            ) : (
              <button
                onClick={onShowInterest}
                disabled={isActionLoading}
                className="btn btn-primary w-full py-4 text-lg relative overflow-hidden group"
              >
                <span className="relative z-10">
                  {interestLoading ? 'Revealing...' : 'Show Interest & Reveal Flag'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-pink-500 to-primary bg-[length:200%_100%] animate-gradient opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>

          {/* Interested Users Count */}
          <div
            data-animate="fade-left"
            data-duration="normal"
            className="card p-4 mt-6 text-center"
          >
            <span className="text-gray-400">
              <span className="text-primary font-bold">{flag.interest_count || 0}</span> users interested
            </span>
          </div>
        </div>
      </div>

      <style>{animationStyles}</style>
    </div>
  );
};

export default MysteryView;
