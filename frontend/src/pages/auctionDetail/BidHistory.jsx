/**
 * Bid History - List of all bids on the auction
 */
import config from '../../config';
import { getCategoryBadgeClass } from './utils';

const BidHistory = ({ auction }) => {
  if (!auction.bids || auction.bids.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2
        data-animate="fade-right"
        data-duration="normal"
        className="text-xl font-bold text-white mb-4"
      >
        Bid History ({auction.bids.length})
      </h2>
      <div
        data-animate="fade-up"
        data-duration="normal"
        className="card divide-y divide-gray-800"
      >
        {auction.bids.map((bid) => (
          <div
            key={bid.id}
            data-animate="fade-right"
            data-duration="fast"
            className="p-4 flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="text-white font-mono text-sm">
                  {config.truncateAddress(bid.bidder?.wallet_address, 8)}
                </p>
                {bid.bidder_category && (
                  <span className={`px-2 py-0.5 text-xs rounded border ${getCategoryBadgeClass(bid.bidder_category)}`}>
                    {bid.bidder_category.charAt(0).toUpperCase() + bid.bidder_category.slice(1)}
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm">
                {new Date(bid.created_at).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-primary font-semibold">
                {config.formatPrice(bid.amount)} POL
              </p>
              {bid.bidder_id === auction.highest_bidder_id && (
                <span className="text-xs text-yellow-600">Highest Bid</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BidHistory;
