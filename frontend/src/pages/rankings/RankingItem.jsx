/**
 * Ranking Item - Individual ranking row
 */
import config from '../../config';

const RankingItem = ({ item, tab }) => {
  if (tab === 'flags') {
    return (
      <div
        data-animate="fade-right"
        data-duration="fast"
        className="flex items-center gap-4 p-4 border-b border-gray-800 last:border-b-0"
      >
        <span className="text-2xl font-bold text-primary w-10">#{item.rank}</span>
        <div className="flex-1">
          <span className="text-white">{item.flag.location_type}</span>
          <span className="text-gray-500 text-sm ml-2">{item.flag.name.substring(0, 20)}...</span>
        </div>
        <span className="text-gray-400">{item.interest_count} interests</span>
      </div>
    );
  }

  return (
    <div
      data-animate="fade-right"
      data-duration="fast"
      className="flex items-center gap-4 p-4 border-b border-gray-800 last:border-b-0"
    >
      <span className="text-2xl font-bold text-primary w-10">#{item.rank}</span>
      <span className="flex-1 text-white font-mono">
        {config.truncateAddress(item.user.wallet_address, 6)}
      </span>
      <span className="text-gray-400">
        {item.score} {tab === 'users' ? 'pts' : 'flags'}
      </span>
    </div>
  );
};

export default RankingItem;
