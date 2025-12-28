/**
 * Bid Form - Place bid form section
 */
import config from '../../config';

const BidForm = ({
  auction,
  isEnded,
  isSeller,
  isConnected,
  bidAmount,
  bidderCategory,
  bidding,
  actionLoading,
  minBidAmount,
  onConnect,
  onBidAmountChange,
  onBidderCategoryChange,
  onSubmit
}) => {
  if (isEnded || auction.status !== 'active') {
    if (isEnded && auction.status === 'active') {
      return (
        <div
          data-animate="fade-up"
          data-duration="normal"
          className="card p-4 bg-yellow-600/10 border-yellow-600/30 text-center mb-6"
        >
          <p className="text-yellow-600">
            This auction has ended and is waiting to be closed
          </p>
        </div>
      );
    }
    return null;
  }

  return (
    <div
      data-animate="fade-up"
      data-duration="normal"
      className="card p-6 mb-6"
    >
      <h3 className="text-white font-semibold mb-4">Place a Bid</h3>

      {!isConnected ? (
        <button onClick={onConnect} className="btn btn-primary w-full">
          Connect Wallet to Bid
        </button>
      ) : isSeller ? (
        <div className="text-gray-500 text-center py-4">
          You cannot bid on your own auction
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Bid Amount (POL)
            </label>
            <input
              type="number"
              step="0.001"
              min={minBidAmount}
              required
              value={bidAmount}
              onChange={(e) => onBidAmountChange(e.target.value)}
              placeholder={`Min: ${config.formatPrice(minBidAmount)}`}
              className="w-full px-4 py-2 bg-dark-darker border border-gray-700 rounded-[3px] text-white focus:border-primary focus:outline-none"
            />
            <p className="text-gray-500 text-sm mt-1">
              Minimum bid: {config.formatPrice(minBidAmount)} POL
            </p>
          </div>

          {/* Bidder Category Selection */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Your Category (for tie-breaking)
            </label>
            <select
              value={bidderCategory}
              onChange={(e) => onBidderCategoryChange(e.target.value)}
              className="w-full px-4 py-2 bg-dark-darker border border-gray-700 rounded-[3px] text-white focus:border-primary focus:outline-none"
            >
              <option value="standard">Standard</option>
              <option value="plus">Plus</option>
              <option value="premium">Premium</option>
            </select>
            <p className="text-gray-500 text-sm mt-1">
              Higher category wins in case of tied bids (Premium &gt; Plus &gt; Standard)
            </p>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={bidding || actionLoading}
          >
            {bidding ? 'Placing Bid...' : 'Place Bid'}
          </button>
        </form>
      )}
    </div>
  );
};

export default BidForm;
