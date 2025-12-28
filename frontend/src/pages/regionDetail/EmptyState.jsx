/**
 * Empty State - Displayed when no municipalities available
 */
const EmptyState = () => {
  return (
    <div
      data-animate="fade-up"
      data-duration="slow"
      className="text-center py-16"
    >
      <p className="text-gray-400">No municipalities available in this region.</p>
    </div>
  );
};

export default EmptyState;
