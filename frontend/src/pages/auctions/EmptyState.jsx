/**
 * Empty State - Displayed when no auctions found
 */
const EmptyState = ({ showAll }) => {
  return (
    <div
      data-animate="zoom-in"
      data-duration="slow"
      className="text-center py-20"
    >
      <div className="card max-w-md mx-auto p-8">
        <h3 className="text-xl text-white mb-2">No Auctions Found</h3>
        <p className="text-gray-400">
          {showAll
            ? 'There are no auctions in the system yet.'
            : 'There are no active auctions at the moment. Check back later!'}
        </p>
      </div>
    </div>
  );
};

export default EmptyState;
