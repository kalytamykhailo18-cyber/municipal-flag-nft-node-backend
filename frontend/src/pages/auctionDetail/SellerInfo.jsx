/**
 * Seller Info - Seller and highest bidder information
 */
import config from '../../config';

const SellerInfo = ({ auction }) => {
  return (
    <>
      {/* Seller Info */}
      <div
        data-animate="fade-left"
        data-duration="normal"
        className="card p-6 mb-6"
      >
        <h3 className="text-white font-semibold mb-2">Seller</h3>
        <p className="text-gray-400 font-mono text-sm">
          {config.truncateAddress(auction.seller?.wallet_address, 8)}
        </p>
        {auction.seller?.reputation_score !== undefined && (
          <p className="text-gray-500 text-sm mt-1">
            Reputation: {auction.seller.reputation_score}
          </p>
        )}
      </div>

      {/* Highest Bidder */}
      {auction.highest_bidder && (
        <div
          data-animate="fade-left"
          data-duration="normal"
          className="card p-6 mb-6 bg-primary/10 border-primary/30"
        >
          <h3 className="text-white font-semibold mb-2">Highest Bidder</h3>
          <p className="text-primary font-mono text-sm">
            {config.truncateAddress(auction.highest_bidder.wallet_address, 8)}
          </p>
        </div>
      )}
    </>
  );
};

export default SellerInfo;
