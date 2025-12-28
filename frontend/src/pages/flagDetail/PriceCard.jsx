/**
 * Price Card - Price display section
 */
import config from '../../config';

const PriceCard = ({ flag, nftsRequired, discountedPrice }) => {
  const basePricePerNft = parseFloat(flag.price);
  const totalBasePrice = basePricePerNft * nftsRequired;
  const discountedPricePerNft = discountedPrice ? parseFloat(discountedPrice) : basePricePerNft;
  const totalDiscountedPrice = discountedPricePerNft * nftsRequired;

  return (
    <div
      data-animate="fade-up"
      data-duration="normal"
      className="card p-6 mb-6"
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-400">Price per NFT:</span>
        <span className="text-white font-semibold">{config.formatPrice(flag.price)} MATIC</span>
      </div>

      {nftsRequired > 1 && (
        <div className="flex justify-between items-center mb-2 pt-2 border-t border-gray-700">
          <span className="text-gray-400">Total Price ({nftsRequired} NFTs):</span>
          <span className="text-primary font-bold text-lg">{config.formatPrice(totalBasePrice)} MATIC</span>
        </div>
      )}

      {discountedPrice && parseFloat(discountedPrice) !== basePricePerNft && (
        <>
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-700">
            <span className="text-gray-400">Your Price per NFT:</span>
            <span className="text-green-400 font-semibold">{config.formatPrice(discountedPrice)} MATIC</span>
          </div>
          {nftsRequired > 1 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Your Total Price:</span>
              <span className="text-green-400 font-bold text-lg">{config.formatPrice(totalDiscountedPrice)} MATIC</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PriceCard;
