/**
 * Rankings List - Display list of rankings
 */
import RankingItem from './RankingItem';

const RankingsList = ({ rankings, tab }) => {
  return (
    <div
      data-animate="fade-up"
      data-duration="normal"
      className="card"
    >
      {rankings.length > 0 ? (
        rankings.map((item) => (
          <RankingItem key={item.rank} item={item} tab={tab} />
        ))
      ) : (
        <div className="p-8 text-center">
          <p className="text-gray-500">No data available</p>
        </div>
      )}
    </div>
  );
};

export default RankingsList;
