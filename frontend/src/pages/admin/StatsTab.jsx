/**
 * StatsTab - Admin statistics overview
 */
import StatCard from './StatCard';

const StatsTab = ({ stats }) => {
  if (!stats) return <div className="text-gray-500">Loading statistics...</div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <StatCard label="Countries" value={stats.total_countries} index={0} />
      <StatCard label="Regions" value={stats.total_regions} index={1} />
      <StatCard label="Municipalities" value={stats.total_municipalities} index={2} />
      <StatCard label="Flags" value={stats.total_flags} index={3} />
      <StatCard label="Users" value={stats.total_users} index={4} />
      <StatCard label="Interests" value={stats.total_interests} index={5} />
      <StatCard label="Ownerships" value={stats.total_ownerships} index={6} />
      <StatCard label="Auctions" value={stats.total_auctions} index={7} />
      <StatCard label="Active Auctions" value={stats.active_auctions} index={8} />
      <StatCard label="Completed Pairs" value={stats.completed_pairs} index={9} />
    </div>
  );
};

export default StatsTab;
