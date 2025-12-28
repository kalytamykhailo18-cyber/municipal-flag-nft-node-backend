/**
 * Auctions Header - Title and filter controls
 */
const AuctionsHeader = ({ showAll, onShowAllChange }) => {
  return (
    <div className="page-header">
      <div className="flex justify-between items-center">
        <div>
          <h1
            data-animate="fade-down"
            data-duration="normal"
            className="page-title"
          >
            Auctions
          </h1>
          <p
            data-animate="fade-up"
            data-duration="normal"
            className="page-subtitle"
          >
            Bid on flags from other collectors
          </p>
        </div>
        <div
          data-animate="fade-left"
          data-duration="normal"
          className="flex items-center gap-4"
        >
          <label className="flex items-center gap-2 text-gray-400">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => onShowAllChange(e.target.checked)}
              className="rounded bg-dark-lighter border-gray-600"
            />
            Show closed auctions
          </label>
        </div>
      </div>
    </div>
  );
};

export default AuctionsHeader;
