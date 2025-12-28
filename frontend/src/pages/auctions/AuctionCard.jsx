/**
 * Auction Card - Individual auction display card
 */
import { useNavigate } from 'react-router-dom';
import config from '../../config';
import { formatTimeRemaining, getCategoryBadgeClass } from './utils';

const AuctionCard = ({ auction }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/auctions/${auction.id}`)}
      data-animate="fade-up"
      data-duration="normal"
      className="card card-hover card-animate overflow-hidden relative cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/auctions/${auction.id}`)}
    >
      {/* Status Badge */}
      <div className="absolute top-2 right-2 z-10">
        {auction.status === 'active' ? (
          <span className="px-2 py-1 text-xs rounded bg-green-500/20 text-green-400 border border-green-500/50">
            Active
          </span>
        ) : auction.status === 'closed' ? (
          <span className="px-2 py-1 text-xs rounded bg-gray-500/20 text-gray-400 border border-gray-500/50">
            Closed
          </span>
        ) : (
          <span className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-400 border border-red-500/50">
            Cancelled
          </span>
        )}
      </div>

      {/* Buyout Badge */}
      {auction.buyout_price && auction.status === 'active' && (
        <div className="absolute top-2 left-2 z-10">
          <span className="px-2 py-1 text-xs rounded bg-primary/20 text-primary border border-primary/50">
            Buyout Available
          </span>
        </div>
      )}

      <div className="aspect-video bg-dark-darker flex items-center justify-center">
        {auction.flag?.image_ipfs_hash ? (
          <img
            src={config.getIpfsUrl(auction.flag.image_ipfs_hash)}
            alt="Flag"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-gray-600 text-lg">Flag #{auction.flag_id}</div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-white font-semibold mb-2">
          {auction.flag?.location_type || `Flag #${auction.flag_id}`}
        </h3>

        {/* Current Bid */}
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400 text-sm">Current Bid:</span>
          <span className="text-primary font-semibold">
            {config.formatPrice(auction.current_highest_bid || auction.starting_price)} MATIC
          </span>
        </div>

        {/* Min Price */}
        <div className="flex justify-between items-center mb-2 text-sm">
          <span className="text-gray-500">Min Bid:</span>
          <span className="text-gray-400">
            {config.formatPrice(auction.min_price)} MATIC
          </span>
        </div>

        {/* Buyout Price */}
        {auction.buyout_price && (
          <div className="flex justify-between items-center mb-2 text-sm">
            <span className="text-gray-500">Buyout:</span>
            <span className="text-yellow-400 font-semibold">
              {config.formatPrice(auction.buyout_price)} MATIC
            </span>
          </div>
        )}

        {/* Winner Category (for closed auctions) */}
        {auction.status === 'closed' && auction.winner_category && (
          <div className="flex justify-between items-center mb-2 text-sm">
            <span className="text-gray-500">Winner:</span>
            <span className={`px-2 py-0.5 text-xs rounded border ${getCategoryBadgeClass(auction.winner_category)}`}>
              {auction.winner_category.charAt(0).toUpperCase() + auction.winner_category.slice(1)}
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center text-sm text-gray-500 mt-3 pt-3 border-t border-gray-700">
          <span>{auction.bid_count} bids</span>
          <span className={auction.status === 'active' ? 'text-green-400' : ''}>
            {auction.status === 'active'
              ? formatTimeRemaining(auction.ends_at)
              : new Date(auction.ends_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AuctionCard;
