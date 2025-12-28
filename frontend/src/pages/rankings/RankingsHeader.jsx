/**
 * Rankings Header - Title and subtitle
 */
const RankingsHeader = () => {
  return (
    <div className="page-header">
      <h1
        data-animate="fade-down"
        data-duration="normal"
        className="page-title"
      >
        Rankings
      </h1>
      <p
        data-animate="fade-up"
        data-duration="normal"
        className="page-subtitle"
      >
        Top collectors and most popular flags
      </p>
    </div>
  );
};

export default RankingsHeader;
