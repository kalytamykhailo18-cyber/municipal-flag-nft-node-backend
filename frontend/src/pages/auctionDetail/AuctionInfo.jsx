/**
 * Auction Info - Title, status, and stats section
 */
import config from '../../config';
import { formatTimeRemaining, getCategoryBadgeClass } from './utils';

const AuctionInfo = ({ auction, isEnded, currentHighestBid }) => {
  return (
    <>
      <h1
        data-animate="fade-down"
        data-duration="normal"
        className="text-3xl font-bold text-white mb-2"
      >
        {auction.flag?.name || `Flag #${auction.flag_id}`}
      </h1>

      {/* Status Badge */}
      <div
        data-animate="fade-up"
        data-duration="normal"
        className="mb-6 flex gap-2"
      >
        <span className={`badge ${isEnded ? 'bg-gray-600' : 'bg-green-600'} text-white`}>
          {auction.status === 'active' ? (isEnded ? 'Time Ended' : 'Active') : auction.status}
        </span>
        {auction.status === 'closed' && auction.winner_category && (
          <span className={`px-2 py-1 text-xs rounded border ${getCategoryBadgeClass(auction.winner_category)}`}>
            Winner: {auction.winner_category.charAt(0).toUpperCase() + auction.winner_category.slice(1)}
          </span>
        )}
      </div>

      {/* Auction Stats */}
      <div
        data-animate="fade-up"
        data-duration="normal"
        className="card p-6 mb-6"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Starting Price:</span>
            <span className="text-white font-semibold">
              {config.formatPrice(auction.starting_price)} POL
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Minimum Bid:</span>
            <span className="text-gray-300">
              {config.formatPrice(auction.min_price)} POL
            </span>
          </div>
          {auction.buyout_price && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Buyout Price:</span>
              <span className="text-yellow-400 font-semibold">
                {config.formatPrice(auction.buyout_price)} POL
              </span>
            </div>
          )}
          <div className="flex justify-between items-center border-t border-gray-700 pt-4">
            <span className="text-gray-400">Current Bid:</span>
            <span className="text-primary text-xl font-bold">
              {config.formatPrice(currentHighestBid)} POL
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Time Remaining:</span>
            <span className={`font-semibold ${isEnded ? 'text-gray-500' : 'text-green-400'}`}>
              {formatTimeRemaining(auction.ends_at, isEnded)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Total Bids:</span>
            <span className="text-white font-semibold">{auction.bid_count || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Ends At:</span>
            <span className="text-white font-semibold">
              {new Date(auction.ends_at).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuctionInfo;
