/**
 * Buyout Section - Instant buyout option
 */
import config from '../../config';

const BuyoutSection = ({
  auction,
  isEnded,
  isSeller,
  isConnected,
  buyingOut,
  actionLoading,
  onConnect,
  onBuyout
}) => {
  if (isEnded || auction.status !== 'active' || !auction.buyout_price || isSeller) {
    return null;
  }

  return (
    <div
      data-animate="bounce-in"
      data-duration="normal"
      className="card p-6 mb-6 bg-yellow-500/10 border-yellow-500/30"
    >
      <h3 className="text-yellow-400 font-semibold mb-2">Instant Buyout</h3>
      <p className="text-gray-400 text-sm mb-4">
        Skip the bidding and purchase this flag instantly for {config.formatPrice(auction.buyout_price)} POL
      </p>
      {!isConnected ? (
        <button onClick={onConnect} className="btn bg-yellow-500 hover:bg-yellow-600 text-black w-full">
          Connect Wallet to Buyout
        </button>
      ) : (
        <button
          onClick={onBuyout}
          className="btn bg-yellow-500 hover:bg-yellow-600 text-black w-full"
          disabled={buyingOut || actionLoading}
        >
          {buyingOut ? 'Processing Buyout...' : `Buyout for ${config.formatPrice(auction.buyout_price)} POL`}
        </button>
      )}
    </div>
  );
};

export default BuyoutSection;
