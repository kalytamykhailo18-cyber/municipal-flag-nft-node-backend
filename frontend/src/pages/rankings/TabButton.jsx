/**
 * Tab Button - Ranking type selector button
 */
const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    data-animate="fade-up"
    data-duration="fast"
    className={`px-4 py-2 rounded-[3px] font-medium transition-colors ${
      active
        ? 'bg-primary text-white'
        : 'text-gray-400 hover:text-white hover:bg-gray-800'
    }`}
  >
    {children}
  </button>
);

export default TabButton;
