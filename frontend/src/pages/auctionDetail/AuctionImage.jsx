/**
 * Auction Image - Flag image and info section
 */
import { useNavigate } from 'react-router-dom';
import config from '../../config';

const AuctionImage = ({ auction }) => {
  const navigate = useNavigate();

  const imageUrl = auction.flag?.image_ipfs_hash
    ? config.getIpfsUrl(auction.flag.image_ipfs_hash)
    : null;

  return (
    <div>
      <div
        data-animate="zoom-in"
        data-duration="slow"
        className="card overflow-hidden relative"
      >
        {/* Buyout Badge */}
        {auction.buyout_price && auction.status === 'active' && (
          <div className="absolute top-2 right-2 z-10">
            <span className="px-3 py-1 text-sm rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/50">
              Buyout: {config.formatPrice(auction.buyout_price)} POL
            </span>
          </div>
        )}

        {imageUrl ? (
          <img src={imageUrl} alt="Flag" className="w-full aspect-square object-cover" />
        ) : (
          <div className="w-full aspect-square bg-dark-darker flex items-center justify-center">
            <div className="text-gray-600 text-lg">Flag #{auction.flag_id}</div>
          </div>
        )}
      </div>

      {/* Flag Info */}
      {auction.flag && (
        <div
          data-animate="fade-up"
          data-duration="normal"
          className="mt-4"
        >
          <button
            onClick={() => navigate(`/flags/${auction.flag_id}`)}
            className="text-primary hover:text-primary-light bg-transparent border-none cursor-pointer"
          >
            View Flag Details
          </button>
          <div className="flex gap-2 mt-2">
            {auction.flag.category && (
              <span className={`badge badge-${auction.flag.category.toLowerCase()}`}>
                {auction.flag.category}
              </span>
            )}
            {auction.flag.location_type && (
              <span className="badge badge-available">{auction.flag.location_type}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionImage;
