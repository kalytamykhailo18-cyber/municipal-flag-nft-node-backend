/**
 * Region Header - Title and subtitle
 */
const RegionHeader = ({ regionName }) => {
  return (
    <div className="page-header">
      <h1
        data-animate="fade-down"
        data-duration="normal"
        className="page-title"
      >
        {regionName}
      </h1>
      <p
        data-animate="fade-up"
        data-duration="normal"
        className="page-subtitle"
      >
        Select a municipality to view its flags
      </p>
    </div>
  );
};

export default RegionHeader;
