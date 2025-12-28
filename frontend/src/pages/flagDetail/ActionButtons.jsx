/**
 * Action Buttons - Claim and purchase buttons
 */
import config from '../../config';

const ActionButtons = ({
  flag,
  nftsRequired,
  discountedPrice,
  userOwnsFirstNFT,
  hasUserInterest,
  isActionLoading,
  interestLoading,
  claimLoading,
  purchaseLoading,
  onShowInterest,
  onClaimFirst,
  onPurchaseSecond
}) => {
  const discountedPricePerNft = discountedPrice ? parseFloat(discountedPrice) : parseFloat(flag.price);
  const totalDiscountedPrice = discountedPricePerNft * nftsRequired;

  if (flag.is_pair_complete) {
    return (
      <div
        data-animate="fade-up"
        data-duration="normal"
        className="space-y-3 mb-8"
      >
        <div className="card p-4 bg-primary/10 border-primary/30 text-center">
          <p className="text-primary">This flag pair has been completed</p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-animate="fade-up"
      data-duration="normal"
      className="space-y-3 mb-8"
    >
      {!userOwnsFirstNFT && (
        <>
          {!hasUserInterest && (
            <button
              onClick={onShowInterest}
              disabled={isActionLoading}
              className="btn btn-secondary w-full"
            >
              {interestLoading ? 'Registering Interest...' : 'Show Interest'}
            </button>
          )}
          <button
            onClick={onClaimFirst}
            disabled={isActionLoading}
            className="btn btn-primary w-full"
          >
            {claimLoading ? 'Claiming NFT...' : (
              nftsRequired > 1
                ? `Claim First ${nftsRequired} NFTs (Free)`
                : 'Claim First NFT (Free)'
            )}
          </button>
        </>
      )}
      {userOwnsFirstNFT && flag.second_nft_status?.toLowerCase() === 'available' && (
        <button
          onClick={onPurchaseSecond}
          disabled={isActionLoading}
          className="btn btn-primary w-full"
        >
          {purchaseLoading ? 'Purchasing NFT...' : (
            nftsRequired > 1
              ? `Purchase ${nftsRequired} Second NFTs (${config.formatPrice(totalDiscountedPrice)} MATIC)`
              : `Purchase Second NFT (${config.formatPrice(discountedPrice || flag.price)} MATIC)`
          )}
        </button>
      )}
    </div>
  );
};

export default ActionButtons;
