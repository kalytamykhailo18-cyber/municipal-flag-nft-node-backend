/**
 * Flag Card Component - Displays a flag with its details
 * Refactored to use useNavigate instead of Link
 *
 * MATCHING GAME FEATURE:
 * - Flags are shown as mystery cards (hidden) until user claims the first NFT
 * - Only after claiming the first NFT (free), the flag image is revealed
 * - This gamifies the discovery process
 *
 * MULTI-NFT FEATURE:
 * Displays the number of NFTs required to obtain a flag.
 * - nfts_required=1: Shows standard price
 * - nfts_required=3: Shows "3x NFTs" badge and total price (price * 3)
 */
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAddress } from '../store/slices/walletSlice';
import config from '../config';

const FlagCard = ({ flag, showMunicipality = false, index = 0 }) => {
  const navigate = useNavigate();
  const userAddress = useSelector(selectAddress);

  // MULTI-NFT: Calculate total price based on NFTs required
  const nftsRequired = flag.nfts_required || 1;
  const totalPrice = parseFloat(flag.price) * nftsRequired;

  // MATCHING GAME: Check if current user has claimed/revealed this flag
  // A flag is revealed ONLY if the current user:
  // 1. Has shown interest in this flag, OR
  // 2. Owns any NFT of this flag
  // Note: Even completed pairs stay hidden to users who haven't interacted
  const isRevealed = (() => {
    // If no wallet connected, nothing is revealed
    if (!userAddress) return false;

    // If user has shown interest, they can see the card
    const hasInterest = flag.interests?.some(
      i => i.user?.wallet_address?.toLowerCase() === userAddress?.toLowerCase()
    );
    if (hasInterest) return true;

    // If user owns any NFT of this flag
    const ownsNft = flag.ownerships?.some(
      o => o.user?.wallet_address?.toLowerCase() === userAddress?.toLowerCase()
    );
    if (ownsNft) return true;

    return false;
  })();

  const handleClick = () => {
    navigate(`/flags/${flag.id}`);
  };

  const getStatusBadge = () => {
    if (flag.is_pair_complete) {
      return <span className="badge badge-complete">Complete</span>;
    }
    if (flag.first_nft_status === 'claimed') {
      return <span className="badge badge-claimed">First Claimed</span>;
    }
    return <span className="badge badge-available">Available</span>;
  };

  const getCategoryBadge = () => {
    const category = flag.category.toLowerCase();
    const styles = {
      standard: 'text-gray-100 border-gray-500',
      plus: 'text-blue-400 border-blue-500',
      premium: 'text-yellow-400 border-yellow-500 font-bold',
    };
    const colorClass = styles[category] || styles.standard;
    return (
      <span
        className={`badge border ${colorClass}`}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      >
        {flag.category}
      </span>
    );
  };

  /**
   * MULTI-NFT: Badge showing how many NFTs are required
   * Only displayed when nfts_required > 1 (grouped NFT flags)
   */
  const getNftRequirementBadge = () => {
    if (nftsRequired <= 1) return null;
    return (
      <span className="badge bg-purple-600/80 text-purple-100">
        {nftsRequired}x NFTs
      </span>
    );
  };

  const getImageUrl = () => {
    if (flag.image_ipfs_hash) {
      return config.getIpfsUrl(flag.image_ipfs_hash);
    }
    // Use placehold.co as fallback (more reliable than via.placeholder.com)
    return `https://placehold.co/300x300/1a1a2e/e94560?text=${encodeURIComponent(flag.location_type)}`;
  };

  // MATCHING GAME: Mystery card component
  const MysteryCard = () => (
    <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-dark to-dark-darker">
      {/* Mystery pattern background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(233, 69, 96, 0.1) 10px,
            rgba(233, 69, 96, 0.1) 20px
          )`
        }} />
      </div>

      {/* Question mark icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

      {/* Category badge still visible */}
      <div className="absolute top-3 left-3 flex flex-wrap gap-2">
        {getCategoryBadge()}
        {getNftRequirementBadge()}
      </div>

      {/* Mystery label */}
      <div className="absolute bottom-3 left-3 right-3">
        <span className="badge bg-dark/80 text-gray-300 border border-gray-600 w-full justify-center py-1">
          Mystery Flag
        </span>
      </div>
    </div>
  );

  // MATCHING GAME: Revealed card component
  const RevealedCard = () => (
    <div className="relative aspect-square overflow-hidden">
      <img
        src={getImageUrl()}
        alt={flag.name}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        onError={(e) => {
          e.target.src = `https://placehold.co/300x300/1a1a2e/e94560?text=${encodeURIComponent(flag.location_type)}`;
        }}
      />
      <div className="absolute top-3 left-3 flex flex-wrap gap-2">
        {getCategoryBadge()}
        {getNftRequirementBadge()}
        {getStatusBadge()}
      </div>
    </div>
  );

  return (
    <div
      onClick={handleClick}
      className="card card-hover group block cursor-pointer"
      data-animate="fade-up"
      data-duration="normal"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* MATCHING GAME: Show mystery or revealed card based on user's status */}
      {isRevealed ? <RevealedCard /> : <MysteryCard />}

      <div className="p-4">
        {/* MATCHING GAME: Show limited info for mystery cards */}
        {isRevealed ? (
          <>
            <h3 className="font-semibold text-white mb-1 truncate">{flag.location_type}</h3>
            <p className="text-gray-400 text-sm mb-2 truncate">{flag.name}</p>
          </>
        ) : (
          <>
            <h3 className="font-semibold text-white mb-1">Mystery Flag</h3>
            <p className="text-gray-400 text-sm mb-2">Show interest to reveal</p>
          </>
        )}

        {showMunicipality && flag.municipality && isRevealed && (
          <p className="text-gray-500 text-xs mb-2">{flag.municipality.name}</p>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
          {/* MULTI-NFT: Show total price and per-NFT breakdown if grouped */}
          <div className="flex flex-col">
            <span className="text-primary font-medium">
              {config.formatPrice(totalPrice)} MATIC
            </span>
            {nftsRequired > 1 && (
              <span className="text-gray-500 text-xs">
                ({config.formatPrice(flag.price)} x {nftsRequired})
              </span>
            )}
          </div>
          <span className="text-gray-500 text-sm">{flag.interest_count || 0} interested</span>
        </div>
      </div>
    </div>
  );
};

export default FlagCard;
