/**
 * Flag Image - Image section with badges
 */
import config from '../../config';

const FlagImage = ({ flag, nftsRequired, isRevealing }) => {
  const imageUrl = flag.image_ipfs_hash
    ? config.getIpfsUrl(flag.image_ipfs_hash)
    : `https://placehold.co/500x500/1a1a2e/e94560?text=${encodeURIComponent(flag.location_type)}`;

  return (
    <div>
      <div
        data-animate="zoom-in"
        data-duration="slow"
        className={`card overflow-hidden ${isRevealing ? 'animate-flip' : ''}`}
      >
        <img src={imageUrl} alt={flag.name} className="w-full aspect-square object-cover" />
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
        <span className={`badge ${flag.is_pair_complete ? 'badge-complete' : flag.first_nft_status?.toLowerCase() === 'claimed' ? 'badge-claimed' : 'badge-available'}`}>
          {flag.is_pair_complete ? 'Complete' : flag.first_nft_status?.toLowerCase() === 'claimed' ? 'First Claimed' : 'Available'}
        </span>
      </div>
    </div>
  );
};

export default FlagImage;
