/**
 * Auction Not Found - Displayed when auction doesn't exist
 */
import { useNavigate } from 'react-router-dom';

const AuctionNotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div
        data-animate="zoom-in"
        data-duration="fast"
        className="text-center py-16"
      >
        <p className="text-red-400">Auction not found</p>
        <button
          onClick={() => navigate('/auctions')}
          className="text-primary hover:text-primary-light mt-4 inline-block bg-transparent border-none cursor-pointer"
        >
          Back to Auctions
        </button>
      </div>
    </div>
  );
};

export default AuctionNotFound;
