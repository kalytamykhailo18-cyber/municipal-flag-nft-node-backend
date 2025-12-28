/**
 * Empty State - Displayed when no regions available
 */
const EmptyState = () => {
  return (
    <div
      data-animate="fade-up"
      data-duration="slow"
      className="text-center py-16"
    >
      <p className="text-gray-400">No regions available in this country.</p>
    </div>
  );
};

export default EmptyState;
