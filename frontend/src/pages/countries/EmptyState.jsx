/**
 * Empty State - Displayed when no countries available
 */
const EmptyState = () => {
  return (
    <div
      data-animate="fade-up"
      data-duration="slow"
      className="text-center py-16"
    >
      <p className="text-gray-400">No countries available. Please seed the demo data.</p>
    </div>
  );
};

export default EmptyState;
