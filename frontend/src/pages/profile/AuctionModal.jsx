/**
 * Auction Modal - Create auction form modal
 */
const AuctionModal = ({
  show,
  selectedFlag,
  auctionData,
  creating,
  onClose,
  onSubmit,
  onDataChange
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div
        data-animate="zoom-in"
        data-duration="fast"
        className="card max-w-md w-full p-6 animate"
      >
        <h3 className="text-xl font-bold text-white mb-4">Create Auction</h3>
        <p className="text-gray-400 mb-4">Flag #{selectedFlag?.flag_id}</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Starting Price (POL)
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              required
              value={auctionData.starting_price}
              onChange={(e) => onDataChange({ ...auctionData, starting_price: e.target.value })}
              className="w-full px-4 py-2 bg-dark-darker border border-gray-700 rounded-[3px] text-white focus:border-primary focus:outline-none"
              placeholder="0.05"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Duration (hours)
            </label>
            <select
              value={auctionData.duration_hours}
              onChange={(e) => onDataChange({ ...auctionData, duration_hours: e.target.value })}
              className="w-full px-4 py-2 bg-dark-darker border border-gray-700 rounded-[3px] text-white focus:border-primary focus:outline-none"
            >
              <option value="24">1 Day</option>
              <option value="72">3 Days</option>
              <option value="168">7 Days</option>
              <option value="336">14 Days</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create Auction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuctionModal;
