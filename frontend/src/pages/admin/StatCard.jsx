/**
 * StatCard - Displays a single statistic with label
 */
const StatCard = ({ label, value, index = 0 }) => (
  <div
    className="card p-4 text-center"
    data-animate="zoom-in"
    data-duration="fast"
  >
    <span className="text-2xl font-bold text-primary block">{value}</span>
    <span className="text-gray-400 text-sm">{label}</span>
  </div>
);

export default StatCard;
