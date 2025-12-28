/**
 * Flags Section - Display owned flags with auction options
 */
import { useNavigate } from 'react-router-dom';

const FlagsSection = ({ flags, isOwnProfile, activeAuctions, onCreateAuction }) => {
  const navigate = useNavigate();

  const hasActiveAuction = (flagId) => {
    return activeAuctions?.some(auction => auction.flag_id === flagId) || false;
  };

  return (
    <section className="mb-8">
      <h2
        data-animate="fade-right"
        data-duration="normal"
        className="text-xl font-bold text-white mb-4"
      >
        {isOwnProfile ? 'My Flags' : 'Flags Owned'} ({flags.length})
      </h2>
      {flags.length > 0 ? (
        <div
          data-animate="fade-up"
          data-duration="normal"
          className="card divide-y divide-gray-800"
        >
          {flags.map((ownership) => {
            const hasAuction = hasActiveAuction(ownership.flag_id);
            return (
              <div
                key={ownership.id}
                data-animate="fade-right"
                data-duration="fast"
                className="flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors"
              >
                <div
                  onClick={() => navigate(`/flags/${ownership.flag_id}`)}
                  className="flex-1 cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/flags/${ownership.flag_id}`)}
                >
                  <span className="text-white">Flag #{ownership.flag_id}</span>
                  <span className="badge badge-available ml-2">{ownership.ownership_type}</span>
                  {hasAuction && (
                    <span className="badge bg-yellow-600 text-white ml-2">In Auction</span>
                  )}
                </div>
                {isOwnProfile && (
                  <button
                    onClick={() => onCreateAuction(ownership)}
                    className="btn btn-primary btn-sm ml-4"
                    disabled={hasAuction}
                  >
                    {hasAuction ? 'Already in Auction' : 'Create Auction'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div
          data-animate="fade-up"
          data-duration="slow"
          className="card p-8 text-center"
        >
          <p className="text-gray-500">You don't own any flags yet</p>
          <button
            onClick={() => navigate('/countries')}
            className="text-primary hover:text-primary-light mt-2 inline-block bg-transparent border-none cursor-pointer"
          >
            Start exploring
          </button>
        </div>
      )}
    </section>
  );
};

export default FlagsSection;
